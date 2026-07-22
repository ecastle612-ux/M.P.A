import { createHash } from "node:crypto";
import { appBaseUrl } from "../email/render";
import type {
  DeviceRegistration,
  NotificationProvider,
  ProviderSendInput,
  ProviderSendResult,
  RegisterDeviceInput
} from "./contracts";

/** OneSignal `url` must be absolute for reliable cold-launch deep links on mobile. */
function absoluteNotificationUrl(href: string | null | undefined): string | undefined {
  if (!href?.trim()) return undefined;
  const value = href.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${appBaseUrl()}${value.startsWith("/") ? "" : "/"}${value}`;
}

/**
 * OneSignal App API adapter (current auth model).
 *
 * Auth: `Authorization: Key <App API Key>` where the key starts with `os_v2_app_`.
 * Base URL: `https://api.onesignal.com` (not legacy onesignal.com/api/v1).
 *
 * Important: `GET /apps/{app_id}` requires an Organization API key and must NOT be used
 * for App API Key health checks — that endpoint returns 403 with a valid app key.
 *
 * OneSignal requires `idempotency_key` to be a UUID. M.P.A. event keys are opaque strings,
 * so we prefer `notificationId` (DB UUID) and otherwise derive a stable UUID from the key.
 */

const ONESIGNAL_API = "https://api.onesignal.com";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** OneSignal App API rejects non-UUID idempotency keys. */
export function toOnesignalIdempotencyKey(notificationId: string, fallbackKey: string): string {
  if (UUID_RE.test(notificationId)) return notificationId;
  if (UUID_RE.test(fallbackKey)) return fallbackKey;
  const hex = createHash("sha256").update(`mpa-onesignal:${fallbackKey}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32)
  ].join("-");
}

function getAppId(): string | null {
  return process.env["ONESIGNAL_APP_ID"]?.trim() || process.env["NEXT_PUBLIC_ONESIGNAL_APP_ID"]?.trim() || null;
}

/** App API Key (Settings → Keys & IDs). Prefer ONESIGNAL_API_KEY; REST alias supported. */
function getAppApiKey(): string | null {
  return process.env["ONESIGNAL_API_KEY"]?.trim() || process.env["ONESIGNAL_REST_API_KEY"]?.trim() || null;
}

function credentialsReady(): boolean {
  return Boolean(getAppId() && getAppApiKey());
}

function isCurrentAppApiKey(apiKey: string): boolean {
  return apiKey.startsWith("os_v2_app_");
}

function formatOnesignalErrors(errors: unknown): string {
  if (typeof errors === "string" && errors.trim()) return errors;
  if (Array.isArray(errors)) {
    return errors
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .filter(Boolean)
      .join("; ");
  }
  if (errors && typeof errors === "object") {
    return JSON.stringify(errors);
  }
  return "OneSignal request failed";
}

function authorizationHeader(apiKey: string): string {
  // Current docs: Authorization: Key os_v2_app_...
  // Also accepted historically as "key " (lowercase); OneSignal normalizes the scheme.
  return `Key ${apiKey}`;
}

async function onesignalFetch(path: string, init?: RequestInit): Promise<Response> {
  const apiKey = getAppApiKey();
  if (!apiKey) {
    throw new Error("ONESIGNAL_API_KEY is not configured");
  }
  return fetch(`${ONESIGNAL_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorizationHeader(apiKey),
      ...(init?.headers ?? {})
    }
  });
}

export const onesignalProvider: NotificationProvider = {
  key: "onesignal",

  async registerDevice(input: RegisterDeviceInput): Promise<DeviceRegistration> {
    // Subscription IDs are created client-side via Web SDK; server persists them.
    return {
      deviceId: "onesignal-pending",
      providerKey: "onesignal",
      externalSubscriptionId: input.externalSubscriptionId,
      isActive: true
    };
  },

  async unregisterDevice(): Promise<void> {
    // Soft-deactivate is handled in NotificationService / resident_devices.
    return;
  },

  async send(input: ProviderSendInput): Promise<ProviderSendResult> {
    if (!credentialsReady()) {
      return {
        status: "failed",
        errorCode: "missing_credentials",
        errorMessage: "ONESIGNAL_APP_ID or ONESIGNAL_API_KEY (App API Key) is not configured"
      };
    }

    const apiKey = getAppApiKey()!;
    if (!isCurrentAppApiKey(apiKey)) {
      return {
        status: "failed",
        errorCode: "invalid_api_key_format",
        errorMessage:
          "ONESIGNAL_API_KEY must be a current App API Key starting with os_v2_app_. Create one in OneSignal → Settings → Keys & IDs."
      };
    }

    if (input.externalSubscriptionIds.length === 0) {
      return { status: "skipped", errorCode: "no_devices", errorMessage: "No active push subscriptions" };
    }

    const appId = getAppId()!;
    const idempotencyKey = toOnesignalIdempotencyKey(input.notificationId, input.idempotencyKey);
    const launchUrl = absoluteNotificationUrl(input.href);
    try {
      const response = await onesignalFetch("/notifications", {
        method: "POST",
        body: JSON.stringify({
          app_id: appId,
          target_channel: "push",
          include_subscription_ids: input.externalSubscriptionIds,
          headings: { en: input.title },
          contents: { en: input.body },
          data: {
            organization_id: input.organizationId,
            notification_id: input.notificationId,
            category: input.category,
            priority: input.priority,
            href: launchUrl ?? input.href ?? "",
            mpa_idempotency_key: input.idempotencyKey,
            ...(input.data ?? {})
          },
          url: launchUrl,
          // OneSignal requires UUID idempotency_key; keep M.P.A. key in data for debugging.
          idempotency_key: idempotencyKey,
          collapse_id: input.collapseKey ?? undefined,
          priority: input.priority === "emergency" || input.priority === "high" ? 10 : 5
        })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        id?: string;
        errors?: unknown;
      };

      if (!response.ok) {
        return {
          status: "failed",
          errorCode: `http_${response.status}`,
          errorMessage: formatOnesignalErrors(payload.errors),
          raw: undefined
        };
      }

      // 200 with no id usually means no matching subscriptions in the audience.
      if (!payload.id) {
        return {
          status: "skipped",
          errorCode: "no_recipients",
          errorMessage: "OneSignal accepted the request but created no message (no matching subscriptions).",
          externalId: null
        };
      }

      return {
        status: "sent",
        externalId: payload.id
      };
    } catch (error) {
      return {
        status: "failed",
        errorCode: "network",
        errorMessage: error instanceof Error ? error.message : "OneSignal network error"
      };
    }
  },

  async health() {
    if (!credentialsReady()) {
      return { ok: false, detail: "OneSignal credentials missing" };
    }

    const apiKey = getAppApiKey()!;
    if (!isCurrentAppApiKey(apiKey)) {
      return {
        ok: false,
        detail:
          "ONESIGNAL_API_KEY is not a current App API Key (expected prefix os_v2_app_). Legacy REST keys and Key IDs are rejected by OneSignal."
      };
    }

    const appId = getAppId()!;
    try {
      // App-scoped probe. Do NOT use GET /apps/{id} — that requires an Organization API key.
      const response = await onesignalFetch(
        `/notifications?app_id=${encodeURIComponent(appId)}&limit=1&offset=0`,
        { method: "GET" }
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { errors?: unknown };
        return {
          ok: false,
          detail: `OneSignal App API Key rejected (HTTP ${response.status}). ${formatOnesignalErrors(payload.errors)}`
        };
      }
      return { ok: true, detail: `OneSignal App API authenticated for app ${appId}` };
    } catch (error) {
      return {
        ok: false,
        detail: error instanceof Error ? error.message : "OneSignal health network error"
      };
    }
  }
};

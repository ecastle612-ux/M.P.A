import { getEmailDeliveryTelemetry } from "./audit";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendApiKey,
  validateEmailConfiguration
} from "./config";
import type {
  EmailConfigValidation,
  EmailHealthResult,
  EmailProvider,
  SendEmailInput,
  SendEmailResult
} from "./contracts";

const RESEND_API = "https://api.resend.com";
const PER_ATTEMPT_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [500, 2000] as const;
const HEALTH_TIMEOUT_MS = 5_000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractFromDomain(from: string): string | null {
  const match = /<([^>]+)>/.exec(from) ?? /([^\s@]+@[^\s@]+)/.exec(from);
  const address = match?.[1] ?? from;
  const at = address.lastIndexOf("@");
  if (at < 0) return null;
  return address.slice(at + 1).toLowerCase();
}

function mapErrorCode(status: number, message: string): string {
  if (status === 401 || status === 403) return "authentication_error";
  if (status === 422) return "validation_error";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "provider_unavailable";
  if (message.toLowerCase().includes("timeout")) return "timeout";
  return `http_${status}`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

async function probeDomains(apiKey: string): Promise<{
  ok: boolean;
  detail: string;
  verifiedDomain: boolean | null;
  domainName: string | null;
}> {
  const from = getEmailFrom();
  const expectedDomain = from ? extractFromDomain(from) : null;
  try {
    const response = await fetchWithTimeout(
      `${RESEND_API}/domains`,
      { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } },
      HEALTH_TIMEOUT_MS
    );
    if (!response.ok) {
      return {
        ok: false,
        detail: `Resend domains probe HTTP ${response.status}`,
        verifiedDomain: null,
        domainName: expectedDomain
      };
    }
    const body = (await response.json().catch(() => null)) as {
      data?: Array<{ name?: string; status?: string }>;
    } | null;
    const domains = Array.isArray(body?.data) ? body.data : [];
    const match = expectedDomain
      ? domains.find((d) => (d.name ?? "").toLowerCase() === expectedDomain)
      : domains.find((d) => (d.status ?? "").toLowerCase() === "verified");
    const verified =
      match != null
        ? (match.status ?? "").toLowerCase() === "verified"
        : domains.some((d) => (d.status ?? "").toLowerCase() === "verified");
    return {
      ok: true,
      detail: verified
        ? `Resend API authenticated; domain verified${expectedDomain ? ` (${expectedDomain})` : ""}.`
        : `Resend API authenticated; sending domain not verified${expectedDomain ? ` (${expectedDomain})` : ""}.`,
      verifiedDomain: verified,
      domainName: match?.name ?? expectedDomain
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resend network error";
    return {
      ok: false,
      detail: message.includes("abort") ? "Resend health probe timeout" : message,
      verifiedDomain: null,
      domainName: expectedDomain
    };
  }
}

async function sendOnce(input: SendEmailInput, apiKey: string, from: string): Promise<SendEmailResult> {
  const replyTo = input.replyTo?.trim() || getEmailReplyTo() || undefined;
  const payload: Record<string, unknown> = {
    from,
    to: [input.to.name ? `${input.to.name} <${input.to.email}>` : input.to.email],
    subject: input.subject,
    html: input.html
  };
  if (input.text) payload["text"] = input.text;
  if (replyTo) payload["reply_to"] = replyTo;
  if (input.tags) {
    payload["tags"] = Object.entries(input.tags).map(([name, value]) => ({ name, value }));
  }

  try {
    const response = await fetchWithTimeout(
      `${RESEND_API}/emails`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Idempotency-Key": input.idempotencyKey.slice(0, 256)
        },
        body: JSON.stringify(payload)
      },
      PER_ATTEMPT_TIMEOUT_MS
    );

    const requestId = response.headers.get("x-request-id") ?? response.headers.get("ratelimit-id");
    const body = (await response.json().catch(() => null)) as {
      id?: string;
      message?: string;
      name?: string;
      statusCode?: number;
    } | null;

    if (!response.ok) {
      const message = body?.message ?? `Resend HTTP ${response.status}`;
      return {
        status: "failed",
        providerKey: "resend",
        requestId,
        errorCode: mapErrorCode(response.status, message),
        errorMessage: message,
        rawSafe: { httpStatus: response.status, name: body?.name ?? null }
      };
    }

    return {
      status: "sent",
      providerKey: "resend",
      externalId: body?.id ?? null,
      requestId,
      rawSafe: { httpStatus: response.status }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resend network error";
    const timedOut = message.toLowerCase().includes("abort");
    return {
      status: "failed",
      providerKey: "resend",
      errorCode: timedOut ? "timeout" : "network_error",
      errorMessage: timedOut ? "Resend request timed out" : message
    };
  }
}

function shouldRetry(result: SendEmailResult): boolean {
  if (result.status !== "failed") return false;
  const code = result.errorCode ?? "";
  return (
    code === "timeout" ||
    code === "network_error" ||
    code === "rate_limited" ||
    code === "provider_unavailable" ||
    code.startsWith("http_5")
  );
}

export const resendProvider: EmailProvider = {
  key: "resend",

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const email = input.to.email?.trim().toLowerCase() ?? "";
    if (!email || !EMAIL_RE.test(email)) {
      return {
        status: "failed",
        providerKey: "resend",
        errorCode: "invalid_recipient",
        errorMessage: "Recipient email is missing or invalid"
      };
    }

    const config = await validateEmailConfiguration("resend");
    if (!config.valid) {
      return {
        status: "failed",
        providerKey: "resend",
        errorCode: "configuration_error",
        errorMessage: `Missing configuration: ${config.missing.join(", ") || "unknown"}`
      };
    }

    const apiKey = getResendApiKey();
    const from = getEmailFrom();
    if (!apiKey || !from) {
      return {
        status: "failed",
        providerKey: "resend",
        errorCode: "configuration_error",
        errorMessage: "RESEND_API_KEY or EMAIL_FROM is not configured"
      };
    }

    let last: SendEmailResult = {
      status: "failed",
      providerKey: "resend",
      errorCode: "unknown",
      errorMessage: "No attempt made"
    };

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      last = await sendOnce({ ...input, to: { ...input.to, email } }, apiKey, from);
      if (!shouldRetry(last)) return last;
      const backoff = BACKOFF_MS[attempt];
      if (backoff != null) await sleep(backoff + Math.floor(Math.random() * 100));
    }

    return last;
  },

  async health(): Promise<EmailHealthResult> {
    const telemetry = getEmailDeliveryTelemetry();
    const config = await validateEmailConfiguration("resend");
    const apiKey = getResendApiKey();
    if (!config.valid || !apiKey) {
      return {
        ok: false,
        providerKey: "resend",
        detail: `Configuration incomplete: ${(config.missing.length ? config.missing : ["unknown"]).join(", ")}`,
        verifiedDomain: null,
        domainName: getEmailFrom() ? extractFromDomain(getEmailFrom()!) : null,
        lastSuccessAt: telemetry.lastSuccessAt,
        lastFailureAt: telemetry.lastFailureAt,
        lastFailureMessage: telemetry.lastFailureMessage,
        lastDeliveryAt: telemetry.lastDeliveryAt
      };
    }

    const probe = await probeDomains(apiKey);
    return {
      ok: probe.ok,
      providerKey: "resend",
      detail: probe.detail,
      verifiedDomain: probe.verifiedDomain,
      domainName: probe.domainName,
      lastSuccessAt: telemetry.lastSuccessAt,
      lastFailureAt: telemetry.lastFailureAt,
      lastFailureMessage: telemetry.lastFailureMessage,
      lastDeliveryAt: telemetry.lastDeliveryAt
    };
  },

  async validateConfiguration(): Promise<EmailConfigValidation> {
    return validateEmailConfiguration("resend");
  }
};

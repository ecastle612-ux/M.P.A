/**
 * Client OneSignal / local push subscription helpers (API-001A).
 * Does not call NotificationService — only obtains a subscription id for device registration.
 *
 * Enrollment sequence follows OneSignal Web SDK docs (LC-001N / LC-001O):
 * init once → requestPermission (only if needed) → optIn when not subscribed →
 * wait for PushSubscription "change" (id + optedIn) → register device with server.
 */

const SDK_SRC = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
/**
 * Match OneSignal dashboard Typical site config (sync payload):
 * path `/`, worker `OneSignalSDKWorker.js`, scope `/`, customizationEnabled=false.
 * The root worker also hosts PWA offline handlers (see public/OneSignalSDKWorker.js).
 * Subdirectory copy at /push/onesignal/ remains for a future dashboard custom-path cutover.
 */
const ONESIGNAL_SERVICE_WORKER_DIR = "/";
const ONESIGNAL_SERVICE_WORKER_FILE = "OneSignalSDKWorker.js";
const ONESIGNAL_SERVICE_WORKER_SCOPE = "/";
const ENROLLMENT_TIMEOUT_MS = 30_000;

/** Session-scoped: OneSignal.init() must run at most once per browser tab. */
let onesignalInitPromise: Promise<void> | null = null;

type OneSignalInitOptions = {
  appId: string;
  allowLocalhostAsSecureOrigin?: boolean;
  /** Directory hosting the worker (leading slash OK). Joined with serviceWorkerPath. */
  path?: string;
  serviceWorkerPath?: string;
  serviceWorkerParam?: { scope?: string };
};

type OneSignalPushSubscriptionSnapshot = {
  id?: string | null;
  token?: string | null;
  optedIn?: boolean;
};

type OneSignalPushSubscriptionChangeEvent = {
  previous: OneSignalPushSubscriptionSnapshot;
  current: OneSignalPushSubscriptionSnapshot;
};

type OneSignalPushSubscription = {
  id?: string | null;
  optedIn?: boolean;
  optIn?: () => Promise<void> | void;
  addEventListener?: (
    event: "change",
    listener: (event: OneSignalPushSubscriptionChangeEvent) => void
  ) => void;
  removeEventListener?: (
    event: "change",
    listener: (event: OneSignalPushSubscriptionChangeEvent) => void
  ) => void;
};

type OneSignalClient = {
  init: (options: OneSignalInitOptions) => Promise<void>;
  Notifications: { requestPermission: () => Promise<boolean | string> };
  User: { PushSubscription: OneSignalPushSubscription };
};

type WindowWithOneSignal = Window & {
  OneSignalDeferred?: Array<(onesignal: OneSignalClient) => void>;
  OneSignal?: OneSignalClient;
};

function getWindow(): WindowWithOneSignal | null {
  if (typeof window === "undefined") return null;
  return window as WindowWithOneSignal;
}

/** Ensure OneSignalDeferred exists before the SDK script loads. */
export function ensureOneSignalDeferredQueue(): void {
  const win = getWindow();
  if (!win) return;
  if (!Array.isArray(win.OneSignalDeferred)) {
    win.OneSignalDeferred = [];
  }
}

export function loadOneSignalSdkScript(): void {
  const win = getWindow();
  if (!win) return;
  ensureOneSignalDeferredQueue();
  if (document.querySelector('script[data-mpa-onesignal="true"]')) return;
  const script = document.createElement("script");
  script.src = SDK_SRC;
  script.async = true;
  script.dataset["mpaOnesignal"] = "true";
  document.head.appendChild(script);
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}

function isBrowserPermissionGranted(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

function readSubscriptionId(pushSubscription: OneSignalPushSubscription): string | null {
  const id = pushSubscription.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function isOptedIn(pushSubscription: OneSignalPushSubscription): boolean {
  return pushSubscription.optedIn === true;
}

/**
 * Wait until OneSignal reports a subscribed PushSubscription with an id.
 * Prefer the documented "change" listener; also accept already-ready state.
 */
function waitForSubscribedPushSubscription(
  pushSubscription: OneSignalPushSubscription
): Promise<string> {
  const existingId = readSubscriptionId(pushSubscription);
  if (existingId && isOptedIn(pushSubscription)) {
    return Promise.resolve(existingId);
  }

  return new Promise<string>((resolve, reject) => {
    if (typeof pushSubscription.addEventListener !== "function") {
      reject(new Error("OneSignal PushSubscription change listener is unavailable."));
      return;
    }

    const onChange = (event: OneSignalPushSubscriptionChangeEvent) => {
      const id = typeof event.current.id === "string" && event.current.id.length > 0 ? event.current.id : null;
      if (id && event.current.optedIn === true) {
        pushSubscription.removeEventListener?.("change", onChange);
        resolve(id);
      }
    };

    pushSubscription.addEventListener("change", onChange);

    // Re-check after attach in case the subscription became ready between reads.
    const id = readSubscriptionId(pushSubscription);
    if (id && isOptedIn(pushSubscription)) {
      pushSubscription.removeEventListener?.("change", onChange);
      resolve(id);
    }
  });
}

export type PushSubscriptionResult =
  | { status: "granted"; subscriptionId: string; via: "onesignal" | "local" }
  | { status: "denied" }
  | { status: "error"; message: string };

/**
 * Request permission and resolve a subscription id.
 * When NEXT_PUBLIC_ONESIGNAL_APP_ID is set, uses OneSignal Web SDK.
 * Otherwise registers a local subscription id for noop/dev.
 */
export async function obtainPushSubscription(options?: {
  appId?: string | null;
  timeoutMs?: number;
}): Promise<PushSubscriptionResult> {
  const appId = options?.appId ?? process.env["NEXT_PUBLIC_ONESIGNAL_APP_ID"] ?? null;
  const timeoutMs = options?.timeoutMs ?? ENROLLMENT_TIMEOUT_MS;
  const win = getWindow();
  if (!win) {
    return { status: "error", message: "Push registration requires a browser" };
  }

  if (typeof Notification !== "undefined" && Notification.permission === "denied") {
    return { status: "denied" };
  }

  if (!appId) {
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return { status: "denied" };
    }
    return { status: "granted", subscriptionId: `local-${crypto.randomUUID()}`, via: "local" };
  }

  ensureOneSignalDeferredQueue();
  loadOneSignalSdkScript();

  try {
    const subscriptionId = await withTimeout(
      new Promise<string>((resolve, reject) => {
        const ensureInitialized = async (oneSignal: OneSignalClient): Promise<void> => {
          if (!onesignalInitPromise) {
            onesignalInitPromise = oneSignal
              .init({
                appId,
                allowLocalhostAsSecureOrigin: true,
                path: ONESIGNAL_SERVICE_WORKER_DIR,
                serviceWorkerPath: ONESIGNAL_SERVICE_WORKER_FILE,
                serviceWorkerParam: { scope: ONESIGNAL_SERVICE_WORKER_SCOPE }
              })
              .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : String(error);
                if (/already initialized/i.test(message)) {
                  return;
                }
                onesignalInitPromise = null;
                throw error instanceof Error ? error : new Error("OneSignal init failed");
              });
          }
          await onesignalInitPromise;
        };

        const run = async (oneSignal: OneSignalClient) => {
          try {
            // 1) Initialize exactly once.
            await ensureInitialized(oneSignal);

            // 2) Request browser permission only when not already granted.
            if (!isBrowserPermissionGranted()) {
              const permissionResult = await oneSignal.Notifications.requestPermission();
              const granted =
                permissionResult === true ||
                permissionResult === "granted" ||
                isBrowserPermissionGranted();
              if (!granted) {
                reject(new Error("Push permission was not granted."));
                return;
              }
            }

            const pushSubscription = oneSignal.User.PushSubscription;

            // 3) Opt in when OneSignal has no subscription id or is not opted in.
            const needsOptIn = !isOptedIn(pushSubscription) || !readSubscriptionId(pushSubscription);
            if (needsOptIn) {
              if (typeof pushSubscription.optIn !== "function") {
                reject(new Error("OneSignal PushSubscription.optIn() is unavailable."));
                return;
              }
              await pushSubscription.optIn();
            }

            // 4) Wait for documented change event: id + optedIn === true.
            const id = await waitForSubscribedPushSubscription(pushSubscription);
            resolve(id);
          } catch (error) {
            reject(error instanceof Error ? error : new Error("OneSignal enrollment failed"));
          }
        };

        // Mutually exclusive paths: never push deferred AND call run(OneSignal).
        if (win.OneSignal) {
          void run(win.OneSignal);
        } else {
          win.OneSignalDeferred = win.OneSignalDeferred ?? [];
          win.OneSignalDeferred.push((oneSignal) => {
            void run(oneSignal);
          });
        }
      }),
      timeoutMs,
      "Push enrollment timed out waiting for OneSignal subscription. Try again from Settings."
    );

    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      return { status: "denied" };
    }
    return { status: "granted", subscriptionId, via: "onesignal" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to initialize push";
    if (/permission was not granted/i.test(message)) {
      return { status: "denied" };
    }
    return { status: "error", message };
  }
}

export type EnrolledViaClient = "onboarding_banner" | "settings" | "pwa" | "qr_join";

const DEVICE_REGISTER_TIMEOUT_MS = 20_000;

export async function registerDeviceWithServer(input: {
  subscriptionId: string;
  propertyId?: string | null;
  enrolledVia?: EnrolledViaClient;
  deviceLabel?: string;
  timeoutMs?: number;
}): Promise<{ ok: true } | { ok: false; message: string; timedOut?: boolean }> {
  const timeoutMs = input.timeoutMs ?? DEVICE_REGISTER_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("/api/notifications/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        externalSubscriptionId: input.subscriptionId,
        platform: "web",
        propertyId: input.propertyId ?? null,
        enrolledVia: input.enrolledVia ?? "settings",
        deviceLabel: input.deviceLabel ?? "Web browser"
      })
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      return { ok: false, message: payload.error ?? payload.message ?? "Registration failed" };
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        timedOut: true,
        message: "Notification enrollment timed out. Refresh and try again from Settings."
      };
    }
    return { ok: false, message: error instanceof Error ? error.message : "Registration failed" };
  } finally {
    clearTimeout(timer);
  }
}

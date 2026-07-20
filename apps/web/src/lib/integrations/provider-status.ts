export type ProviderConnectionStatus =
  | "production_ready"
  | "connected"
  | "sandbox"
  | "configuration_required"
  | "disabled";

export type ProviderStatusItem = {
  id: string;
  name: string;
  category: string;
  status: ProviderConnectionStatus;
  statusLabel: string;
  /** Human environment label — never includes secrets. */
  environment: string;
  guidance: string;
  /** Recommended next operator action. */
  nextAction: string;
  /** Last successful communication summary (probe or webhook), or null. */
  lastCommunication: string | null;
  /** Last sanitized error, or null. Never includes secrets. */
  lastError: string | null;
  webhookReady: boolean | null;
  /** Email providers: verified sending domain posture. */
  verifiedDomain?: string | null;
  /** Email providers: last delivery attempt summary. */
  lastDelivery?: string | null;
};

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function statusLabel(status: ProviderConnectionStatus): string {
  switch (status) {
    case "production_ready":
      return "Production Ready";
    case "connected":
      return "Connected";
    case "sandbox":
      return "Sandbox";
    case "configuration_required":
      return "Configuration Required";
    case "disabled":
      return "Disabled";
  }
}

function sanitizeDetail(detail: string): string {
  return detail
    .replace(/sk_(live|test)_[A-Za-z0-9]+/g, "sk_***")
    .replace(/rk_live_[A-Za-z0-9]+/g, "rk_***")
    .replace(/os_v2_app_[A-Za-z0-9]+/g, "os_v2_app_***")
    .replace(/re_[A-Za-z0-9]+/g, "re_***")
    .replace(/whsec_[A-Za-z0-9]+/g, "whsec_***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***")
    .replace(/Key\s+os_v2_app_\S+/gi, "Key os_v2_app_***");
}

type ModeKind = "live" | "sandbox" | "unknown";

function resolveProviderPosture(input: {
  selected: boolean;
  credentialsPresent: boolean;
  mode: ModeKind;
  webhookConfigured?: boolean | null;
  webhookRequiredForProduction?: boolean;
}): ProviderConnectionStatus {
  if (!input.selected) return "disabled";
  if (!input.credentialsPresent) return "configuration_required";
  if (input.mode === "sandbox") return "sandbox";
  if (
    input.mode === "live" &&
    input.webhookRequiredForProduction &&
    input.webhookConfigured === false
  ) {
    return "connected";
  }
  if (input.mode === "live") return "production_ready";
  return "connected";
}

function stripeMode(): ModeKind {
  const key = env("STRIPE_SECRET_KEY");
  const mode = (env("STRIPE_MODE") ?? "").toLowerCase();
  if (mode === "sandbox" || mode === "test") return "sandbox";
  if (key?.startsWith("sk_test_")) return "sandbox";
  if (key?.startsWith("sk_live_")) return "live";
  if (mode === "live" || mode === "production") return "live";
  return key ? "live" : "unknown";
}

function genericMode(modeEnv: string | undefined, fallbackWhenCreds: ModeKind): ModeKind {
  const mode = (modeEnv ?? "").toLowerCase();
  if (mode === "sandbox" || mode === "test" || mode === "development") return "sandbox";
  if (mode === "live" || mode === "production") return "live";
  return fallbackWhenCreds;
}

function environmentLabel(status: ProviderConnectionStatus, mode: ModeKind): string {
  if (status === "disabled") return "Disabled (noop / not selected)";
  if (status === "configuration_required") return "Configuration incomplete";
  if (status === "sandbox" || mode === "sandbox") return "Sandbox";
  if (status === "production_ready") return "Production";
  if (mode === "live") return "Production (partial)";
  return "Unknown";
}

/**
 * Synchronous status matrix for chips/banners (env-derived, no network).
 */
export function getProviderStatusCenter(): ProviderStatusItem[] {
  const stripeProvider = (env("PAYMENT_PROVIDER") ?? "noop").toLowerCase();
  const stripeSelected = stripeProvider === "stripe";
  const stripeCreds = hasValue(env("STRIPE_SECRET_KEY"));
  const stripeModeKind = stripeMode();
  const stripeWebhook = hasValue(env("STRIPE_WEBHOOK_SECRET"));
  const stripeStatus = resolveProviderPosture({
    selected: stripeSelected,
    credentialsPresent: stripeCreds,
    mode: stripeModeKind,
    webhookConfigured: stripeWebhook,
    webhookRequiredForProduction: true
  });

  const checkrProvider = (env("SCREENING_PROVIDER") ?? "noop").toLowerCase();
  const checkrSelected = checkrProvider === "checkr";
  const checkrCreds = hasValue(env("CHECKR_API_KEY"));
  const checkrModeKind = genericMode(
    env("CHECKR_MODE") ?? (env("CHECKR_SANDBOX") === "true" ? "sandbox" : undefined),
    checkrCreds ? "live" : "unknown"
  );
  const checkrWebhook = hasValue(env("CHECKR_WEBHOOK_SECRET"));
  const checkrStatus = resolveProviderPosture({
    selected: checkrSelected,
    credentialsPresent: checkrCreds,
    mode: checkrModeKind,
    webhookConfigured: checkrWebhook,
    webhookRequiredForProduction: true
  });

  const signatureProvider = (env("SIGNATURE_PROVIDER") ?? "noop").toLowerCase();
  const dropboxSelected = signatureProvider === "dropbox_sign" || signatureProvider === "hellosign";
  const dropboxCreds = hasValue(env("DROPBOX_SIGN_API_KEY") ?? env("HELLOSIGN_API_KEY"));
  const dropboxModeKind = genericMode(env("DROPBOX_SIGN_MODE"), dropboxCreds ? "live" : "unknown");
  const dropboxWebhook = hasValue(env("DROPBOX_SIGN_WEBHOOK_SECRET") ?? env("HELLOSIGN_WEBHOOK_SECRET"));
  const dropboxStatus = resolveProviderPosture({
    selected: dropboxSelected,
    credentialsPresent: dropboxCreds,
    mode: dropboxModeKind,
    webhookConfigured: dropboxWebhook,
    webhookRequiredForProduction: true
  });

  const notificationProvider = (env("NOTIFICATION_PROVIDER") ?? "noop").toLowerCase();
  const onesignalSelected = notificationProvider === "onesignal";
  const onesignalCreds =
    hasValue(env("ONESIGNAL_APP_ID") ?? env("NEXT_PUBLIC_ONESIGNAL_APP_ID")) &&
    hasValue(env("ONESIGNAL_API_KEY") ?? env("ONESIGNAL_REST_API_KEY"));
  const appUrl = env("NEXT_PUBLIC_APP_URL") ?? "";
  const onesignalProdOrigin =
    appUrl.includes("my-property-assistant.com") || appUrl.startsWith("https://");
  const onesignalStatus = resolveProviderPosture({
    selected: onesignalSelected,
    credentialsPresent: onesignalCreds,
    mode: onesignalSelected && onesignalCreds ? (onesignalProdOrigin ? "live" : "sandbox") : "unknown"
  });

  const smsProvider = (env("SMS_PROVIDER") ?? "noop").toLowerCase();
  const twilioSelected =
    smsProvider === "twilio" ||
    (smsProvider !== "noop" && hasValue(env("TWILIO_ACCOUNT_SID")));
  const twilioCreds =
    hasValue(env("TWILIO_ACCOUNT_SID")) && hasValue(env("TWILIO_AUTH_TOKEN"));
  const twilioModeKind = genericMode(env("TWILIO_MODE"), twilioCreds ? "live" : "unknown");
  // SMS delivery adapter is not in production path — never claim Production Ready.
  const twilioDisplayStatus: ProviderConnectionStatus =
    !twilioSelected && smsProvider === "noop"
      ? "disabled"
      : twilioCreds
        ? "sandbox"
        : twilioSelected
          ? "configuration_required"
          : "disabled";

  const mapsKey =
    env("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") ?? env("GOOGLE_MAPS_API_KEY") ?? env("GOOGLE_MAPS_KEY");
  const mapsStatus = resolveProviderPosture({
    selected: hasValue(mapsKey),
    credentialsPresent: hasValue(mapsKey),
    mode: "live"
  });

  const emailProvider = (env("EMAIL_PROVIDER") ?? "noop").toLowerCase();
  const resendSelected = emailProvider === "resend";
  const resendCreds = hasValue(env("RESEND_API_KEY")) && hasValue(env("EMAIL_FROM"));
  const resendModeKind = genericMode(
    env("EMAIL_ENVIRONMENT") ?? env("RESEND_MODE"),
    resendCreds ? "live" : "unknown"
  );
  // Sync matrix — Production Ready requires live probe (verified domain) in buildProviderHealthDashboard.
  const resendDisplayStatus: ProviderConnectionStatus =
    !resendSelected && emailProvider === "noop" && !hasValue(env("RESEND_API_KEY"))
      ? "disabled"
      : resendSelected && !resendCreds
        ? "configuration_required"
        : resendSelected && resendCreds
          ? resendModeKind === "live"
            ? "connected"
            : "sandbox"
          : hasValue(env("RESEND_API_KEY"))
            ? "sandbox"
            : "disabled";

  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const supabaseService = env("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseStatus = resolveProviderPosture({
    selected: hasValue(supabaseUrl),
    credentialsPresent: hasValue(supabaseUrl) && hasValue(supabaseAnon),
    mode: "live"
  });
  const supabaseDisplayStatus: ProviderConnectionStatus =
    supabaseStatus === "production_ready" && !supabaseService ? "connected" : supabaseStatus;

  const items: Array<Omit<ProviderStatusItem, "statusLabel">> = [
    {
      id: "supabase",
      name: "Supabase",
      category: "Platform",
      status: supabaseDisplayStatus,
      environment: environmentLabel(supabaseDisplayStatus, "live"),
      guidance:
        supabaseDisplayStatus === "disabled" || supabaseDisplayStatus === "configuration_required"
          ? "Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for Auth, database, and storage."
          : "Auth, Postgres, and Storage route through Supabase. Confirm Auth redirect URLs match this host.",
      nextAction:
        !supabaseService
          ? "Set SUPABASE_SERVICE_ROLE_KEY on the server for signed media URLs and admin jobs."
          : "Verify Auth redirect allow-list and Storage CORS for this environment.",
      lastCommunication: null,
      lastError: null,
      webhookReady: null
    },
    {
      id: "stripe",
      name: "Stripe",
      category: "Payments",
      status: stripeStatus,
      environment: environmentLabel(stripeStatus, stripeModeKind),
      guidance:
        stripeStatus === "disabled"
          ? "PAYMENT_PROVIDER is not stripe. Resident payments use the noop adapter until Stripe is selected."
          : stripeStatus === "configuration_required"
            ? "Set STRIPE_SECRET_KEY (and webhook secret) before collecting payments."
            : stripeStatus === "sandbox"
              ? "Stripe is in sandbox/test mode. Safe for Design Partner demos; not live rent collection."
              : "Stripe credentials are live. Confirm webhooks point at this host before Commercial Pilot.",
      nextAction:
        stripeStatus === "disabled"
          ? "Set PAYMENT_PROVIDER=stripe with a test key for sandbox certification."
          : !stripeWebhook
            ? "Add STRIPE_WEBHOOK_SECRET and register the production webhook endpoint."
            : stripeStatus === "sandbox"
              ? "Keep STRIPE_ALLOW_SIMULATE=false in production; switch to sk_live_ only when ready."
              : "Run a test payment_intent.succeeded delivery against the production webhook.",
      lastCommunication: null,
      lastError: null,
      webhookReady: stripeSelected ? stripeWebhook : null
    },
    {
      id: "resend",
      name: "Resend",
      category: "Email",
      status: resendDisplayStatus,
      environment: environmentLabel(resendDisplayStatus, resendModeKind),
      guidance:
        resendDisplayStatus === "disabled"
          ? "EMAIL_PROVIDER=noop. Outbound transactional email is disabled. Password reset remains Supabase Auth."
          : resendDisplayStatus === "configuration_required"
            ? "EMAIL_PROVIDER=resend but RESEND_API_KEY and/or EMAIL_FROM are missing."
            : resendDisplayStatus === "sandbox"
              ? "Resend adapter is active in a non-production environment. Safe for Design Partner demos after inbox verification."
              : "Resend adapter is selected with credentials. Production Ready requires verified domain + live delivery certification.",
      nextAction:
        resendDisplayStatus === "disabled"
          ? "Set EMAIL_PROVIDER=resend with RESEND_API_KEY, EMAIL_FROM, and EMAIL_ENVIRONMENT when ready for outbound mail."
          : resendDisplayStatus === "configuration_required"
            ? "Add RESEND_API_KEY and EMAIL_FROM (verified domain address) to the server environment."
            : "Verify SPF/DKIM for the sending domain in Resend, then confirm a real inbox delivery.",
      lastCommunication: null,
      lastError: null,
      webhookReady: null,
      verifiedDomain: null,
      lastDelivery: null
    },
    {
      id: "twilio",
      name: "Twilio",
      category: "SMS",
      status: twilioDisplayStatus,
      environment: environmentLabel(twilioDisplayStatus, twilioModeKind),
      guidance:
        twilioDisplayStatus === "disabled"
          ? "SMS delivery is disabled. Preferences may show SMS options as unavailable until INT-302 ships."
          : "Twilio credentials detected. SMS send adapter is not in the production path — status is informational only.",
      nextAction:
        twilioDisplayStatus === "disabled"
          ? "Leave SMS_PROVIDER=noop for Design Partners; communicate that SMS is not enabled."
          : "Do not enable resident SMS until the approved Twilio adapter and consent flows are implemented.",
      lastCommunication: null,
      lastError: null,
      webhookReady: null
    },
    {
      id: "onesignal",
      name: "OneSignal",
      category: "Push notifications",
      status: onesignalStatus,
      environment: environmentLabel(onesignalStatus, onesignalSelected && onesignalCreds ? "live" : "unknown"),
      guidance:
        onesignalStatus === "disabled"
          ? "NOTIFICATION_PROVIDER is not onesignal. Push uses the noop adapter."
          : onesignalStatus === "configuration_required"
            ? "Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY (App API Key os_v2_app_…)."
            : "Push delivery uses OneSignal. Confirm site origin and service worker paths for this host.",
      nextAction:
        onesignalStatus === "disabled"
          ? "Set NOTIFICATION_PROVIDER=onesignal with production App ID for Design Partner push."
          : !onesignalProdOrigin
            ? "Set NEXT_PUBLIC_APP_URL to the production HTTPS origin and allow it in OneSignal."
            : "Confirm subscription state in Profile → Notifications; avoid repeated enable prompts after denial.",
      lastCommunication: null,
      lastError: null,
      webhookReady: null
    },
    {
      id: "dropbox_sign",
      name: "Dropbox Sign",
      category: "Signatures",
      status: dropboxStatus,
      environment: environmentLabel(dropboxStatus, dropboxModeKind),
      guidance:
        dropboxStatus === "disabled"
          ? "SIGNATURE_PROVIDER is not dropbox_sign. Lease signing uses the noop adapter."
          : dropboxStatus === "sandbox"
            ? "Dropbox Sign sandbox is active — suitable for Design Partner lease signing demos."
            : "Dropbox Sign credentials present. Verify webhook + redirect URLs on this host.",
      nextAction:
        dropboxStatus === "disabled"
          ? "Set SIGNATURE_PROVIDER=dropbox_sign with a sandbox API key to certify e-sign."
          : !dropboxWebhook
            ? "Add DROPBOX_SIGN_WEBHOOK_SECRET and register the webhook for this host."
            : "Send a sandbox signature request through an existing lease package workflow.",
      lastCommunication: null,
      lastError: null,
      webhookReady: dropboxSelected ? dropboxWebhook : null
    },
    {
      id: "checkr",
      name: "Checkr",
      category: "Screening",
      status: checkrStatus,
      environment: environmentLabel(checkrStatus, checkrModeKind),
      guidance:
        checkrStatus === "disabled"
          ? "SCREENING_PROVIDER is not checkr. Screening uses the local noop/sandbox simulator."
          : checkrStatus === "sandbox"
            ? "Checkr sandbox mode — safe for Design Partner applicant demos."
            : "Checkr credentials present. Confirm webhook secret before live reports.",
      nextAction:
        checkrStatus === "disabled"
          ? "Set SCREENING_PROVIDER=checkr with sandbox credentials to certify screening."
          : !checkrWebhook
            ? "Add CHECKR_WEBHOOK_SECRET before production screening."
            : "Run one sandbox order through the existing applicant screening workflow.",
      lastCommunication: null,
      lastError: null,
      webhookReady: checkrSelected ? checkrWebhook : null
    },
    {
      id: "google_maps",
      name: "Google Maps",
      category: "Location",
      status: mapsStatus === "disabled" ? "disabled" : mapsStatus === "configuration_required" ? "configuration_required" : "connected",
      environment: hasValue(mapsKey) ? "Configured" : "Disabled",
      guidance: hasValue(mapsKey)
        ? "Maps API key is present. Restrict HTTP referrers to this host in Google Cloud Console."
        : "Maps enrichment is optional and currently disabled.",
      nextAction: hasValue(mapsKey)
        ? "Confirm key restrictions match production and staging hosts."
        : "Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY when address autocomplete is required.",
      lastCommunication: null,
      lastError: null,
      webhookReady: null
    }
  ];

  return items.map((item) => ({
    ...item,
    statusLabel: statusLabel(item.status)
  }));
}

async function probeStripe(): Promise<{ ok: boolean; detail: string }> {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) return { ok: false, detail: "STRIPE_SECRET_KEY missing" };
  try {
    const response = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store"
    });
    if (!response.ok) {
      return { ok: false, detail: `Stripe balance probe HTTP ${response.status}` };
    }
    return { ok: true, detail: "Stripe API authenticated (balance probe)." };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Stripe network error"
    };
  }
}

async function probeDropboxSign(): Promise<{ ok: boolean; detail: string }> {
  const key = env("DROPBOX_SIGN_API_KEY") ?? env("HELLOSIGN_API_KEY");
  if (!key) return { ok: false, detail: "DROPBOX_SIGN_API_KEY missing" };
  try {
    const auth = Buffer.from(`${key}:`).toString("base64");
    const response = await fetch("https://api.hellosign.com/v3/account", {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store"
    });
    if (!response.ok) {
      return { ok: false, detail: `Dropbox Sign account probe HTTP ${response.status}` };
    }
    return { ok: true, detail: "Dropbox Sign API authenticated (account probe)." };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Dropbox Sign network error"
    };
  }
}

async function probeCheckr(): Promise<{ ok: boolean; detail: string }> {
  const key = env("CHECKR_API_KEY");
  if (!key) return { ok: false, detail: "CHECKR_API_KEY missing" };
  try {
    const auth = Buffer.from(`${key}:`).toString("base64");
    const response = await fetch("https://api.checkr.com/v1/account", {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store"
    });
    if (!response.ok) {
      return { ok: false, detail: `Checkr account probe HTTP ${response.status}` };
    }
    return { ok: true, detail: "Checkr API authenticated (account probe)." };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Checkr network error"
    };
  }
}

async function probeResend(): Promise<{
  ok: boolean;
  detail: string;
  verifiedDomain?: string | null;
  lastDelivery?: string | null;
  productionReady?: boolean;
}> {
  try {
    const { getEmailProvider } = await import("./email/registry");
    const { getEmailDeliveryTelemetry } = await import("./email/audit");
    const { getEmailEnvironment } = await import("./email/config");
    const provider = getEmailProvider();
    const health = await provider.health();
    const telemetry = getEmailDeliveryTelemetry();
    const environment = getEmailEnvironment();
    const verified =
      health.verifiedDomain === true
        ? health.domainName
          ? `Verified (${health.domainName})`
          : "Verified"
        : health.verifiedDomain === false
          ? health.domainName
            ? `Not verified (${health.domainName})`
            : "Not verified"
          : "Unknown";
    const lastDelivery = telemetry.lastDeliveryAt
      ? `${telemetry.lastDeliveryStatus ?? "unknown"} · ${telemetry.lastDeliveryAt}${
          telemetry.lastRequestId ? ` · req ${telemetry.lastRequestId}` : ""
        }`
      : null;
    const productionReady =
      provider.key === "resend" &&
      health.ok &&
      health.verifiedDomain === true &&
      environment === "production" &&
      Boolean(telemetry.lastSuccessAt);

    return {
      ok: health.ok,
      detail: health.detail ?? (health.ok ? "Resend healthy" : "Resend unhealthy"),
      verifiedDomain: verified,
      lastDelivery,
      productionReady
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Resend probe failed",
      verifiedDomain: null,
      lastDelivery: null,
      productionReady: false
    };
  }
}

async function probeTwilio(): Promise<{ ok: boolean; detail: string }> {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  if (!sid || !token) return { ok: false, detail: "Twilio credentials missing" };
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store"
    });
    if (!response.ok) {
      return { ok: false, detail: `Twilio account probe HTTP ${response.status}` };
    }
    return {
      ok: true,
      detail: "Twilio API authenticated (account probe). SMS send adapter not in production path."
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Twilio network error"
    };
  }
}

async function probeOneSignal(): Promise<{ ok: boolean; detail: string }> {
  try {
    const { onesignalProvider } = await import("./notifications/onesignal-provider");
    if (!onesignalProvider.health) {
      return { ok: false, detail: "OneSignal health probe unavailable" };
    }
    const health = await onesignalProvider.health();
    return { ok: health.ok, detail: health.detail ?? (health.ok ? "OneSignal healthy" : "OneSignal unhealthy") };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "OneSignal probe failed"
    };
  }
}

/**
 * Async Provider Health Dashboard — env matrix + read-only probes.
 * Never returns secrets. Safe for Settings → Integrations and Master Admin.
 */
export async function buildProviderHealthDashboard(): Promise<ProviderStatusItem[]> {
  const base = getProviderStatusCenter();
  const probedAt = new Date().toISOString();

  const probes = await Promise.all([
    base.find((p) => p.id === "stripe")?.status !== "disabled" &&
    base.find((p) => p.id === "stripe")?.status !== "configuration_required"
      ? probeStripe()
      : Promise.resolve(null),
    base.find((p) => p.id === "onesignal")?.status !== "disabled" &&
    base.find((p) => p.id === "onesignal")?.status !== "configuration_required"
      ? probeOneSignal()
      : Promise.resolve(null),
    base.find((p) => p.id === "dropbox_sign")?.status !== "disabled" &&
    base.find((p) => p.id === "dropbox_sign")?.status !== "configuration_required"
      ? probeDropboxSign()
      : Promise.resolve(null),
    base.find((p) => p.id === "checkr")?.status !== "disabled" &&
    base.find((p) => p.id === "checkr")?.status !== "configuration_required"
      ? probeCheckr()
      : Promise.resolve(null),
    env("EMAIL_PROVIDER")?.toLowerCase() === "resend" || env("RESEND_API_KEY")
      ? probeResend()
      : Promise.resolve(null),
    env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") ? probeTwilio() : Promise.resolve(null)
  ]);

  type ProbeResult = {
    ok: boolean;
    detail: string;
    verifiedDomain?: string | null;
    lastDelivery?: string | null;
    productionReady?: boolean;
  };

  const byId: Record<string, ProbeResult | null> = {
    stripe: probes[0],
    onesignal: probes[1],
    dropbox_sign: probes[2],
    checkr: probes[3],
    resend: probes[4],
    twilio: probes[5]
  };

  return base.map((item) => {
    const probe = byId[item.id];
    if (!probe) {
      if (item.id === "supabase" && item.status !== "disabled" && item.status !== "configuration_required") {
        return {
          ...item,
          lastCommunication: `Environment credentials present · checked ${probedAt}`,
          lastError: null
        };
      }
      if (item.id === "google_maps" && item.status !== "disabled") {
        return {
          ...item,
          lastCommunication: `API key present in environment · checked ${probedAt}`,
          lastError: null
        };
      }
      return item;
    }

    const detail = sanitizeDetail(probe.detail);

    if (item.id === "resend") {
      let status = item.status;
      if (probe.productionReady) status = "production_ready";
      else if (probe.ok && status === "connected") status = "connected";
      else if (probe.ok && status === "sandbox") status = "sandbox";
      else if (!probe.ok && (status === "connected" || status === "production_ready")) status = "connected";

      return {
        ...item,
        status,
        statusLabel: statusLabel(status),
        lastCommunication: probe.ok ? `${detail} · ${probedAt}` : item.lastCommunication,
        lastError: probe.ok ? null : `${detail} · ${probedAt}`,
        verifiedDomain: probe.verifiedDomain ?? item.verifiedDomain ?? null,
        lastDelivery: probe.lastDelivery ?? item.lastDelivery ?? null,
        nextAction: probe.productionReady
          ? "No action — Resend is Production Ready. Monitor Last Success / Last Failure."
          : probe.verifiedDomain?.startsWith("Not verified")
            ? "Complete SPF/DKIM verification for the sending domain in Resend."
            : !probe.ok
              ? `Investigate Resend credentials — ${detail}`
              : item.nextAction
      };
    }

    if (probe.ok) {
      return {
        ...item,
        lastCommunication: `${detail} · ${probedAt}`,
        lastError: null
      };
    }

    return {
      ...item,
      lastCommunication: null,
      lastError: `${detail} · ${probedAt}`,
      status:
        item.status === "production_ready" || item.status === "connected"
          ? "connected"
          : item.status,
      statusLabel:
        item.status === "production_ready" || item.status === "connected"
          ? statusLabel("connected")
          : item.statusLabel,
      nextAction: detail.includes("HTTP")
        ? `Investigate provider credentials — ${detail}`
        : item.nextAction
    };
  });
}

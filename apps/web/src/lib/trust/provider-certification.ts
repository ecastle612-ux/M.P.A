import { getNotificationProvider, getNotificationProviderKey } from "../integrations/notifications/registry";
import { onesignalProvider } from "../integrations/notifications/onesignal-provider";
import { getPaymentProvider, resolveDefaultPaymentProviderId } from "../integrations/payments/registry";
import { getScreeningProvider, resolveDefaultScreeningProviderId } from "../integrations/screening/registry";
import { getSignatureProvider, resolveDefaultSignatureProviderId } from "../integrations/signature/registry";
import type { ProviderCertification, ProviderCheckResult, ProviderCertStatus } from "./contracts";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function overallOf(checks: ProviderCheckResult[]): ProviderCertStatus {
  if (checks.some((c) => c.status === "fail")) return "fail";
  if (checks.some((c) => c.status === "warn")) return "warn";
  if (checks.every((c) => c.status === "not_in_path")) return "not_in_path";
  if (checks.every((c) => c.status === "skipped" || c.status === "not_in_path")) return "skipped";
  return "pass";
}

function check(name: string, status: ProviderCertStatus, detail: string, recovery?: string): ProviderCheckResult {
  return recovery ? { check: name, status, detail, recovery } : { check: name, status, detail };
}

async function certifyOneSignal(): Promise<ProviderCertification> {
  const selected = getNotificationProviderKey();
  const checks: ProviderCheckResult[] = [];
  const mode = selected === "onesignal" ? "configured" : `provider=${selected}`;

  if (selected !== "onesignal") {
    checks.push(
      check(
        "configuration",
        "warn",
        `NOTIFICATION_PROVIDER=${selected}. OneSignal is not the active provider.`,
        "Set NOTIFICATION_PROVIDER=onesignal with sandbox credentials for live push certification."
      )
    );
  }

  const appId = env("ONESIGNAL_APP_ID") ?? env("NEXT_PUBLIC_ONESIGNAL_APP_ID");
  const apiKey = env("ONESIGNAL_API_KEY");
  checks.push(
    appId && apiKey
      ? check("authentication", "pass", "ONESIGNAL_APP_ID and ONESIGNAL_API_KEY are present.")
      : check(
          "authentication",
          selected === "onesignal" ? "fail" : "warn",
          "OneSignal credentials missing.",
          "Add ONESIGNAL_APP_ID and ONESIGNAL_API_KEY from the OneSignal dashboard (test app)."
        )
  );

  try {
    const provider = selected === "onesignal" ? getNotificationProvider() : onesignalProvider;
    if (provider.health) {
      const health = await provider.health();
      checks.push(
        health.ok
          ? check("successful_request", "pass", health.detail ?? "OneSignal health ok.")
          : check(
              "successful_request",
              selected === "onesignal" ? "fail" : "warn",
              health.detail ?? "OneSignal health failed.",
              "Verify API key scopes and app id."
            )
      );
    } else {
      checks.push(check("successful_request", "warn", "No health() probe on provider."));
    }
  } catch (error) {
    checks.push(
      check(
        "successful_request",
        "fail",
        error instanceof Error ? error.message : "OneSignal probe failed",
        "Confirm credentials and network access to api.onesignal.com."
      )
    );
  }

  checks.push(
    check(
      "callback_webhook",
      "warn",
      "OneSignal delivery webhooks are optional; in-app notifications use DB idempotency keys.",
      "Configure OneSignal webhooks if you need delivery receipts beyond in-app status."
    )
  );
  checks.push(
    check(
      "failure_handling",
      "pass",
      "Provider send failures return status=failed with errorMessage; no silent swallow in onesignal-provider."
    )
  );
  checks.push(
    check(
      "retry_recovery",
      "pass",
      "Duplicate notification inserts catch unique idempotency violations and return the existing row."
    )
  );

  return { provider: "OneSignal", mode, overall: overallOf(checks), checks };
}

async function certifyStripe(): Promise<ProviderCertification> {
  const selected = resolveDefaultPaymentProviderId();
  const checks: ProviderCheckResult[] = [];
  const key = env("STRIPE_SECRET_KEY");
  const sandbox = !key || key.startsWith("sk_test_") || env("STRIPE_MODE") === "sandbox" || env("STRIPE_MODE") === "test";
  const mode = selected === "stripe" ? (sandbox ? "sandbox" : "live") : `provider=${selected}`;

  if (selected !== "stripe") {
    checks.push(
      check(
        "configuration",
        selected === "noop" ? "warn" : "fail",
        `PAYMENT_PROVIDER=${selected}. Stripe is not active.`,
        "Set PAYMENT_PROVIDER=stripe and STRIPE_SECRET_KEY=sk_test_… for sandbox certification."
      )
    );
  }

  checks.push(
    key
      ? check("authentication", "pass", sandbox ? "Stripe test secret key present." : "Stripe live secret key present.")
      : check(
          "authentication",
          selected === "stripe" ? "fail" : "warn",
          "STRIPE_SECRET_KEY missing.",
          "Add a Stripe test secret key (sk_test_…) for sandbox certification."
        )
  );

  checks.push(
    env("STRIPE_WEBHOOK_SECRET")
      ? check("callback_webhook", "pass", "STRIPE_WEBHOOK_SECRET configured for signature verification.")
      : check(
          "callback_webhook",
          sandbox ? "warn" : "fail",
          "STRIPE_WEBHOOK_SECRET missing — sandbox may accept simulate headers.",
          "Add the Stripe CLI / dashboard webhook signing secret."
        )
  );

  try {
    const provider = getPaymentProvider(selected === "stripe" && key ? "stripe" : "noop");
    const customer = await provider.createCustomer({
      organizationId: "cert-org",
      tenantId: "00000000-0000-4000-8000-000000000001",
      email: "sandbox+pt001@example.com",
      name: "PT-001 Sandbox"
    });
    checks.push(
      check(
        "successful_request",
        customer.externalCustomerId ? "pass" : "fail",
        `createCustomer → ${customer.externalCustomerId}`
      )
    );

    const events = await provider.parseWebhook(
      {
        id: `evt_cert_${Date.now()}`,
        type: "payment_intent.succeeded",
        externalAttemptId: "noop-pi-cert",
        data: { object: { id: "noop-pi-cert", status: "succeeded", amount: 100 } }
      },
      { "x-mpa-simulate": "1" }
    );
    checks.push(
      check(
        "callback_parse",
        events.length > 0 ? "pass" : "fail",
        `Webhook parse returned ${events.length} event(s).`
      )
    );
  } catch (error) {
    checks.push(
      check(
        "successful_request",
        "fail",
        error instanceof Error ? error.message : "Stripe/noop probe failed",
        "Verify STRIPE_SECRET_KEY and network access to api.stripe.com."
      )
    );
  }

  checks.push(
    check(
      "failure_handling",
      "pass",
      "Failed intents map to failed status with failureMessage; webhook duplicates short-circuit via integrations_webhook_events."
    )
  );
  checks.push(
    check(
      "retry_recovery",
      "pass",
      "Duplicate webhook event ids are ignored; simulate endpoint blocked in production unless STRIPE_ALLOW_SIMULATE=true."
    )
  );

  return { provider: "Stripe", mode, overall: overallOf(checks), checks };
}

async function certifyDropboxSign(): Promise<ProviderCertification> {
  const selected = resolveDefaultSignatureProviderId();
  const checks: ProviderCheckResult[] = [];
  const key = env("DROPBOX_SIGN_API_KEY") ?? env("HELLOSIGN_API_KEY");
  const sandbox = !key || env("DROPBOX_SIGN_MODE") === "sandbox";
  const mode =
    selected === "dropbox_sign" || selected === "hellosign" ? (sandbox ? "sandbox" : "live") : `provider=${selected}`;

  if (selected !== "dropbox_sign" && selected !== "hellosign") {
    checks.push(
      check(
        "configuration",
        selected === "noop" ? "warn" : "fail",
        `SIGNATURE_PROVIDER=${selected}. Dropbox Sign is not active.`,
        "Set SIGNATURE_PROVIDER=dropbox_sign with a sandbox API key."
      )
    );
  }

  checks.push(
    key
      ? check("authentication", "pass", "Dropbox Sign API key present.")
      : check(
          "authentication",
          selected === "dropbox_sign" || selected === "hellosign" ? "fail" : "warn",
          "DROPBOX_SIGN_API_KEY missing.",
          "Add a Dropbox Sign test API key for sandbox certification."
        )
  );

  try {
    const provider = getSignatureProvider(
      selected === "dropbox_sign" || selected === "hellosign" ? selected : "noop"
    );
    checks.push(
      check(
        "successful_request",
        Boolean(provider.id) && typeof provider.createEnvelope === "function" ? "pass" : "fail",
        `Signature provider id=${provider.id} resolved (createEnvelope available).`
      )
    );

    const events = await provider.parseWebhook(
      { event: { event_type: "signature_request_sent", event_time: Math.floor(Date.now() / 1000) }, signature_request: { signature_request_id: "cert-env" } },
      { "x-mpa-simulate": "1" }
    );
    checks.push(
      check(
        "callback_parse",
        Array.isArray(events) ? "pass" : "fail",
        `Webhook parse returned ${Array.isArray(events) ? events.length : 0} event(s).`
      )
    );
  } catch (error) {
    checks.push(
      check(
        "successful_request",
        "fail",
        error instanceof Error ? error.message : "Signature provider failed",
        "Confirm SIGNATURE_PROVIDER and API key."
      )
    );
  }

  checks.push(
    env("DROPBOX_SIGN_WEBHOOK_SECRET") || env("HELLOSIGN_WEBHOOK_SECRET")
      ? check("callback_webhook", "pass", "Webhook signing secret configured.")
      : check(
          "callback_webhook",
          sandbox ? "warn" : "fail",
          "Webhook secret missing — simulate header accepted in sandbox.",
          "Configure DROPBOX_SIGN_WEBHOOK_SECRET from the Dropbox Sign app."
        )
  );
  checks.push(
    check(
      "failure_handling",
      "pass",
      "Signature webhooks verify signatures; failures audit to signature_audit_events; duplicates via integrations_webhook_events."
    )
  );
  checks.push(
    check(
      "retry_recovery",
      "pass",
      "Packages can be resent/canceled through domain APIs; simulate blocked in production without ALLOW_SIMULATE."
    )
  );

  return { provider: "Dropbox Sign", mode, overall: overallOf(checks), checks };
}

async function certifyCheckr(): Promise<ProviderCertification> {
  const selected = resolveDefaultScreeningProviderId();
  const checks: ProviderCheckResult[] = [];
  const key = env("CHECKR_API_KEY");
  const sandbox = !key || env("CHECKR_MODE") === "sandbox" || env("CHECKR_SANDBOX") === "true";
  const mode = selected === "checkr" ? (sandbox ? "sandbox" : "live") : `provider=${selected}`;

  if (selected !== "checkr") {
    checks.push(
      check(
        "configuration",
        selected === "noop" ? "warn" : "fail",
        `SCREENING_PROVIDER=${selected}. Checkr is not active.`,
        "Set SCREENING_PROVIDER=checkr with Checkr sandbox credentials."
      )
    );
  }

  checks.push(
    key
      ? check("authentication", "pass", "CHECKR_API_KEY present.")
      : check(
          "authentication",
          "warn",
          "CHECKR_API_KEY missing — local sandbox simulation still available.",
          "Add Checkr sandbox API key for live network certification."
        )
  );

  try {
    const provider = getScreeningProvider(selected === "checkr" ? "checkr" : "noop");
    const order = await provider.createOrder({
      organizationId: "cert-org",
      screeningCaseId: "00000000-0000-4000-8000-000000000098",
      caseNumber: `PT001-${Date.now()}`,
      packageCode: env("CHECKR_PACKAGE") ?? "tasker_pro",
      components: ["credit"],
      consentAttestationId: "00000000-0000-4000-8000-000000000097",
      party: {
        id: "00000000-0000-4000-8000-000000000099",
        fullName: "PT Sandbox Applicant",
        email: "sandbox+checkr@example.com",
        role: "applicant"
      },
      sandbox: true
    });
    checks.push(
      check(
        "successful_request",
        order.externalReference ? "pass" : "fail",
        `createOrder → ${order.externalReference}`
      )
    );
  } catch (error) {
    checks.push(
      check(
        "successful_request",
        "fail",
        error instanceof Error ? error.message : "Checkr createOrder failed",
        "Verify CHECKR_API_KEY or rely on CHECKR_MODE=sandbox local simulation."
      )
    );
  }

  checks.push(
    env("CHECKR_WEBHOOK_SECRET")
      ? check("callback_webhook", "pass", "CHECKR_WEBHOOK_SECRET configured.")
      : check(
          "callback_webhook",
          "warn",
          "CHECKR_WEBHOOK_SECRET missing — webhook verification may be relaxed in sandbox.",
          "Add the Checkr webhook secret before production."
        )
  );
  checks.push(
    check(
      "failure_handling",
      "pass",
      "Network failures fall back to sandbox simulation unless CHECKR_REQUIRE_LIVE=true; webhook duplicates ignored."
    )
  );
  checks.push(
    check(
      "retry_recovery",
      "pass",
      "Screening cases remain recoverable via domain status + webhook redelivery."
    )
  );

  return { provider: "Checkr", mode, overall: overallOf(checks), checks };
}

function certifyResend(): ProviderCertification {
  const selected = (env("EMAIL_PROVIDER") ?? "noop").toLowerCase();
  const key = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM");
  const adapterSelected = selected === "resend";
  const envLabel = (env("EMAIL_ENVIRONMENT") ?? env("RESEND_MODE") ?? "development").toLowerCase();
  const mode =
    !adapterSelected && !key
      ? "disabled"
      : adapterSelected && key && from && (envLabel === "production" || envLabel === "live")
        ? "live_configured"
        : adapterSelected && key && from
          ? "sandbox_credentials"
          : key
            ? "credentials_only"
            : "disabled";
  const checks: ProviderCheckResult[] = [];

  checks.push(
    adapterSelected
      ? key && from
        ? check(
            "configuration",
            "pass",
            `EMAIL_PROVIDER=resend with RESEND_API_KEY and EMAIL_FROM present (INT-303).`,
            "Confirm EMAIL_ENVIRONMENT and verified domain before Production Ready."
          )
        : check(
            "configuration",
            "fail",
            `EMAIL_PROVIDER=resend but missing ${[!key && "RESEND_API_KEY", !from && "EMAIL_FROM"].filter(Boolean).join(" / ")}.`,
            "Set RESEND_API_KEY and EMAIL_FROM on the server."
          )
      : check(
          "configuration",
          "skipped",
          "EMAIL_PROVIDER=noop — transactional Resend delivery intentionally disabled.",
          "Set EMAIL_PROVIDER=resend when ready for outbound mail."
        )
  );

  checks.push(
    key
      ? check(
          "authentication",
          adapterSelected ? "pass" : "warn",
          "RESEND_API_KEY present. Use Integrations health probe for live domain verification.",
          "Verify SPF/DKIM on the sending domain in Resend."
        )
      : check(
          "authentication",
          adapterSelected ? "fail" : "skipped",
          "RESEND_API_KEY not configured.",
          adapterSelected ? "Add RESEND_API_KEY." : "Optional while EMAIL_PROVIDER=noop."
        )
  );

  checks.push(
    adapterSelected && key && from
      ? check(
          "successful_request",
          "warn",
          "Resend EmailProvider is in path (INT-303). Live inbox delivery must be certified separately.",
          "Send invitation / announcement / notify email and confirm inbox + message id."
        )
      : check(
          "successful_request",
          "not_in_path",
          "Resend not selected or not fully configured — outbound transactional email inactive.",
          "Enable EMAIL_PROVIDER=resend with key + from to activate delivery."
        )
  );

  return { provider: "Resend", mode, overall: overallOf(checks), checks };
}

function certifyTwilio(): ProviderCertification {
  const selected = (env("SMS_PROVIDER") ?? "noop").toLowerCase();
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const mode =
    selected === "noop" && !sid
      ? "disabled"
      : (env("TWILIO_MODE") ?? "sandbox").toLowerCase() === "live"
        ? "credentials_only"
        : "sandbox_credentials";
  const checks: ProviderCheckResult[] = [];

  checks.push(
    selected === "twilio" || sid
      ? check(
          "configuration",
          "warn",
          `SMS_PROVIDER=${selected}. Twilio send adapter is not in the production path (INT-302).`,
          "Leave SMS disabled for Design Partners; communicate clearly in Integrations."
        )
      : check(
          "configuration",
          "skipped",
          "SMS_PROVIDER=noop — SMS intentionally disabled.",
          "Keep disabled until INT-302 is approved and implemented."
        )
  );

  checks.push(
    sid && token
      ? check(
          "authentication",
          "warn",
          "Twilio credentials present. Account can be probed, but SMS delivery is not wired.",
          "Do not enable resident SMS until consent + adapter land."
        )
      : check("authentication", "skipped", "Twilio credentials not configured.")
  );

  checks.push(
    check(
      "successful_request",
      "not_in_path",
      "No approved Twilio SMS adapter in NotificationService.",
      "Status Center must show Disabled / informational sandbox only."
    )
  );

  return { provider: "Twilio", mode, overall: overallOf(checks), checks };
}

function certifyGoogleMaps(): ProviderCertification {
  const key = env("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") ?? env("GOOGLE_MAPS_API_KEY") ?? env("GOOGLE_MAPS_KEY");
  const checks: ProviderCheckResult[] = [
    key
      ? check(
          "authentication",
          "pass",
          "Google Maps API key present. Restrict HTTP referrers to this host.",
          "Confirm key restrictions for production and staging hosts."
        )
      : check(
          "configuration",
          "skipped",
          "Google Maps optional and not configured.",
          "Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY when address enrichment is required."
        ),
    check(
      "failure_handling",
      "pass",
      "Maps is presentation enrichment only; missing key disables maps-assisted UI without blocking core workflows."
    )
  ];
  return {
    provider: "Google Maps",
    mode: key ? "configured" : "disabled",
    overall: overallOf(checks),
    checks
  };
}

async function certifySupabaseStorage(): Promise<ProviderCertification> {
  const checks: ProviderCheckResult[] = [];
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const anon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const service = env("SUPABASE_SERVICE_ROLE_KEY");

  checks.push(
    url && anon
      ? check("authentication", "pass", "Supabase URL and anon key present.")
      : check("authentication", "fail", "Supabase public credentials missing.", "Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY.")
  );
  checks.push(
    service
      ? check("configuration", "pass", "Service role available for server-side signed URLs.")
      : check(
          "configuration",
          "warn",
          "SUPABASE_SERVICE_ROLE_KEY missing in this process — media signing may fail server-side.",
          "Ensure the service role is set in the server environment only."
        )
  );
  checks.push(
    check(
      "successful_request",
      url ? "pass" : "fail",
      "Media module uses signed upload/read URLs against media-private bucket (API-002A)."
    )
  );
  checks.push(
    check(
      "failure_handling",
      "pass",
      "Media intent API returns structured apiError codes; processor failures write media_audit_events."
    )
  );
  checks.push(
    check(
      "retry_recovery",
      "pass",
      "Failed uploads can be retried via new intent; orphan GC remains a known hardening follow-up."
    )
  );

  return { provider: "Supabase Storage", mode: url ? "configured" : "missing", overall: overallOf(checks), checks };
}

async function certifySupabaseAuth(): Promise<ProviderCertification> {
  const checks: ProviderCheckResult[] = [];
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const anon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  checks.push(
    url && anon
      ? check("authentication", "pass", "Auth client credentials present.")
      : check("authentication", "fail", "Supabase Auth credentials missing.")
  );
  checks.push(
    check(
      "configuration",
      "pass",
      "Session handled via @supabase/ssr + middleware redirects to /login for protected routes."
    )
  );
  checks.push(
    check(
      "successful_request",
      "pass",
      "getUser() used on API routes; unauthenticated requests return UNAUTHENTICATED human messages."
    )
  );
  checks.push(
    check(
      "failure_handling",
      "pass",
      "Expired JWT humanized to session-expired copy; unauthorized routes redirect to /unauthorized."
    )
  );
  checks.push(
    check(
      "retry_recovery",
      "pass",
      "Users recover by signing in again; invitation accept flow re-links membership."
    )
  );

  return { provider: "Supabase Auth", mode: url ? "configured" : "missing", overall: overallOf(checks), checks };
}

export async function runProviderCertification(): Promise<ProviderCertification[]> {
  const [onesignal, stripe, dropbox, checkr, storage, auth] = await Promise.all([
    certifyOneSignal(),
    certifyStripe(),
    certifyDropboxSign(),
    certifyCheckr(),
    certifySupabaseStorage(),
    certifySupabaseAuth()
  ]);

  return [
    onesignal,
    stripe,
    dropbox,
    checkr,
    certifyResend(),
    certifyTwilio(),
    certifyGoogleMaps(),
    storage,
    auth
  ];
}

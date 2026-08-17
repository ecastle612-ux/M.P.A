export type ResendFromSource = "env" | "derived_app_url" | "test_fallback";

export type ResendSenderConfig =
  | {
      ok: true;
      apiKey: string;
      from: string;
      fromSource: ResendFromSource;
    }
  | {
      ok: false;
      error: string;
      code: "missing_api_key" | "missing_from" | "test_domain_blocked";
    };

export type ResendEnv = {
  RESEND_API_KEY?: string | undefined;
  RESEND_FROM_EMAIL?: string | undefined;
  NEXT_PUBLIC_APP_URL?: string | undefined;
  VERCEL_ENV?: string | undefined;
  NODE_ENV?: string | undefined;
};

const BARE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAMED_FROM = /^(?:"[^"]+"|[^<>\n]+)\s*<([^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)>$/;
const TEST_FROM_DOMAINS = new Set(["resend.dev"]);

export function isResendFromAddress(value: string): boolean {
  const trimmed = value.trim();
  return BARE_EMAIL.test(trimmed) || NAMED_FROM.test(trimmed);
}

export function extractResendFromEmail(value: string): string | null {
  const trimmed = value.trim();
  const named = trimmed.match(NAMED_FROM);
  if (named?.[1]) {
    return named[1].toLowerCase();
  }
  if (BARE_EMAIL.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return null;
}

export function isProductionEmailRuntime(env: ResendEnv = process.env): boolean {
  return env.VERCEL_ENV === "production" || env.NODE_ENV === "production";
}

export function deriveVerifiedResendFrom(appUrl?: string | undefined): string | null {
  if (!appUrl) {
    return null;
  }
  try {
    const host = new URL(appUrl).hostname.replace(/^www\./i, "").toLowerCase();
    if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".test")) {
      return null;
    }
    if (!host.includes(".")) {
      return null;
    }
    return `My Property Assistant <noreply@${host}>`;
  } catch {
    return null;
  }
}

function fromDomain(from: string): string | null {
  const email = extractResendFromEmail(from);
  const domain = email?.split("@")[1];
  return domain ? domain.toLowerCase() : null;
}

export function resolveResendSender(
  env: ResendEnv = process.env,
  options?: { allowTestDomainFallback?: boolean }
): ResendSenderConfig {
  const apiKey = (env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured", code: "missing_api_key" };
  }

  const production = isProductionEmailRuntime(env);
  const derived = deriveVerifiedResendFrom(env.NEXT_PUBLIC_APP_URL);
  const explicit = (env.RESEND_FROM_EMAIL ?? "").trim();
  let from = explicit && isResendFromAddress(explicit) ? explicit : "";
  let fromSource: ResendFromSource = "env";

  if (!from && derived) {
    from = derived;
    fromSource = "derived_app_url";
  }

  if (!from && (options?.allowTestDomainFallback ?? false) && !production) {
    from = "M.P.A. <onboarding@resend.dev>";
    fromSource = "test_fallback";
  }

  if (!from) {
    return {
      ok: false,
      error: "RESEND_FROM_EMAIL is not configured and no verified-domain from could be derived",
      code: "missing_from"
    };
  }

  const domain = fromDomain(from);
  if (domain && TEST_FROM_DOMAINS.has(domain)) {
    if (production && derived) {
      from = derived;
      fromSource = "derived_app_url";
    } else if (production) {
      return {
        ok: false,
        error:
          "Production cannot send from resend.dev. Set RESEND_FROM_EMAIL to a verified domain address.",
        code: "test_domain_blocked"
      };
    }
  }

  return { ok: true, apiKey, from, fromSource };
}

/** True when Resend can send to customer inboxes (not the resend.dev test fallback). */
export function isResendDeliveryConfigured(env: ResendEnv = process.env): boolean {
  const sender = resolveResendSender(env);
  return sender.ok && sender.fromSource !== "test_fallback";
}

import type { EmailConfigValidation, EmailEnvironment, EmailProviderKey } from "./contracts";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

let bootValidated = false;

export function getEmailProviderKey(): EmailProviderKey {
  const raw = (env("EMAIL_PROVIDER") ?? "noop").toLowerCase();
  if (raw === "resend" || raw === "noop") return raw;
  return raw || "noop";
}

export function getResendApiKey(): string | undefined {
  return env("RESEND_API_KEY");
}

export function getEmailFrom(): string | undefined {
  return env("EMAIL_FROM");
}

export function getEmailReplyTo(): string | undefined {
  return env("EMAIL_REPLY_TO");
}

/** Prefer EMAIL_ENVIRONMENT; accept RESEND_MODE as temporary alias. */
export function getEmailEnvironment(): EmailEnvironment {
  const primary = (env("EMAIL_ENVIRONMENT") ?? env("RESEND_MODE") ?? "").toLowerCase();
  if (primary === "development" || primary === "staging" || primary === "production" || primary === "test") {
    return primary;
  }
  if (primary === "sandbox" || primary === "test") return "test";
  if (primary === "live") return "production";
  if (getEmailProviderKey() === "resend" && getResendApiKey()) return "staging";
  return "development";
}

export function isKnownEmailProviderKey(key: string): key is "noop" | "resend" {
  return key === "noop" || key === "resend";
}

export function validateEmailConfiguration(providerKey = getEmailProviderKey()): EmailConfigValidation {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!isKnownEmailProviderKey(providerKey)) {
    warnings.push(`Unknown EMAIL_PROVIDER="${providerKey}". Expected noop|resend.`);
  }

  if (providerKey === "resend") {
    if (!getResendApiKey()) missing.push("RESEND_API_KEY");
    if (!getEmailFrom()) missing.push("EMAIL_FROM");
    if (!env("EMAIL_ENVIRONMENT") && !env("RESEND_MODE")) {
      warnings.push("EMAIL_ENVIRONMENT unset — defaulting environment label from provider selection.");
    }
  }

  return { valid: missing.length === 0 && isKnownEmailProviderKey(providerKey), missing, warnings };
}

/** Lazy startup validation — logs once; never throws; never logs secrets. */
export function validateEmailConfigurationOnBoot(): void {
  if (bootValidated) return;
  bootValidated = true;
  const key = getEmailProviderKey();
  const result = validateEmailConfiguration(key);
  if (key === "noop") {
    console.info("[email] EMAIL_PROVIDER=noop — outbound transactional email disabled.");
    return;
  }
  if (!result.valid) {
    console.warn("[email] configuration invalid", {
      provider: key,
      missing: result.missing,
      warnings: result.warnings
    });
    return;
  }
  if (result.warnings.length > 0) {
    console.warn("[email] configuration warnings", { provider: key, warnings: result.warnings });
  } else {
    console.info("[email] configuration valid", { provider: key, environment: getEmailEnvironment() });
  }
}

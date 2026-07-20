/**
 * QA-001 environment helpers.
 * Dedicated QA credentials only — never developer personal accounts.
 */

export type QaRole = "masterAdmin" | "pm" | "resident" | "vendor" | "owner";

function env(name: string): string | undefined {
  const value = process.env[name];
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function isAuthEnabled(): boolean {
  return process.env["QA_E2E_AUTH_ENABLED"] === "true";
}

export function isFullVisual(): boolean {
  return process.env["QA_E2E_FULL_VISUAL"] === "true";
}

export function requireAuthEnabled(testTitle: string): void {
  if (!isAuthEnabled()) {
    throw new Error(
      `Auth required for "${testTitle}". Set QA_E2E_AUTH_ENABLED=true and seed QA users (pnpm --filter @mpa/qa-e2e seed).`
    );
  }
}

const ROLE_ENV: Record<QaRole, { email: string; password: string }> = {
  masterAdmin: {
    email: "QA_E2E_MASTER_ADMIN_EMAIL",
    password: "QA_E2E_MASTER_ADMIN_PASSWORD"
  },
  pm: {
    email: "QA_E2E_PM_EMAIL",
    password: "QA_E2E_PM_PASSWORD"
  },
  resident: {
    email: "QA_E2E_RESIDENT_EMAIL",
    password: "QA_E2E_RESIDENT_PASSWORD"
  },
  vendor: {
    email: "QA_E2E_VENDOR_EMAIL",
    password: "QA_E2E_VENDOR_PASSWORD"
  },
  owner: {
    email: "QA_E2E_OWNER_EMAIL",
    password: "QA_E2E_OWNER_PASSWORD"
  }
};

export function getRoleCredentials(role: QaRole): { email: string; password: string } | null {
  const keys = ROLE_ENV[role];
  const email = env(keys.email);
  const password = env(keys.password);
  if (!email || !password) {
    return null;
  }
  return { email, password };
}

export function qaRunId(): string {
  return env("QA_E2E_RUN_ID") ?? `qa-${Date.now()}`;
}

/** Org names created by QA must use this prefix for isolation and cleanup. */
export function qaOrgName(suffix: string): string {
  return `qa-${qaRunId()}-${suffix}`.slice(0, 80);
}

export const DEV_MASTER_ADMIN_EMAIL = "ecastle612@gmail.com" as const;

export const DEV_MASTER_ADMIN_DISPLAY_NAME = "Erick Castillo" as const;
export const DEV_MASTER_ADMIN_FIRST_NAME = "Erick" as const;
export const DEV_MASTER_ADMIN_LAST_NAME = "Castillo" as const;
export const DEV_MASTER_ADMIN_JOB_TITLE = "Founder" as const;
export const DEV_MASTER_ADMIN_ROLE_LABEL = "Master Administrator" as const;

export const DEV_MASTER_ADMIN_ORG_NAME = "M.P.A. Development" as const;
export const DEV_MASTER_ADMIN_ORG_SLUG = "mpa-development" as const;

/** Master Admin membership carries no portal/PM roles — access is via app_metadata flag. */
export const DEV_MASTER_ADMIN_MEMBERSHIP_ROLES = [] as const;

export const DEV_MASTER_ADMIN_APP_METADATA_FLAG = "dev_master_admin" as const;

export type DevMasterAdminUserContext = {
  email?: string | null;
  appMetadata?: Record<string, unknown> | null;
};

export function isDevEnvironment(): boolean {
  const nodeEnv = process.env["NODE_ENV"];
  const appEnv = process.env["APP_ENV"];
  return nodeEnv === "development" || appEnv === "local";
}

export function isDevMasterAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return email.trim().toLowerCase() === DEV_MASTER_ADMIN_EMAIL;
}

/** True when auth app_metadata grants Master Admin (production-safe; not email-gated). */
export function hasMasterAdminAppGrant(context: DevMasterAdminUserContext): boolean {
  return context.appMetadata?.[DEV_MASTER_ADMIN_APP_METADATA_FLAG] === true;
}

/**
 * Dev-only helper (email allowlist or metadata). Prefer `hasMasterAdminAppGrant` for access control.
 */
export function isDevMasterAdminUser(context: DevMasterAdminUserContext): boolean {
  if (!isDevEnvironment()) {
    return false;
  }
  if (isDevMasterAdminEmail(context.email)) {
    return true;
  }
  return hasMasterAdminAppGrant(context);
}

export function shouldBypassSetupWizard(context: DevMasterAdminUserContext): boolean {
  // Master Admin operators skip the PM onboarding wizard in every environment.
  return hasMasterAdminAppGrant(context) || isDevMasterAdminUser(context);
}

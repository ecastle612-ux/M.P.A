export const DEV_MASTER_ADMIN_EMAIL = "ecastle612@gmail.com" as const;

export const DEV_MASTER_ADMIN_DISPLAY_NAME = "Erick Castillo" as const;
export const DEV_MASTER_ADMIN_FIRST_NAME = "Erick" as const;
export const DEV_MASTER_ADMIN_LAST_NAME = "Castillo" as const;
export const DEV_MASTER_ADMIN_JOB_TITLE = "Founder" as const;
export const DEV_MASTER_ADMIN_ROLE_LABEL = "Master Administrator" as const;

export const DEV_MASTER_ADMIN_ORG_NAME = "M.P.A. Development" as const;
export const DEV_MASTER_ADMIN_ORG_SLUG = "mpa-development" as const;

export const DEV_MASTER_ADMIN_MEMBERSHIP_ROLES = [
  "property_manager",
  "property_owner",
  "tenant",
  "vendor"
] as const;

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

export function isDevMasterAdminUser(context: DevMasterAdminUserContext): boolean {
  if (!isDevEnvironment()) {
    return false;
  }
  if (isDevMasterAdminEmail(context.email)) {
    return true;
  }
  return context.appMetadata?.[DEV_MASTER_ADMIN_APP_METADATA_FLAG] === true;
}

export function shouldBypassSetupWizard(context: DevMasterAdminUserContext): boolean {
  return isDevMasterAdminUser(context);
}

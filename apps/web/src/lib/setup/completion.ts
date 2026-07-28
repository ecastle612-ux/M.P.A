import type { SetupStep } from "./constants";

export type SetupCompletionInput = {
  profileComplete: boolean;
  hasOrganization: boolean;
  inviteComplete: boolean;
  propertiesCount: number;
  unitsCount: number;
  tenantsCount: number;
  leasesCount: number;
  recoveryContactReady: boolean;
  commerciallyActive: boolean;
};

/**
 * Pure setup step completion — Finish Setup requires recovery + commercial Active.
 */
export function buildSetupStepCompletion(input: SetupCompletionInput): Record<SetupStep, boolean> {
  const portfolioComplete =
    input.profileComplete &&
    input.hasOrganization &&
    input.propertiesCount > 0 &&
    input.unitsCount > 0 &&
    input.tenantsCount > 0 &&
    input.leasesCount > 0;
  const finishComplete = input.recoveryContactReady && input.commerciallyActive;

  return {
    welcome: true,
    profile: input.profileComplete,
    organization: input.hasOrganization,
    invite: input.inviteComplete,
    property: input.propertiesCount > 0,
    units: input.unitsCount > 0,
    tenant: input.tenantsCount > 0,
    lease: input.leasesCount > 0,
    finish: finishComplete,
    complete: portfolioComplete && finishComplete
  };
}

export const SETUP_GATE_ALLOWED_PREFIXES = [
  "/setup",
  "/master-admin",
  "/portal",
  "/properties/new",
  "/units/new",
  "/tenants/new",
  "/leases/new",
  "/residents/move-in",
  "/residents/move-out",
  "/residents/transfer",
  "/financials",
  "/settings/team",
  "/settings/organization",
  "/settings/billing",
  "/profile",
  "/api/"
] as const;

export function isPathAllowedDuringSetup(pathname: string): boolean {
  if (pathname === "/login") return true;
  return SETUP_GATE_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Server-side SetupGate: incomplete orgs must never render blocked Ops routes
 * (client useEffect redirects cause a dashboard flash).
 */
export function shouldServerRedirectToSetup(input: {
  isSetupComplete: boolean;
  pathname: string | null | undefined;
}): boolean {
  if (input.isSetupComplete) return false;
  const pathname = input.pathname?.trim() || "";
  if (!pathname) return false;
  if (pathname.startsWith("/master-admin") || pathname.startsWith("/portal")) return false;
  return !isPathAllowedDuringSetup(pathname);
}

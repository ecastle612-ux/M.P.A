import {
  hasMasterAdminAppGrant,
  shouldBypassSetupWizard,
  type DevMasterAdminUserContext
} from "@mpa/shared";
import { createAuthServerComponentClient } from "../auth/server";
import { organizationHasReadyRecoveryContact } from "../auth/recovery/recovery-contact";
import { resolveActiveOrganizationIdForUser, getOrganizationsForUser } from "../organization/server";
import { getPortfolioCounts } from "../workflow/server/portfolio-counts";
import { buildSetupStepCompletion } from "./completion";
import { SETUP_STEP_LABELS, SETUP_STEPS, type SetupStep } from "./constants";
import type { SetupStatus, SetupStepStatus } from "./types";

function isProfileComplete(displayName: string | null | undefined): boolean {
  const trimmed = displayName?.trim() ?? "";
  if (trimmed.length < 2) return false;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every((part) => part.length >= 1);
}

function resolveCurrentStep(steps: SetupStepStatus[]): SetupStep {
  // Prefer the next required incomplete step so optional Invite does not block progress.
  for (const stepId of SETUP_STEPS) {
    if (stepId === "complete") continue;
    const step = steps.find((item) => item.id === stepId);
    if (step && !step.complete && !step.optional) return stepId;
  }
  for (const stepId of SETUP_STEPS) {
    if (stepId === "complete") continue;
    const step = steps.find((item) => item.id === stepId);
    if (step && !step.complete) return stepId;
  }
  return "complete";
}

export async function getSetupStatus(
  userId: string,
  inviteSkipped = false,
  userContext?: DevMasterAdminUserContext
): Promise<SetupStatus> {
  const supabase = await createAuthServerComponentClient();
  const organizations = await getOrganizationsForUser(userId);
  const organizationId = await resolveActiveOrganizationIdForUser(userId);

  const profileResponse = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();

  const profileComplete = isProfileComplete(profileResponse.data?.display_name);

  let propertiesCount = 0;
  let unitsCount = 0;
  let tenantsCount = 0;
  let leasesCount = 0;
  let activeLeasesCount = 0;
  let vendorsCount = 0;
  let paymentsCount = 0;
  let invitationsCount = 0;
  let recoveryContactReady = false;
  let commercialStatus: string | null = null;

  if (organizationId) {
    const [portfolioCounts, recoveryReady, orgRow] = await Promise.all([
      getPortfolioCounts(organizationId),
      organizationHasReadyRecoveryContact(organizationId).catch(() => false),
      supabase
        .from("organizations")
        .select("commercial_status")
        .eq("id", organizationId)
        .maybeSingle()
    ]);
    propertiesCount = portfolioCounts.properties;
    unitsCount = portfolioCounts.units;
    tenantsCount = portfolioCounts.tenants;
    leasesCount = portfolioCounts.leases;
    activeLeasesCount = portfolioCounts.activeLeases;
    vendorsCount = portfolioCounts.vendors;
    paymentsCount = portfolioCounts.payments;
    invitationsCount = portfolioCounts.invitations;
    recoveryContactReady = recoveryReady;
    const orgData = orgRow.data as { commercial_status?: string | null } | null;
    commercialStatus =
      orgData?.commercial_status != null ? String(orgData.commercial_status) : null;
  }

  const hasOrganization = organizations.length > 0;
  // Invite is optional — never block setup completion / SetupGate on skipped invites.
  const inviteComplete = inviteSkipped || invitationsCount > 0;
  const commerciallyActive = commercialStatus === "active";
  const stepCompletion = buildSetupStepCompletion({
    profileComplete,
    hasOrganization,
    inviteComplete,
    propertiesCount,
    unitsCount,
    tenantsCount,
    leasesCount,
    recoveryContactReady,
    commerciallyActive
  });

  const steps: SetupStepStatus[] = SETUP_STEPS.filter((step) => step !== "complete").map((step) => ({
    id: step,
    label: SETUP_STEP_LABELS[step],
    complete: stepCompletion[step],
    optional: step === "invite"
  }));

  const trackedSteps = steps.filter((step) => step.id !== "welcome");
  const completedCount = trackedSteps.filter((step) => step.complete).length;
  const completionPercent = Math.round((completedCount / trackedSteps.length) * 100);

  const currentStep = resolveCurrentStep(steps);
  const isComplete =
    stepCompletion.complete ||
    (userContext ? shouldBypassSetupWizard(userContext) || hasMasterAdminAppGrant(userContext) : false);

  return {
    isComplete,
    currentStep,
    steps,
    completionPercent,
    counts: {
      organizations: organizations.length,
      properties: propertiesCount,
      units: unitsCount,
      tenants: tenantsCount,
      leases: leasesCount,
      activeLeases: activeLeasesCount,
      vendors: vendorsCount,
      payments: paymentsCount,
      invitations: invitationsCount
    },
    profileComplete,
    inviteSkipped,
    recoveryContactReady,
    commerciallyActive,
    commercialStatus,
    organizationId
  };
}

import { shouldBypassSetupWizard, type DevMasterAdminUserContext } from "@mpa/shared";
import { createAuthServerComponentClient } from "../auth/server";
import { resolveActiveOrganizationIdForUser, getOrganizationsForUser } from "../organization/server";
import { getPortfolioCounts } from "../workflow/server/portfolio-counts";
import { SETUP_STEP_LABELS, SETUP_STEPS, type SetupStep } from "./constants";
import type { SetupStatus, SetupStepStatus } from "./types";

function isProfileComplete(displayName: string | null | undefined): boolean {
  const trimmed = displayName?.trim() ?? "";
  if (trimmed.length < 2) return false;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every((part) => part.length >= 1);
}

function resolveCurrentStep(steps: SetupStepStatus[]): SetupStep {
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

  if (organizationId) {
    const portfolioCounts = await getPortfolioCounts(organizationId);
    propertiesCount = portfolioCounts.properties;
    unitsCount = portfolioCounts.units;
    tenantsCount = portfolioCounts.tenants;
    leasesCount = portfolioCounts.leases;
    activeLeasesCount = portfolioCounts.activeLeases;
    vendorsCount = portfolioCounts.vendors;
    paymentsCount = portfolioCounts.payments;
    invitationsCount = portfolioCounts.invitations;
  }

  const hasOrganization = organizations.length > 0;
  const inviteComplete = inviteSkipped || invitationsCount > 0;

  const stepCompletion: Record<SetupStep, boolean> = {
    welcome: true,
    profile: profileComplete,
    organization: hasOrganization,
    invite: inviteComplete,
    property: propertiesCount > 0,
    units: unitsCount > 0,
    tenant: tenantsCount > 0,
    lease: leasesCount > 0,
    complete:
      profileComplete &&
      hasOrganization &&
      inviteComplete &&
      propertiesCount > 0 &&
      unitsCount > 0 &&
      tenantsCount > 0 &&
      leasesCount > 0
  };

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
    (userContext ? shouldBypassSetupWizard(userContext) : false);

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
    inviteSkipped
  };
}

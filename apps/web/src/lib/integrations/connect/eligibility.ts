import type { ConnectAccountSnapshot, ConnectAccountStatus } from "./contracts";

/**
 * Map Stripe-like capability flags → FIN-003 eligibility vocabulary.
 * No money movement — status display only.
 */
export function deriveConnectAccountStatus(input: {
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentlyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
  purpose: "org_settlement" | "owner";
}): ConnectAccountStatus {
  if (input.disabledReason) return "disabled";

  const blocking = [...input.currentlyDue, ...input.pastDue];
  if (blocking.length > 0 && input.detailsSubmitted) return "restricted";
  if (blocking.length > 0 && !input.detailsSubmitted) return "onboarding";

  const ready =
    input.purpose === "org_settlement"
      ? input.chargesEnabled && input.detailsSubmitted
      : input.payoutsEnabled && input.detailsSubmitted;

  if (ready) return "eligible";
  if (input.detailsSubmitted) return "pending_verification";
  return "onboarding";
}

export function eligibilityLabel(status: ConnectAccountStatus): string {
  switch (status) {
    case "not_started":
      return "Not connected";
    case "onboarding":
      return "Onboarding";
    case "pending_verification":
      return "Pending verification";
    case "restricted":
      return "Action required";
    case "eligible":
      return "Eligible";
    case "disabled":
      return "Disabled";
    default:
      return "Unknown";
  }
}

/**
 * Owner/PM-facing next step. Never implies money moved or a payout was sent.
 */
export function remediationGuidance(input: {
  status: ConnectAccountStatus;
  currentlyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
  purpose: "org_settlement" | "owner";
}): { nextStepMessage: string; remediationRequired: boolean } {
  const duePreview = [...input.currentlyDue, ...input.pastDue].slice(0, 2);
  const dueHint =
    duePreview.length > 0
      ? ` Stripe still needs: ${duePreview.join(", ")}${
          input.currentlyDue.length + input.pastDue.length > 2 ? "…" : ""
        }.`
      : "";

  switch (input.status) {
    case "not_started":
      return {
        remediationRequired: true,
        nextStepMessage:
          input.purpose === "owner"
            ? "Start Connect onboarding to become eligible for owner payouts. This does not transfer money."
            : "Start settlement Connect onboarding for this organization. This does not transfer money."
      };
    case "onboarding":
      return {
        remediationRequired: true,
        nextStepMessage: `Continue verification in Stripe to finish Connect setup.${dueHint}`
      };
    case "pending_verification":
      return {
        remediationRequired: false,
        nextStepMessage:
          "Stripe is reviewing submitted information. Refresh status after Stripe finishes — eligibility is not a payout."
      };
    case "restricted":
      return {
        remediationRequired: true,
        nextStepMessage: `Action required — continue verification to clear open requirements.${dueHint}`
      };
    case "eligible":
      return {
        remediationRequired: false,
        nextStepMessage:
          "Connect verification is complete. Transfers and paid amounts are not enabled in this phase."
      };
    case "disabled":
      return {
        remediationRequired: true,
        nextStepMessage: input.disabledReason
          ? `This Connect account is disabled (${input.disabledReason}). Contact support or restart onboarding with your property manager.`
          : "This Connect account is disabled. Contact support or your property manager."
      };
    default:
      return {
        remediationRequired: false,
        nextStepMessage: "Connect status is unavailable."
      };
  }
}

export function snapshotFromFlags(
  externalAccountId: string,
  flags: {
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    currentlyDue?: string[];
    pastDue?: string[];
    disabledReason?: string | null;
    purpose: "org_settlement" | "owner";
  }
): ConnectAccountSnapshot {
  const currentlyDue = flags.currentlyDue ?? [];
  const pastDue = flags.pastDue ?? [];
  const disabledReason = flags.disabledReason ?? null;
  return {
    externalAccountId,
    status: deriveConnectAccountStatus({
      detailsSubmitted: flags.detailsSubmitted,
      chargesEnabled: flags.chargesEnabled,
      payoutsEnabled: flags.payoutsEnabled,
      currentlyDue,
      pastDue,
      disabledReason,
      purpose: flags.purpose
    }),
    chargesEnabled: flags.chargesEnabled,
    payoutsEnabled: flags.payoutsEnabled,
    detailsSubmitted: flags.detailsSubmitted,
    currentlyDue,
    pastDue,
    disabledReason
  };
}

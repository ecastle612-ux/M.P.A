import type {
  SettlementReadinessCheck,
  SettlementReadinessResult
} from "./contracts";
import { isPay001DestinationFundingEnvEnabled } from "./flags";

export type OrgSettlementAccountMirror = {
  id: string;
  organizationId: string;
  purpose: "org_settlement" | "owner";
  externalAccountId: string;
  status: string;
  chargesEnabled: boolean;
  currentlyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
};

function check(
  id: SettlementReadinessCheck["id"],
  label: string,
  pass: boolean,
  detail?: string
): SettlementReadinessCheck {
  return detail !== undefined ? { id, label, pass, detail } : { id, label, pass };
}

/**
 * Evaluate destination readiness matrix S1–S8 (PAY-001 §03).
 * Pure — caller supplies mirror + enrollment flags.
 */
export function evaluateSettlementReadiness(input: {
  organizationId: string;
  destinationEnrolled: boolean;
  fundingEnabled: boolean;
  account: OrgSettlementAccountMirror | null;
  /** Optional override for S8 cross-org forbid tests */
  proposedDestinationAccountId?: string | null;
  envFundingEnabled?: boolean;
}): SettlementReadinessResult {
  const envOn =
    input.envFundingEnabled !== undefined
      ? input.envFundingEnabled
      : isPay001DestinationFundingEnvEnabled();

  const account = input.account;
  const settlementId = account?.externalAccountId ?? null;
  const proposed =
    input.proposedDestinationAccountId !== undefined
      ? input.proposedDestinationAccountId
      : settlementId;

  const blockingRequirements = [
    ...(account?.currentlyDue ?? []),
    ...(account?.pastDue ?? [])
  ];

  const checks: SettlementReadinessCheck[] = [
    check(
      "S1",
      "org_settlement connect_accounts row exists",
      Boolean(account && account.purpose === "org_settlement"),
      account ? undefined : "Missing org_settlement Connect account"
    ),
    check(
      "S2",
      "external_account_id present",
      Boolean(settlementId && settlementId.startsWith("acct_")),
      settlementId ? undefined : "Missing settlement acct_…"
    ),
    check(
      "S3",
      "mirror status not disabled / fatally restricted",
      Boolean(
        account &&
          account.status !== "disabled" &&
          account.status !== "restricted" &&
          !account.disabledReason
      ),
      account
        ? `status=${account.status}${account.disabledReason ? ` reason=${account.disabledReason}` : ""}`
        : "No account"
    ),
    check(
      "S4",
      "charges_enabled",
      Boolean(account?.chargesEnabled),
      account ? `charges_enabled=${account.chargesEnabled}` : "No account"
    ),
    check(
      "S5",
      "no outstanding requirements blocking charges",
      Boolean(account && blockingRequirements.length === 0),
      blockingRequirements.length > 0
        ? `due=${blockingRequirements.slice(0, 5).join(",")}`
        : undefined
    ),
    check(
      "S6",
      "PAY-001 env funding kill switch on",
      envOn,
      envOn ? undefined : "PAY001_DESTINATION_FUNDING_ENABLED is off"
    ),
    check(
      "S7",
      "org destination enrollment + funding enable on",
      input.destinationEnrolled && input.fundingEnabled,
      `enrolled=${input.destinationEnrolled} funding_enabled=${input.fundingEnabled}`
    ),
    check(
      "S8",
      "destination acct equals org settlement account",
      Boolean(
        settlementId &&
          proposed &&
          proposed === settlementId &&
          account?.organizationId === input.organizationId
      ),
      settlementId && proposed && proposed !== settlementId
        ? "Cross-org or mismatched destination forbidden"
        : undefined
    )
  ];

  return {
    ready: checks.every((c) => c.pass),
    checks,
    settlementExternalAccountId: settlementId,
    connectAccountId: account?.id ?? null
  };
}

export function failedCheckIds(result: SettlementReadinessResult): string[] {
  return result.checks.filter((c) => !c.pass).map((c) => c.id);
}

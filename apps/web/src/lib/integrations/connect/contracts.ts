/**
 * ConnectProvider abstraction (FIN-003 Phase A + Phase C money-out surface).
 * Business modules must never import Stripe SDK — only OwnerPayoutService → ConnectProvider.
 *
 * Phase A: Express accounts, Account Links, account status, account webhooks.
 * Phase C: createTransfer / getTransfer / getBalance + transfer.* webhook normalize.
 */

export type ConnectAccountPurpose = "org_settlement" | "owner";

/** Canonical mirrored status (domain model OwnerConnectAccount.status). */
export type ConnectAccountStatus =
  | "not_started"
  | "onboarding"
  | "pending_verification"
  | "restricted"
  | "eligible"
  | "disabled";

export type CreateConnectAccountInput = {
  organizationId: string;
  purpose: ConnectAccountPurpose;
  /** Required when purpose = owner */
  ownerUserId?: string | null;
  email?: string | null;
  country?: string;
  metadata?: Record<string, unknown>;
};

export type ConnectAccountRef = {
  externalAccountId: string;
  purpose: ConnectAccountPurpose;
};

export type CreateAccountLinkInput = {
  externalAccountId: string;
  refreshUrl: string;
  returnUrl: string;
  /** Stripe Account Link type — default account_onboarding */
  linkType?: "account_onboarding" | "account_update";
};

export type AccountLinkRef = {
  url: string;
  expiresAt: string | null;
};

export type ConnectAccountSnapshot = {
  externalAccountId: string;
  status: ConnectAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
  rawRequirements?: Record<string, unknown> | null;
};

export type NormalizedConnectAccountEvent = {
  externalEventId: string;
  type: "account_updated" | "account_application_authorized" | "account_deauthorized" | "ignored";
  externalAccountId: string | null;
  occurredAt: string;
  ignored?: boolean;
  message?: string | null;
};

/** Phase C — transfer money events (never treat transfer id as account id). */
export type NormalizedConnectTransferEvent = {
  externalEventId: string;
  type: "transfer_created" | "transfer_updated" | "transfer_reversed" | "transfer_failed" | "ignored";
  externalTransferId: string | null;
  /** Settlement / source account when present */
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  amountCents: number | null;
  currency: string | null;
  status: string | null;
  occurredAt: string;
  ignored?: boolean;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type CreateConnectTransferInput = {
  /** Org settlement Express acct_… (Stripe-Account header) */
  sourceSettlementAccountId: string;
  destinationOwnerAccountId: string;
  amountCents: number;
  currency: string;
  idempotencyKey: string;
  metadata: {
    organizationId: string;
    payoutRunId: string;
    transferIntentId: string;
    attemptNumber: number;
  };
};

export type ConnectTransferRef = {
  externalTransferId: string;
  amountCents: number;
  currency: string;
  destinationAccountId: string;
  status: string;
};

export type ConnectBalanceSnapshot = {
  availableCents: number;
  pendingCents: number;
  currency: string;
};

export type ConnectProvider = {
  readonly id: string;
  createExpressAccount(input: CreateConnectAccountInput): Promise<ConnectAccountRef>;
  createAccountLink(input: CreateAccountLinkInput): Promise<AccountLinkRef>;
  getAccount(externalAccountId: string): Promise<ConnectAccountSnapshot>;
  parseAccountWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<NormalizedConnectAccountEvent[]>;
  /** Phase C */
  createTransfer(input: CreateConnectTransferInput): Promise<ConnectTransferRef>;
  getTransfer(
    externalTransferId: string,
    sourceSettlementAccountId: string
  ): Promise<ConnectTransferRef>;
  getBalance(sourceSettlementAccountId: string): Promise<ConnectBalanceSnapshot>;
  parseTransferWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<NormalizedConnectTransferEvent[]>;
};

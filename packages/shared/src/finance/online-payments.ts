import { AUTOPAY_CONSENT_VERSION, connectAccountReady } from "./tenant-payments";

export const ORGANIZATION_DISABLED_ONLINE_PAYMENTS = "organization_disabled_online_payments" as const;

export const ONLINE_PAYMENT_STATUSES = [
  "not_connected",
  "setup_incomplete",
  "ready_to_enable",
  "active",
  "action_required"
] as const;
export type OnlinePaymentStatus = (typeof ONLINE_PAYMENT_STATUSES)[number];

export const ONLINE_PAYMENT_STATUS_COPY: Record<
  OnlinePaymentStatus,
  { label: string; summary: string; availability: "off" | "waiting" | "ready" | "active" | "action" }
> = {
  not_connected: {
    label: "Not connected",
    summary: "Online payments are off. Connect Stripe to get started.",
    availability: "off"
  },
  setup_incomplete: {
    label: "Stripe setup incomplete",
    summary: "Online payments are waiting on Stripe. Finish setup to continue.",
    availability: "waiting"
  },
  ready_to_enable: {
    label: "Ready to enable",
    summary: "Stripe can take charges. Online payments stay off until you enable them.",
    availability: "ready"
  },
  active: {
    label: "Online payments active",
    summary: "Current tenants can pay a posted balance once, or turn on AutoPay themselves.",
    availability: "active"
  },
  action_required: {
    label: "Action required",
    summary: "Stripe needs attention. New online payments are blocked until setup is current.",
    availability: "action"
  }
};

export type ConnectPublicView = {
  connected: boolean;
  ready: boolean;
  status: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: string[];
};

export function publicConnectView(account: {
  stripe_account_id?: string | null;
  status?: string | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  metadata?: { requirements?: string[] } | null;
} | null | undefined): ConnectPublicView {
  const requirements = Array.isArray(account?.metadata?.requirements) ? account.metadata.requirements : [];
  return {
    connected: Boolean(account?.stripe_account_id),
    ready: connectAccountReady(account),
    status: account?.status ?? "not_started",
    chargesEnabled: account?.charges_enabled === true,
    payoutsEnabled: account?.payouts_enabled === true,
    requirements
  };
}

export function resolveOnlinePaymentStatus(input: {
  executionEnabled: boolean;
  connect: ConnectPublicView;
}): OnlinePaymentStatus {
  const { executionEnabled, connect } = input;
  if (executionEnabled && !connect.ready) {
    return "action_required";
  }
  if (connect.ready && executionEnabled) {
    return "active";
  }
  if (connect.ready) {
    return "ready_to_enable";
  }
  if (!connect.connected) {
    return "not_connected";
  }
  if (connect.status === "restricted" || connect.status === "disabled" || connect.requirements.length > 0) {
    return "action_required";
  }
  return "setup_incomplete";
}

export function customerSafeOnlinePayments(input: {
  executionEnabled: boolean;
  connect: ConnectPublicView;
}) {
  const status = resolveOnlinePaymentStatus(input);
  const copy = ONLINE_PAYMENT_STATUS_COPY[status];
  return {
    status,
    label: copy.label,
    summary: copy.summary,
    availability: copy.availability,
    execution_enabled: input.executionEnabled === true,
    connect_ready: input.connect.ready,
    requirements: input.connect.requirements,
    primary_action: primaryActionForStatus(status),
    secondary_action: secondaryActionForStatus(status, input.executionEnabled)
  };
}

export function primaryActionForStatus(status: OnlinePaymentStatus) {
  if (status === "not_connected") {
    return "connect";
  }
  if (status === "setup_incomplete" || status === "action_required") {
    return "continue_setup";
  }
  if (status === "ready_to_enable") {
    return "enable";
  }
  return "manage";
}

export function secondaryActionForStatus(status: OnlinePaymentStatus, executionEnabled = false) {
  if (status === "ready_to_enable") {
    return "manage";
  }
  if (status === "active" || (status === "action_required" && executionEnabled)) {
    return "disable";
  }
  return null;
}

export function canResumeAutopayAfterOrgDisable(input: {
  status?: string | null;
  pausedReason?: string | null;
  consentVersion?: string | null;
  occupancyCurrent: boolean;
  hasPaymentMethod: boolean;
  connectReady: boolean;
  executionEnabled: boolean;
}): boolean {
  return (
    input.status === "paused" &&
    input.pausedReason === ORGANIZATION_DISABLED_ONLINE_PAYMENTS &&
    input.consentVersion === AUTOPAY_CONSENT_VERSION &&
    input.occupancyCurrent === true &&
    input.hasPaymentMethod === true &&
    input.connectReady === true &&
    input.executionEnabled === true
  );
}

export function assertNoStripeAccountId(payload: unknown): boolean {
  return !JSON.stringify(payload).includes("acct_");
}

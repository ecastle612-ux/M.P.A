/**
 * Canonical public commercial funnel state machine (COM-002 Slice A).
 * Later slices attach payment/provisioning without replacing these states.
 */

export const COMMERCE_FUNNEL_STATES = [
  "landing",
  "modules",
  "pricing",
  "confirm_plan",
  "enterprise_request",
  /** Interim until Slice C/D — account path without payment. */
  "account_interim",
  /** Reserved — Slice C+. */
  "checkout_payment",
  "provisioning",
  "guided_setup",
  "mission_control"
] as const;

export type CommerceFunnelState = (typeof COMMERCE_FUNNEL_STATES)[number];

export type CommerceFunnelEvent =
  | "SELECT_PRODUCT"
  | "SELECT_PLAN"
  | "SELECT_CYCLE"
  | "CONTINUE"
  | "REQUEST_ENTERPRISE"
  | "CONFIRM_PLAN"
  | "BACK";

const TRANSITIONS: Record<
  CommerceFunnelState,
  Partial<Record<CommerceFunnelEvent, CommerceFunnelState>>
> = {
  landing: {
    CONTINUE: "modules",
    REQUEST_ENTERPRISE: "enterprise_request"
  },
  modules: {
    SELECT_PRODUCT: "pricing",
    CONTINUE: "pricing",
    REQUEST_ENTERPRISE: "enterprise_request",
    BACK: "landing"
  },
  pricing: {
    SELECT_PLAN: "pricing",
    SELECT_CYCLE: "pricing",
    CONTINUE: "confirm_plan",
    REQUEST_ENTERPRISE: "enterprise_request",
    BACK: "modules"
  },
  confirm_plan: {
    CONFIRM_PLAN: "account_interim",
    REQUEST_ENTERPRISE: "enterprise_request",
    BACK: "pricing"
  },
  enterprise_request: {
    BACK: "landing"
  },
  account_interim: {
    BACK: "confirm_plan"
  },
  checkout_payment: {},
  provisioning: {},
  guided_setup: {},
  mission_control: {}
};

export function transitionCommerceFunnel(
  state: CommerceFunnelState,
  event: CommerceFunnelEvent
): CommerceFunnelState {
  return TRANSITIONS[state][event] ?? state;
}

export function commerceFunnelStepIndex(state: CommerceFunnelState): number {
  switch (state) {
    case "landing":
      return 0;
    case "modules":
      return 1;
    case "pricing":
      return 2;
    case "confirm_plan":
      return 3;
    case "enterprise_request":
      return 3;
    case "account_interim":
      return 4;
    default:
      return -1;
  }
}

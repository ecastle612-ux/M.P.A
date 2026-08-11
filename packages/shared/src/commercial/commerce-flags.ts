/**
 * COM-002 feature flags (Slice A foundation).
 * Future slices flip flags without restructuring the catalog.
 */

/**
 * Facility Operations self-service — Owner-authorized.
 * Prior FO_READY=false was an implementation assumption, not an Owner decision.
 */
export const FO_READY = true;

/**
 * Complete Platform self-service — remains gated until Owner authorizes activation.
 * Decoupled from FO_READY so enabling FO does not unlock Complete.
 */
export const COMPLETE_READY = false;

/** Slice delivery markers — informational for Master Admin / diagnostics. */
export const COM_002_FLAGS = {
  sliceA_commercialFoundation: true,
  sliceB_demoPlatform: true,
  sliceC_stripeCheckout: true,
  sliceD_automaticProvisioning: true,
  sliceE_subscriptionLifecycle: true,
  sliceF_customerPortal: false,
  sliceG_commercialCertification: false,
  foReady: FO_READY,
  completeReady: COMPLETE_READY,
  /** Slice 3: trial architecture ready (≤500 units only); applied from server quote. */
  selfServeTrials: true,
  selfServePause: false
} as const;

export type Com002FlagKey = keyof typeof COM_002_FLAGS;

export function isFacilityOperationsSelfServeEnabled(): boolean {
  return FO_READY;
}

export function isCompleteSelfServeEnabled(): boolean {
  return COMPLETE_READY;
}

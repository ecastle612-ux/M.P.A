/**
 * COM-002 feature flags (Slice A foundation).
 * Future slices flip flags without restructuring the catalog.
 */

/** When true, FO/Complete may become self-serve eligible (future gate). */
export const FO_READY = false;

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
  selfServeTrials: false,
  selfServePause: false
} as const;

export type Com002FlagKey = keyof typeof COM_002_FLAGS;

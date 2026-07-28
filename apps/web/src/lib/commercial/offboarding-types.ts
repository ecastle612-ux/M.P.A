/** COM-001 Slice D — customer offboarding ([21]). */

export const OFFBOARDING_STAGES = [
  "none",
  "cancel_confirmed",
  "retention_offer",
  "final_billing",
  "export_window",
  "frozen",
  "archive_scheduled",
  "archived",
  "recovered"
] as const;

export type OffboardingStage = (typeof OFFBOARDING_STAGES)[number];

/** Design defaults ([15] Q4 / Q5). */
export const EXPORT_WINDOW_DAYS = 30;
export const ARCHIVE_RETENTION_DAYS = 180;

export type RetentionOfferStatus =
  | "none"
  | "offered"
  | "accepted"
  | "declined"
  | "skipped";

export type ExportInventory = {
  properties: number;
  units: number;
  tenants: number;
  leases: number;
  documents: number;
  memberships: number;
  openInvoices: number;
  generatedAt: string;
};

export type OffboardingSnapshot = {
  organizationId: string;
  stage: OffboardingStage;
  cancelConfirmedAt: string | null;
  effectiveCancelAt: string | null;
  cancelReason: string | null;
  retentionOfferStatus: RetentionOfferStatus;
  retentionOfferNotes: string | null;
  finalBillingCoordinatedAt: string | null;
  billingCancelMode: string | null;
  exportWindowEndsAt: string | null;
  exportReadyAt: string | null;
  exportInventory: ExportInventory | Record<string, unknown>;
  frozenAt: string | null;
  archiveScheduledAt: string | null;
  archivedAt: string | null;
  deletionScheduledAt: string | null;
  recoveryWindowEndsAt: string | null;
  legalHold: boolean;
  /** Always false at cancel; only true after deletion schedule + no legal hold. */
  purgeAllowed: boolean;
  recoveredAt: string | null;
  mutationsBlocked: boolean;
  exportOnlyAccess: boolean;
  canWinBack: boolean;
};

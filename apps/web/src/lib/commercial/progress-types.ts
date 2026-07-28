/** COM-001 Slice B — implementation score milestones ([18]). */

export const IMPLEMENTATION_MILESTONES = [
  "purchased",
  "organization_created",
  "stripe_connected",
  "properties_imported",
  "units_imported",
  "tenants_imported",
  "team_invited",
  "production_ready"
] as const;

export type ImplementationMilestone = (typeof IMPLEMENTATION_MILESTONES)[number];

export const MILESTONE_SCORE: Record<ImplementationMilestone, number> = {
  purchased: 0,
  organization_created: 10,
  stripe_connected: 25,
  properties_imported: 40,
  units_imported: 55,
  tenants_imported: 70,
  team_invited: 85,
  production_ready: 100
};

export const MILESTONE_LABEL: Record<ImplementationMilestone, string> = {
  purchased: "Purchased",
  organization_created: "Organization Created",
  stripe_connected: "Stripe Connected",
  properties_imported: "Properties Imported",
  units_imported: "Units Imported",
  tenants_imported: "Tenants Imported",
  team_invited: "Team Invited",
  production_ready: "Production Ready"
};

export type MilestoneState = {
  complete: boolean;
  waived: boolean;
  completedAt: string | null;
  deferralReason: string | null;
};

export type ImplementationProgressSnapshot = {
  organizationId: string;
  score: number;
  highestMilestone: ImplementationMilestone | "none";
  milestones: Record<ImplementationMilestone, MilestoneState>;
  nextStep: string | null;
  blockers: string[];
  computedAt: string;
};

export const TRIAL_STATUSES = [
  "not_trial",
  "trial_active",
  "trial_grace",
  "converted",
  "expired_cancelled"
] as const;

export type TrialStatus = (typeof TRIAL_STATUSES)[number];

export const TRIAL_REMINDER_KEYS = [
  "day0",
  "day3",
  "day7",
  "t3",
  "t1",
  "expiry",
  "grace"
] as const;

export type TrialReminderKey = (typeof TRIAL_REMINDER_KEYS)[number];

/** Design defaults ([24]). */
export const TRIAL_DURATION_DAYS = 14;
export const TRIAL_GRACE_DAYS = 3;

export type TrialLifecycleSnapshot = {
  organizationId: string;
  status: TrialStatus;
  clockStartedAt: string | null;
  trialEndsAt: string | null;
  graceEndsAt: string | null;
  daysRemaining: number | null;
  graceDaysRemaining: number | null;
  remindersEmitted: Partial<Record<TrialReminderKey, string>>;
  convertedAt: string | null;
  watermarkPolicy: "pm_ui_badge" | "none";
  /** In-app conversion prompts due now (secret-free keys). */
  dueReminders: TrialReminderKey[];
  convertVia: "billing_portal" | "checkout" | "none";
  featureRestricted: boolean;
};

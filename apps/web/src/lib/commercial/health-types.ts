/** COM-001 Slice C — customer health score ([19]). */

export const HEALTH_BANDS = [
  "healthy",
  "needs_attention",
  "at_risk",
  "critical"
] as const;

export type HealthBand = (typeof HEALTH_BANDS)[number];

/** Product-signed thresholds at Implement (authorization §2.6). */
export const HEALTH_BAND_MIN_SCORE: Record<HealthBand, number> = {
  healthy: 75,
  needs_attention: 50,
  at_risk: 25,
  critical: 0
};

export const HEALTH_FACTOR_KEYS = [
  "login_frequency",
  "feature_adoption",
  "ai_usage",
  "property_setup",
  "payment_status",
  "support_requests",
  "outstanding_onboarding",
  "notification_engagement"
] as const;

export type HealthFactorKey = (typeof HEALTH_FACTOR_KEYS)[number];

export type HealthDriver = {
  code: string;
  factor: HealthFactorKey;
  label: string;
  penalty: number;
};

export type HealthFactorBreakdown = Record<
  HealthFactorKey,
  { penalty: number; available: boolean; note: string }
>;

export type CsCadenceKey =
  | "standard_30_90"
  | "within_5_business_days"
  | "within_1_2_business_days"
  | "same_day";

export const CS_CADENCE_BY_BAND: Record<
  HealthBand,
  { key: CsCadenceKey; label: string; businessDaysMax: number | null }
> = {
  healthy: {
    key: "standard_30_90",
    label: "Standard 30/90 motions",
    businessDaysMax: null
  },
  needs_attention: {
    key: "within_5_business_days",
    label: "Outreach within 5 business days",
    businessDaysMax: 5
  },
  at_risk: {
    key: "within_1_2_business_days",
    label: "Outreach within 1–2 business days",
    businessDaysMax: 2
  },
  critical: {
    key: "same_day",
    label: "Same-day CS + Billing/Support as needed",
    businessDaysMax: 0
  }
};

export type HealthScoreSnapshot = {
  organizationId: string;
  score: number;
  band: HealthBand;
  drivers: HealthDriver[];
  factorBreakdown: HealthFactorBreakdown;
  csCadenceKey: CsCadenceKey;
  csCadenceLabel: string;
  computedAt: string;
};

export type HealthSignalInput = {
  saasStatus: string | null;
  commercialStatus: string | null;
  orgAdminDaysSinceLogin: number | null;
  implementationScore: number;
  productionReady: boolean;
  workOrderCount: number;
  aiConversationCount: number;
  aiEntitled: boolean;
  maintenanceEntitled: boolean;
  openSupportCount: number | null;
  notificationChannelsEnabled: boolean | null;
  orgAgeDays: number;
};

/** Founding Partner program configuration — single source for copy and math. */

export const PARTNER_REF_PARAM = "ref";
export const PARTNER_REF_COOKIE = "mpa_partner_ref";
export const PARTNER_REF_METADATA_KEY = "mpa_partner_ref";

export const FOUNDING_PARTNER_COMMISSION_PERCENT = 20;
export const FOUNDING_PARTNER_COMMISSION_BPS = FOUNDING_PARTNER_COMMISSION_PERCENT * 100;
export const FOUNDING_PARTNER_QUALIFYING_MONTHS = 12;

/** Public pricing example only — Complete Platform headline monthly. */
export const PARTNER_EXAMPLE_MONTHLY_USD = 109;

export const PARTNER_APPLY_MAX_BYTES = 16 * 1024;

export const PARTNER_TYPES = ["referral", "certified_service", "strategic"] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_STATUSES = ["applied", "approved", "active", "suspended", "rejected"] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const PARTNER_COMMISSION_STATUSES = ["pending", "earned", "paid", "void"] as const;
export type PartnerCommissionStatus = (typeof PARTNER_COMMISSION_STATUSES)[number];

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  referral: "Referral Partner",
  certified_service: "Certified Service Partner",
  strategic: "Strategic Partner"
};

export function isPartnerType(value: unknown): value is PartnerType {
  return typeof value === "string" && (PARTNER_TYPES as readonly string[]).includes(value);
}

export function isPartnerStatus(value: unknown): value is PartnerStatus {
  return typeof value === "string" && (PARTNER_STATUSES as readonly string[]).includes(value);
}

export function isPartnerCommissionStatus(value: unknown): value is PartnerCommissionStatus {
  return typeof value === "string" && (PARTNER_COMMISSION_STATUSES as readonly string[]).includes(value);
}

export function partnerAcceptsReferrals(status: PartnerStatus): boolean {
  return status === "active";
}

export function exampleFoundingCommission(monthlyUsd = PARTNER_EXAMPLE_MONTHLY_USD): {
  monthlyUsd: number;
  monthlyCommissionUsd: number;
  twelveMonthCommissionUsd: number;
  percent: number;
  months: number;
} {
  const monthlyCommissionUsd = Math.round(monthlyUsd * FOUNDING_PARTNER_COMMISSION_PERCENT) / 100;
  return {
    monthlyUsd,
    monthlyCommissionUsd,
    twelveMonthCommissionUsd:
      Math.round(monthlyCommissionUsd * FOUNDING_PARTNER_QUALIFYING_MONTHS * 100) / 100,
    percent: FOUNDING_PARTNER_COMMISSION_PERCENT,
    months: FOUNDING_PARTNER_QUALIFYING_MONTHS
  };
}

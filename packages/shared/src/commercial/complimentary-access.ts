import { entitlementsForSku, hasEntitlement } from "./entitlements";
import { evaluatePathEntitlement } from "./route-entitlements";
import { UNIT_BLOCK_SIZE } from "./unit-volume";
import { isProductSku, toSkuLabel, type ProductSku } from "./skus";

export const COMPLIMENTARY_GRANT_TYPES = ["tester", "gift"] as const;
export type ComplimentaryGrantType = (typeof COMPLIMENTARY_GRANT_TYPES)[number];

export const COMPLIMENTARY_GRANT_STATUSES = ["invited", "active", "expired", "revoked"] as const;
export type ComplimentaryGrantStatus = (typeof COMPLIMENTARY_GRANT_STATUSES)[number];

export const COMPLIMENTARY_LIMIT_MODES = ["product_normal", "custom", "unlimited"] as const;
export type ComplimentaryLimitMode = (typeof COMPLIMENTARY_LIMIT_MODES)[number];

export const COMPLIMENTARY_DURATION_PRESETS = [
  { id: "7d", days: 7, label: "7 days" },
  { id: "14d", days: 14, label: "14 days" },
  { id: "30d", days: 30, label: "30 days" },
  { id: "60d", days: 60, label: "60 days" },
  { id: "90d", days: 90, label: "90 days" },
  { id: "180d", days: 180, label: "180 days" },
  { id: "365d", days: 365, label: "1 year" },
  { id: "none", days: null, label: "No Expiration" }
] as const;

export type ComplimentaryDurationId = (typeof COMPLIMENTARY_DURATION_PRESETS)[number]["id"];

export const TESTER_FEEDBACK_REPLY_TO = "feedback@my-property-assistant.com";
export const COMPLIMENTARY_CLAIM_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const COMPLIMENTARY_EXPIRY_NOTICE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const COMPLIMENTARY_CONVERT_PATH = "/pricing?from=complimentary";

export type ComplimentaryGrant = {
  id: string;
  recipientEmail: string;
  grantType: ComplimentaryGrantType;
  productSku: ProductSku;
  status: ComplimentaryGrantStatus;
  expiresAt: string | null;
  limitMode: ComplimentaryLimitMode;
  customUnitLimit: number | null;
  organizationId: string | null;
  organizationName: string | null;
  userId: string | null;
  claimTokenHash: string | null;
  claimExpiresAt: string | null;
  grantedBy: string;
  convertedAt: string | null;
  expiryNoticeSentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ComplimentaryGrantEvent = {
  id: string;
  grantId: string;
  action: string;
  actorUserId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type ComplimentarySendAccessInput = {
  email: string;
  grantType: ComplimentaryGrantType;
  productSku: ProductSku;
  durationId: ComplimentaryDurationId;
  limitMode: ComplimentaryLimitMode;
  customUnitLimit?: number | null;
};

export function isComplimentaryGrantType(value: unknown): value is ComplimentaryGrantType {
  return typeof value === "string" && (COMPLIMENTARY_GRANT_TYPES as readonly string[]).includes(value);
}

export function isComplimentaryGrantStatus(value: unknown): value is ComplimentaryGrantStatus {
  return typeof value === "string" && (COMPLIMENTARY_GRANT_STATUSES as readonly string[]).includes(value);
}

export function isComplimentaryLimitMode(value: unknown): value is ComplimentaryLimitMode {
  return typeof value === "string" && (COMPLIMENTARY_LIMIT_MODES as readonly string[]).includes(value);
}

export function isComplimentaryDurationId(value: unknown): value is ComplimentaryDurationId {
  return (
    typeof value === "string" &&
    COMPLIMENTARY_DURATION_PRESETS.some((preset) => preset.id === value)
  );
}

export function normalizeComplimentaryEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isComplimentaryEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeComplimentaryEmail(email));
}

export function resolveComplimentaryExpiresAt(
  durationId: ComplimentaryDurationId,
  now = new Date()
): string | null {
  const preset = COMPLIMENTARY_DURATION_PRESETS.find((item) => item.id === durationId);
  if (!preset || preset.days == null) {
    return null;
  }
  return new Date(now.getTime() + preset.days * 24 * 60 * 60 * 1000).toISOString();
}

export function parseComplimentarySendAccessInput(
  payload: unknown
): ComplimentarySendAccessInput | { error: string } {
  if (!payload || typeof payload !== "object") {
    return { error: "invalid_payload" };
  }
  const value = payload as Record<string, unknown>;
  const email = typeof value["email"] === "string" ? normalizeComplimentaryEmail(value["email"]) : "";
  if (!isComplimentaryEmail(email)) {
    return { error: "invalid_email" };
  }
  if (!isComplimentaryGrantType(value["grantType"])) {
    return { error: "invalid_grant_type" };
  }
  if (!isProductSku(value["productSku"])) {
    return { error: "invalid_product_sku" };
  }
  if (!isComplimentaryDurationId(value["durationId"])) {
    return { error: "invalid_duration" };
  }
  if (!isComplimentaryLimitMode(value["limitMode"])) {
    return { error: "invalid_limit_mode" };
  }
  const customRaw = value["customUnitLimit"];
  const customUnitLimit =
    customRaw == null || customRaw === ""
      ? null
      : typeof customRaw === "number"
        ? customRaw
        : typeof customRaw === "string"
          ? Number(customRaw)
          : NaN;
  if (value["limitMode"] === "custom") {
    if (!Number.isFinite(customUnitLimit) || (customUnitLimit ?? 0) < 1) {
      return { error: "invalid_custom_limit" };
    }
  }
  return {
    email,
    grantType: value["grantType"],
    productSku: value["productSku"],
    durationId: value["durationId"],
    limitMode: value["limitMode"],
    customUnitLimit: value["limitMode"] === "custom" ? Math.floor(customUnitLimit ?? 0) : null
  };
}

export function complimentaryGrantIsOpen(status: ComplimentaryGrantStatus): boolean {
  return status === "invited" || status === "active";
}

export function complimentaryGrantIsDue(
  grant: Pick<ComplimentaryGrant, "status" | "expiresAt">,
  now = new Date()
): boolean {
  if (grant.status !== "active" && grant.status !== "invited") {
    return false;
  }
  if (!grant.expiresAt) {
    return false;
  }
  return Date.parse(grant.expiresAt) <= now.getTime();
}

export function complimentaryGrantNeedsExpiryNotice(
  grant: Pick<ComplimentaryGrant, "status" | "expiresAt" | "expiryNoticeSentAt" | "convertedAt">,
  now = new Date()
): boolean {
  if (grant.convertedAt) {
    return false;
  }
  if (grant.status !== "active" && grant.status !== "invited") {
    return false;
  }
  if (!grant.expiresAt || grant.expiryNoticeSentAt) {
    return false;
  }
  const remaining = Date.parse(grant.expiresAt) - now.getTime();
  return remaining > 0 && remaining <= COMPLIMENTARY_EXPIRY_NOTICE_WINDOW_MS;
}

export function paidSubscriptionTakesPrecedence(input: {
  stripeSubscriptionId?: string | null;
  paidStatus?: string | null;
}): boolean {
  const stripeId = input.stripeSubscriptionId?.trim();
  if (!stripeId) {
    return false;
  }
  const status = input.paidStatus ?? "active";
  return status !== "canceled" && status !== "expired" && status !== "unpaid";
}

export function resolveEffectiveComplimentaryAccess(input: {
  grant: Pick<ComplimentaryGrant, "status" | "productSku" | "expiresAt" | "convertedAt"> | null;
  stripeSubscriptionId?: string | null;
  paidStatus?: string | null;
  paidSku?: ProductSku | null;
  now?: Date;
}): {
  source: "paid" | "complimentary" | "expired" | "revoked" | "none";
  sku: ProductSku | null;
  complimentaryActive: boolean;
} {
  if (paidSubscriptionTakesPrecedence(input) && input.paidSku) {
    return { source: "paid", sku: input.paidSku, complimentaryActive: false };
  }
  if (!input.grant) {
    return { source: "none", sku: null, complimentaryActive: false };
  }
  if (input.grant.status === "revoked") {
    return { source: "revoked", sku: null, complimentaryActive: false };
  }
  if (input.grant.status === "expired" || complimentaryGrantIsDue(input.grant, input.now)) {
    return { source: "expired", sku: null, complimentaryActive: false };
  }
  if (input.grant.status === "active" || input.grant.status === "invited") {
    return {
      source: "complimentary",
      sku: input.grant.productSku,
      complimentaryActive: input.grant.status === "active"
    };
  }
  return { source: "none", sku: null, complimentaryActive: false };
}

export function resolveComplimentaryUnitLimit(
  grant: Pick<ComplimentaryGrant, "limitMode" | "customUnitLimit">
): number | null {
  if (grant.limitMode === "unlimited") {
    return null;
  }
  if (grant.limitMode === "custom") {
    return grant.customUnitLimit && grant.customUnitLimit > 0 ? grant.customUnitLimit : 1;
  }
  return UNIT_BLOCK_SIZE;
}

export function evaluateComplimentaryUnitLimit(input: {
  grant: Pick<ComplimentaryGrant, "status" | "limitMode" | "customUnitLimit" | "convertedAt"> | null;
  stripeSubscriptionId?: string | null;
  paidStatus?: string | null;
  actualUnits: number;
  additionalUnits: number;
}): { allowed: boolean; authorizedCapacity: number | null; wouldDelete: false } {
  if (paidSubscriptionTakesPrecedence(input)) {
    return { allowed: true, authorizedCapacity: null, wouldDelete: false };
  }
  if (!input.grant || input.grant.status !== "active" || input.grant.convertedAt) {
    return { allowed: true, authorizedCapacity: null, wouldDelete: false };
  }
  const authorizedCapacity = resolveComplimentaryUnitLimit(input.grant);
  if (authorizedCapacity == null) {
    return { allowed: true, authorizedCapacity: null, wouldDelete: false };
  }
  const projected = input.actualUnits + Math.max(0, Math.floor(input.additionalUnits));
  return {
    allowed: projected <= authorizedCapacity,
    authorizedCapacity,
    wouldDelete: false
  };
}

export function complimentaryClaimLocksSku(
  grantSku: ProductSku,
  requestedSku: unknown
): { ok: true; sku: ProductSku } | { ok: false; error: "claim_cannot_change_sku" } {
  if (requestedSku == null || requestedSku === "") {
    return { ok: true, sku: grantSku };
  }
  if (requestedSku !== grantSku) {
    return { ok: false, error: "claim_cannot_change_sku" };
  }
  return { ok: true, sku: grantSku };
}

export function complimentaryConversionReusesOrganization(input: {
  grantOrganizationId: string | null;
  checkoutWouldCreateNewOrg: boolean;
}): boolean {
  return Boolean(input.grantOrganizationId) && !input.checkoutWouldCreateNewOrg;
}

export function complimentaryIsolationAllowsPath(input: {
  sku: ProductSku;
  pathname: string;
}): boolean {
  return evaluatePathEntitlement({ pathname: input.pathname, sku: input.sku }).allowed;
}

export function complimentaryCompleteKeepsBothProducts(sku: ProductSku): boolean {
  const entitlements = entitlementsForSku(sku);
  return (
    sku === "mpa_complete_platform" &&
    hasEntitlement(entitlements, "pm.properties") &&
    hasEntitlement(entitlements, "facility.operations")
  );
}

export type ComplimentaryWelcomeCopy = {
  subject: string;
  preview: string;
  ctaLabel: "Set Up Your Account";
  productLabel: string;
  expirationLine: string;
  paymentLine: string;
  testerFeedback: string | null;
  replyTo: string;
};

export function complimentaryWelcomeCopy(input: {
  grantType: ComplimentaryGrantType;
  productSku: ProductSku;
  expiresAt: string | null;
}): ComplimentaryWelcomeCopy {
  const productLabel = toSkuLabel(input.productSku);
  const expirationLine = input.expiresAt
    ? `Your complimentary access expires on ${formatComplimentaryDate(input.expiresAt)}.`
    : "Your complimentary access has no expiration date.";
  const testerFeedback =
    input.grantType === "tester"
      ? "Please reply to this email with bugs, errors, confusing behavior, or suggestions. Tell us what you were doing, what happened, and what you expected. Attach a screenshot when it helps."
      : null;
  return {
    subject:
      input.grantType === "tester"
        ? `Your complimentary ${productLabel} tester access`
        : `Your complimentary ${productLabel} gift access`,
    preview: `Complimentary ${productLabel} access — no payment required.`,
    ctaLabel: "Set Up Your Account",
    productLabel,
    expirationLine,
    paymentLine: "No payment is required during this complimentary period. You will not be charged automatically.",
    testerFeedback,
    replyTo: TESTER_FEEDBACK_REPLY_TO
  };
}

export type ComplimentaryExpiryCopy = {
  subject: string;
  preview: string;
  ctaLabel: "Continue With M.P.A.";
  convertPath: string;
  chargeLine: string;
};

export function complimentaryExpiryCopy(input: { productSku: ProductSku; expiresAt: string }): ComplimentaryExpiryCopy {
  const productLabel = toSkuLabel(input.productSku);
  return {
    subject: `Your complimentary ${productLabel} access is ending`,
    preview: `Complimentary ${productLabel} access ends on ${formatComplimentaryDate(input.expiresAt)}.`,
    ctaLabel: "Continue With M.P.A.",
    convertPath: COMPLIMENTARY_CONVERT_PATH,
    chargeLine: "You will not be charged automatically. Choose a plan only if you want to continue."
  };
}

export function complimentaryExpiredPageCopy(): {
  title: string;
  body: string;
  ctaLabel: "Choose a Plan";
  convertPath: string;
  dataLine: string;
} {
  return {
    title: "Complimentary access has ended",
    body: "Your complimentary period is over. Your organization and data are still here. Choose a plan to continue using M.P.A.",
    ctaLabel: "Choose a Plan",
    convertPath: COMPLIMENTARY_CONVERT_PATH,
    dataLine: "Nothing was deleted when complimentary access ended."
  };
}

export function formatComplimentaryDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

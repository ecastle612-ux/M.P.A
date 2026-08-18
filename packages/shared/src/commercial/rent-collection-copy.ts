/**
 * Customer-facing Online Rent Collection copy.
 * Presentation only — does not change payment, Stripe, SKU, or pricing behavior.
 */

import type { ProductSku } from "./skus";

export const ONLINE_RENT_COLLECTION_EYEBROW = "Online rent collection" as const;

export const ONLINE_RENT_COLLECTION_HEADLINE = "Collect rent online, your way." as const;

export const ONLINE_RENT_COLLECTION_SUMMARY =
  "Connect Stripe and choose bank payments, cards, or both. Tenants can pay a posted balance once or authorize AutoPay for recurring rent and eligible fees. You control the amounts and payment options." as const;

export const ONLINE_RENT_COLLECTION_PREFERRED =
  "Collect rent online with Stripe. Choose bank payments, cards, or both. Tenants can pay once or authorize AutoPay for recurring rent and eligible fees. You control the amounts and payment options." as const;

export const ONLINE_RENT_COLLECTION_PRICING_LINE =
  "Online rent collection — ACH, cards & tenant AutoPay" as const;

export const ONLINE_RENT_COLLECTION_BENEFIT =
  "Give tenants flexible ways to pay while keeping control of your payment options and charge amounts." as const;

export const ONLINE_RENT_COLLECTION_COMPLETE_SCOPE =
  "Complete includes the same Property Operations rent collection when you work in the residential / property surface. Facility Operations does not collect residential rent." as const;

export const ONLINE_RENT_COLLECTION_OPTIONAL_SETUP =
  "Stripe Connect and Online Payments are optional after signup. You can use M.P.A. first, then set up Online Payments from Financial Operations when you are ready." as const;

export const ONLINE_RENT_COLLECTION_METHOD_LABELS = ["ACH", "Cards", "Pay Once", "AutoPay"] as const;

export const ONLINE_RENT_COLLECTION_FAQS = [
  {
    q: "Can tenants pay rent through M.P.A.?",
    a: "Yes. Eligible Property Operations accounts can connect Stripe and choose bank payments, cards, or both."
  },
  {
    q: "Does M.P.A. support AutoPay?",
    a: "Yes. Tenants can choose to authorize AutoPay for recurring rent and eligible recurring fees. Property managers cannot enroll a tenant without the tenant’s authorization."
  },
  {
    q: "Who sets rent and fee amounts?",
    a: "The property manager/subscriber sets rent and permitted charges. M.P.A. does not automatically invent or change fee amounts."
  },
  {
    q: "Are late fees automatically charged?",
    a: "No. Automated late-fee assessment and automated collections are not part of the current product."
  }
] as const;

export function skuIncludesOnlineRentCollection(sku: ProductSku | null | undefined): boolean {
  return sku === "mpa_property_manager" || sku === "mpa_complete_platform";
}

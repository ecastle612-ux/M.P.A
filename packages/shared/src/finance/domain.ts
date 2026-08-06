/**
 * FIN-OPS-001 S0 — Financial Operations domain registration.
 * Property Manager capability only (also Complete by SKU inclusion).
 */

export const FINANCIAL_OPERATIONS_DOMAIN_ID = "financial_operations" as const;

export const FINANCIAL_OPERATIONS_ENTITLEMENT = "pm.financial_operations" as const;

export const FINANCIAL_OPERATIONS_HOME_HREF = "/pm/financial-operations" as const;

export const FINANCIAL_OPERATIONS_OWNER = "property_manager" as const;

/** Slice roadmap for Master Admin progress surfaces. */
export const FIN_OPS_SLICES = [
  { id: "S0", name: "Financial Foundation", status: "complete" },
  { id: "S1", name: "Charges & Resident Ledger", status: "blocked" },
  { id: "S2", name: "Checkout & Payment Webhooks", status: "blocked" },
  { id: "S3", name: "Late Fees", status: "blocked" },
  { id: "S4", name: "Vendor Invoices", status: "blocked" },
  { id: "S5", name: "Vendor Payments", status: "blocked" },
  { id: "S6", name: "Summaries & Reports", status: "blocked" },
  { id: "S7", name: "Notifications, Search, Audit Polish", status: "blocked" },
  { id: "S8", name: "Certification Hardening", status: "blocked" }
] as const;

export type FinOpsSliceId = (typeof FIN_OPS_SLICES)[number]["id"];

export type FinancialDomainRegistration = {
  id: typeof FINANCIAL_OPERATIONS_DOMAIN_ID;
  label: "Financial Operations";
  owner: typeof FINANCIAL_OPERATIONS_OWNER;
  entitlement: typeof FINANCIAL_OPERATIONS_ENTITLEMENT;
  href: typeof FINANCIAL_OPERATIONS_HOME_HREF;
  /** Commercial SKUs that include this domain. */
  includedSkus: readonly ["mpa_property_manager", "mpa_complete_platform"];
  excludedSkus: readonly ["mpa_facility_operations"];
  currentSlice: "S0";
  slices: typeof FIN_OPS_SLICES;
};

export const FINANCIAL_DOMAIN_REGISTRATION: FinancialDomainRegistration = {
  id: FINANCIAL_OPERATIONS_DOMAIN_ID,
  label: "Financial Operations",
  owner: FINANCIAL_OPERATIONS_OWNER,
  entitlement: FINANCIAL_OPERATIONS_ENTITLEMENT,
  href: FINANCIAL_OPERATIONS_HOME_HREF,
  includedSkus: ["mpa_property_manager", "mpa_complete_platform"],
  excludedSkus: ["mpa_facility_operations"],
  currentSlice: "S0",
  slices: FIN_OPS_SLICES
};

export const FINANCIAL_WORKSPACE_SECTIONS = [
  { id: "overview", label: "Overview", href: "/pm/financial-operations", slice: "S0" },
  { id: "charges", label: "Charges & ledger", href: "/pm/financial-operations#charges", slice: "S1" },
  { id: "payments", label: "Payments", href: "/pm/financial-operations#payments", slice: "S2" },
  { id: "late_fees", label: "Late fees", href: "/pm/financial-operations#late-fees", slice: "S3" },
  { id: "vendor_invoices", label: "Vendor invoices", href: "/pm/financial-operations#vendor-invoices", slice: "S4" },
  { id: "vendor_payments", label: "Vendor payments", href: "/pm/financial-operations#vendor-payments", slice: "S5" },
  { id: "reports", label: "Reports", href: "/pm/financial-operations#reports", slice: "S6" }
] as const;

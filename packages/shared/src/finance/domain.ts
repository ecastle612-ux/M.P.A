/**
 * FIN-OPS-001 — Financial Operations domain registration.
 * Property Manager capability only (also Complete by SKU inclusion).
 */

export const FINANCIAL_OPERATIONS_DOMAIN_ID = "financial_operations" as const;

export const FINANCIAL_OPERATIONS_ENTITLEMENT = "pm.financial_operations" as const;

export const FINANCIAL_OPERATIONS_HOME_HREF = "/pm/financial-operations" as const;

export const FINANCIAL_OPERATIONS_OWNER = "property_manager" as const;

/**
 * Slice roadmap for Master Admin progress surfaces.
 * S3 authorization delivers Property Financial Command Center & Owner Reporting MVP
 * (operational visibility — not ERP / not autopay).
 */
export const FIN_OPS_SLICES = [
  { id: "S0", name: "Financial Foundation", status: "complete" },
  { id: "S1", name: "Resident Billing & Rent Collection", status: "complete" },
  { id: "S2", name: "Delinquency, Late Fees & Vendor AP", status: "complete" },
  { id: "S3", name: "Property Financial Command Center & Owner Reporting", status: "complete" },
  { id: "S4", name: "Autopay & Payment Plans Polish", status: "blocked" },
  { id: "S5", name: "Notifications, Search & Audit Polish", status: "blocked" },
  { id: "S6", name: "Launch Certification Hardening", status: "blocked" }
] as const;

export type FinOpsSliceId = (typeof FIN_OPS_SLICES)[number]["id"];

export type FinancialDomainRegistration = {
  id: typeof FINANCIAL_OPERATIONS_DOMAIN_ID;
  label: "Financial Operations";
  owner: typeof FINANCIAL_OPERATIONS_OWNER;
  entitlement: typeof FINANCIAL_OPERATIONS_ENTITLEMENT;
  href: typeof FINANCIAL_OPERATIONS_HOME_HREF;
  includedSkus: readonly ["mpa_property_manager", "mpa_complete_platform"];
  excludedSkus: readonly ["mpa_facility_operations"];
  currentSlice: "S3";
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
  currentSlice: "S3",
  slices: FIN_OPS_SLICES
};

export const FINANCIAL_WORKSPACE_SECTIONS = [
  { id: "overview", label: "Overview", href: "/pm/financial-operations", slice: "S0" },
  {
    id: "online_payments",
    label: "Online Payments",
    href: "/pm/financial-operations/online-payments",
    slice: "S1"
  },
  { id: "charges", label: "Charges & ledger", href: "/pm/financial-operations#charges", slice: "S1" },
  { id: "payments", label: "Payments", href: "/pm/financial-operations#payments", slice: "S1" },
  { id: "delinquency", label: "Delinquency", href: "/pm/financial-operations#delinquency", slice: "S2" },
  { id: "late_fees", label: "Late fees", href: "/pm/financial-operations#late-fees", slice: "S2" },
  { id: "vendor_invoices", label: "Vendor invoices", href: "/pm/financial-operations#vendor-invoices", slice: "S2" },
  { id: "vendor_payments", label: "Vendor payments", href: "/pm/financial-operations#vendor-payments", slice: "S2" },
  { id: "reports", label: "Reports", href: "/pm/financial-operations#reports", slice: "S3" },
  { id: "properties", label: "Properties", href: "/pm/financial-operations#properties", slice: "S3" }
] as const;

/**
 * FIN-OPS-001 search entity registration.
 * S0 registers workspace/section search; charge/payment/invoice entities wait for S7.
 */

export type FinanceSearchEntityType =
  | "finance_workspace"
  | "finance_section"
  | "finance_charge"
  | "finance_payment"
  | "finance_vendor_invoice"
  | "finance_resident_balance"
  | "finance_vendor_ap";

export type FinanceSearchEntityDefinition = {
  entityType: FinanceSearchEntityType;
  label: string;
  /** Entitlement required to surface results. */
  entitlement: "pm.financial_operations";
  slice: "S0" | "S7";
  queryFields: readonly string[];
};

export const FINANCE_SEARCH_ENTITIES: readonly FinanceSearchEntityDefinition[] = [
  {
    entityType: "finance_workspace",
    label: "Financial Operations workspace",
    entitlement: "pm.financial_operations",
    slice: "S0",
    queryFields: ["financial operations", "finance", "money", "collections"]
  },
  {
    entityType: "finance_section",
    label: "Financial Operations section",
    entitlement: "pm.financial_operations",
    slice: "S0",
    queryFields: ["overview", "charges", "payments", "late fees", "vendor invoices", "reports"]
  },
  {
    entityType: "finance_charge",
    label: "Charge",
    entitlement: "pm.financial_operations",
    slice: "S7",
    queryFields: ["id", "resident", "property", "memo"]
  },
  {
    entityType: "finance_payment",
    label: "Payment",
    entitlement: "pm.financial_operations",
    slice: "S7",
    queryFields: ["stripe id", "amount", "resident"]
  },
  {
    entityType: "finance_vendor_invoice",
    label: "Vendor invoice",
    entitlement: "pm.financial_operations",
    slice: "S7",
    queryFields: ["vendor", "invoice number", "amount"]
  },
  {
    entityType: "finance_resident_balance",
    label: "Resident money context",
    entitlement: "pm.financial_operations",
    slice: "S7",
    queryFields: ["resident name", "balance"]
  },
  {
    entityType: "finance_vendor_ap",
    label: "Vendor payables context",
    entitlement: "pm.financial_operations",
    slice: "S7",
    queryFields: ["vendor name"]
  }
];

export function financeSearchEntitiesForSlice(
  slice: FinanceSearchEntityDefinition["slice"]
): FinanceSearchEntityDefinition[] {
  return FINANCE_SEARCH_ENTITIES.filter((entity) => entity.slice === slice);
}

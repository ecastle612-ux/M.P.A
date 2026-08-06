/**
 * FIN-OPS-001 integration points — property, resident, vendor.
 * S0 registers contracts and deep-link shapes; no ledger/payment data yet.
 */

export type FinanceIntegrationPointId = "property" | "resident" | "vendor";

export type FinanceIntegrationPoint = {
  id: FinanceIntegrationPointId;
  label: string;
  description: string;
  /** Related commercial module home (not a second money system). */
  relatedModuleHref: string;
  relatedEntitlement: string;
  /** FO context panel id inside Command Center. */
  panelId: string;
  /** Fields FO will require on money objects in later slices. */
  requiredForeignKeys: readonly string[];
  sliceAvailability: "S0_shell" | "S1+" | "S4+";
};

export const FINANCE_INTEGRATION_POINTS: readonly FinanceIntegrationPoint[] = [
  {
    id: "property",
    label: "Property money context",
    description: "Every charge and summary rolls up by property. No orphan corporate charges in Launch.",
    relatedModuleHref: "/pm/properties",
    relatedEntitlement: "pm.properties",
    panelId: "property-integration",
    requiredForeignKeys: ["organization_id", "property_id", "unit_id?"],
    sliceAvailability: "S0_shell"
  },
  {
    id: "resident",
    label: "Resident ledger context",
    description: "Resident charges and payments attach via lease. Portal pay CTA arrives in S2.",
    relatedModuleHref: "/pm/residents",
    relatedEntitlement: "pm.residents",
    panelId: "resident-integration",
    requiredForeignKeys: ["organization_id", "property_id", "lease_id", "resident_user_id?"],
    sliceAvailability: "S1+"
  },
  {
    id: "vendor",
    label: "Vendor payables context",
    description: "Vendor invoices prefer work_order_id; payouts use marketplace vendor identity.",
    relatedModuleHref: "/pm/vendors",
    relatedEntitlement: "pm.vendors",
    panelId: "vendor-integration",
    requiredForeignKeys: ["organization_id", "vendor_id", "work_order_id?"],
    sliceAvailability: "S4+"
  }
];

export type FinanceTimelineItemKind =
  | "foundation"
  | "integration"
  | "charge"
  | "payment"
  | "invoice"
  | "system";

export type FinanceTimelineItem = {
  id: string;
  kind: FinanceTimelineItemKind;
  title: string;
  detail: string;
  occurredAt: string;
  href?: string;
};

/** Deterministic S0 timeline seed (no operational money events). */
export function buildFinanceFoundationTimeline(now = new Date()): FinanceTimelineItem[] {
  const iso = now.toISOString();
  return [
    {
      id: "fo-foundation",
      kind: "foundation",
      title: "Financial Operations foundation registered",
      detail: "Command Center shell, permissions, events, audit, and search catalog are live (S0).",
      occurredAt: iso,
      href: "/pm/financial-operations"
    },
    {
      id: "fo-property-point",
      kind: "integration",
      title: "Property integration point ready",
      detail: "Property-scoped money context reserved; summaries unlock in S6.",
      occurredAt: iso,
      href: "/pm/properties"
    },
    {
      id: "fo-resident-point",
      kind: "integration",
      title: "Resident integration point ready",
      detail: "Resident ledger and pay flows unlock in S1–S2.",
      occurredAt: iso,
      href: "/pm/residents"
    },
    {
      id: "fo-vendor-point",
      kind: "integration",
      title: "Vendor integration point ready",
      detail: "Invoice approval and payouts unlock in S4–S5.",
      occurredAt: iso,
      href: "/pm/vendors"
    }
  ];
}

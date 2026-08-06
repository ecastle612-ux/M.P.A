import { describe, expect, it } from "vitest";
import {
  FINANCIAL_DOMAIN_REGISTRATION,
  FINANCE_CAPABILITIES,
  FINANCE_EVENT_CATALOG,
  FINANCE_FEATURE_FLAGS,
  FINANCE_INTEGRATION_POINTS,
  FINANCE_NOTIFICATION_CATALOG,
  FINANCE_SEARCH_ENTITIES,
  FIN_OPS_SLICES,
  assertFinanceFeatureEnabled,
  buildFinanceFoundationTimeline,
  financeEventsForSlice,
  financeSearchEntitiesForSlice,
  hasFinanceCapability,
  isFinanceFeatureEnabled
} from "./index";

describe("FIN-OPS-001 S0 financial domain", () => {
  it("registers FO under Property Manager with correct entitlement", () => {
    expect(FINANCIAL_DOMAIN_REGISTRATION.owner).toBe("property_manager");
    expect(FINANCIAL_DOMAIN_REGISTRATION.entitlement).toBe("pm.financial_operations");
    expect(FINANCIAL_DOMAIN_REGISTRATION.href).toBe("/pm/financial-operations");
    expect(FINANCIAL_DOMAIN_REGISTRATION.includedSkus).toContain("mpa_property_manager");
    expect(FINANCIAL_DOMAIN_REGISTRATION.includedSkus).toContain("mpa_complete_platform");
    expect(FINANCIAL_DOMAIN_REGISTRATION.excludedSkus).toContain("mpa_facility_operations");
  });

  it("marks S0 complete and later slices blocked", () => {
    expect(FIN_OPS_SLICES[0]).toMatchObject({ id: "S0", status: "complete" });
    expect(FIN_OPS_SLICES.slice(1).every((slice) => slice.status === "blocked")).toBe(true);
  });

  it("registers pm.finance permission model", () => {
    expect(FINANCE_CAPABILITIES).toContain("pm.finance:read");
    expect(FINANCE_CAPABILITIES).toContain("pm.finance:charge.write");
    expect(hasFinanceCapability(["pm.finance:read"], "pm.finance:read")).toBe(true);
    expect(hasFinanceCapability(["pm.finance:*"], "pm.finance:reports.read")).toBe(true);
    expect(hasFinanceCapability(["pm.finance:read"], "pm.finance:charge.write")).toBe(false);
  });

  it("registers finance event, notification, and audit catalogs", () => {
    expect(financeEventsForSlice("S0").map((event) => event.type)).toContain("finance.foundation.registered");
    expect(FINANCE_EVENT_CATALOG.some((event) => event.type === "finance.payment.succeeded")).toBe(true);
    expect(FINANCE_NOTIFICATION_CATALOG.some((item) => item.key === "finance.foundation.ready")).toBe(true);
  });

  it("gates operational finance behind feature flags", () => {
    expect(isFinanceFeatureEnabled("finance.foundation")).toBe(true);
    expect(isFinanceFeatureEnabled("finance.charges")).toBe(false);
    expect(isFinanceFeatureEnabled("finance.stripe_payment_execution")).toBe(false);
    expect(isFinanceFeatureEnabled("finance.erp_accounting")).toBe(false);
    expect(FINANCE_FEATURE_FLAGS["finance.payments"]).toBe(false);
    expect(() => assertFinanceFeatureEnabled("finance.charges")).toThrow(/not authorized/);
  });

  it("registers property, resident, and vendor integration points", () => {
    expect(FINANCE_INTEGRATION_POINTS.map((point) => point.id)).toEqual(["property", "resident", "vendor"]);
    const timeline = buildFinanceFoundationTimeline(new Date("2026-08-06T00:00:00.000Z"));
    expect(timeline).toHaveLength(4);
    expect(timeline[0]?.kind).toBe("foundation");
  });

  it("exposes S0 search entities without operational money entities", () => {
    const s0 = financeSearchEntitiesForSlice("S0");
    expect(s0.every((entity) => entity.slice === "S0")).toBe(true);
    expect(FINANCE_SEARCH_ENTITIES.some((entity) => entity.entityType === "finance_charge")).toBe(true);
    expect(s0.some((entity) => entity.entityType === "finance_charge")).toBe(false);
  });
});

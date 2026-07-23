import { describe, expect, it } from "vitest";
import {
  maintenanceWorkOrderHref,
  ownerReportsHref,
  staffChargeHref,
  staffFinancialTransactionsHref,
  tenantPaymentsHref
} from "./deep-links";

describe("notification deep links (PUSH-001)", () => {
  it("routes tenants to portal payments", () => {
    expect(tenantPaymentsHref()).toBe("/portal/tenant/payments");
  });

  it("routes staff to financial surfaces", () => {
    expect(staffFinancialTransactionsHref()).toBe("/financials/transactions");
    expect(staffChargeHref("charge-1")).toBe("/financials/charges/charge-1");
    expect(staffChargeHref(null)).toBe("/financials/charges");
  });

  it("routes maintenance by audience", () => {
    expect(maintenanceWorkOrderHref("wo-1", true)).toBe("/portal/tenant/maintenance/wo-1");
    expect(maintenanceWorkOrderHref("wo-1", false)).toBe("/maintenance/wo-1");
  });

  it("routes owners to owner portal", () => {
    expect(ownerReportsHref()).toBe("/portal/owner");
  });
});

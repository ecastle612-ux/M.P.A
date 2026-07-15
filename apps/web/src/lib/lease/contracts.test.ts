import { describe, expect, it } from "vitest";
import { parseCreateLeaseInput, parseLeaseMutationInput, parseUpdateLeaseInput } from "./contracts";

describe("lease contracts", () => {
  it("parses valid create lease input", () => {
    const input = parseCreateLeaseInput({
      propertyId: "prop-1",
      unitId: "unit-1",
      primaryTenantId: "tenant-1",
      startDate: "2026-08-01",
      endDate: "2027-07-31",
      rentAmount: 1800,
      securityDeposit: 1800,
      leaseType: "residential"
    });
    expect(input?.propertyId).toBe("prop-1");
    expect(input?.rentAmount).toBe(1800);
    expect(input?.status).toBe("draft");
  });

  it("rejects invalid date range", () => {
    expect(
      parseCreateLeaseInput({
        propertyId: "prop-1",
        unitId: "unit-1",
        primaryTenantId: "tenant-1",
        startDate: "2027-01-01",
        endDate: "2026-01-01",
        rentAmount: 1000
      })
    ).toBeNull();
  });

  it("parses lifecycle mutation actions", () => {
    expect(parseLeaseMutationInput({ action: "activate" })).toEqual({ action: "activate" });
    expect(parseLeaseMutationInput({ action: "renew", extensionMonths: 6 })).toEqual({
      action: "renew",
      extensionMonths: 6
    });
  });

  it("parses partial update payload", () => {
    expect(parseUpdateLeaseInput({ rentAmount: 2000, internalNotes: "Updated" })).toEqual({
      rentAmount: 2000,
      internalNotes: "Updated"
    });
  });
});

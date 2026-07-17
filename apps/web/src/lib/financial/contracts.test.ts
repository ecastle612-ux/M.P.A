import { describe, expect, it } from "vitest";
import {
  parseCreatePaymentInput,
  parseCreateRentChargeInput,
  parseGenerateOwnerStatementInput
} from "./contracts";

describe("financial contracts", () => {
  it("parses create rent charge input", () => {
    const parsed = parseCreateRentChargeInput({
      leaseId: "00000000-0000-4000-8000-000000000001",
      description: "July rent",
      amount: 1500,
      dueDate: "2026-07-01",
      chargeType: "monthly_rent"
    });
    expect(parsed?.description).toBe("July rent");
    expect(parsed?.amount).toBe(1500);
    expect(parsed?.chargeType).toBe("monthly_rent");
  });

  it("rejects invalid rent charge payload", () => {
    expect(parseCreateRentChargeInput({ leaseId: "", description: "x", amount: 0, dueDate: "bad" })).toBeNull();
  });

  it("parses create payment input", () => {
    const parsed = parseCreatePaymentInput({
      rentChargeId: "00000000-0000-4000-8000-000000000002",
      amount: 750,
      paymentMethod: "check",
      paymentDate: "2026-07-05"
    });
    expect(parsed?.amount).toBe(750);
    expect(parsed?.paymentMethod).toBe("check");
    expect(parsed?.paymentDate).toBe("2026-07-05");
  });

  it("parses generate owner statement input", () => {
    const parsed = parseGenerateOwnerStatementInput({
      propertyId: "00000000-0000-4000-8000-000000000003",
      statementPeriodStart: "2026-07-01",
      statementPeriodEnd: "2026-07-31",
      ownerPlaceholder: "Owner LLC"
    });
    expect(parsed?.propertyId).toBe("00000000-0000-4000-8000-000000000003");
    expect(parsed?.statementPeriodStart).toBe("2026-07-01");
    expect(parsed?.ownerPlaceholder).toBe("Owner LLC");
  });
});

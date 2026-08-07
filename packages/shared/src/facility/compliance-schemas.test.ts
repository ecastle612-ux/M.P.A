import { describe, expect, it } from "vitest";
import { deriveComplianceStatus } from "./compliance-schemas";

describe("compliance schemas", () => {
  it("derives upcoming/due/overdue and terminal states", () => {
    expect(deriveComplianceStatus("2026-08-10", "2026-08-07")).toBe("upcoming");
    expect(deriveComplianceStatus("2026-08-07", "2026-08-07")).toBe("due");
    expect(deriveComplianceStatus("2026-08-01", "2026-08-07")).toBe("overdue");
    expect(deriveComplianceStatus("2026-08-01", "2026-08-07", "satisfied")).toBe("satisfied");
    expect(deriveComplianceStatus("2026-08-01", "2026-08-07", "waived")).toBe("waived");
  });
});

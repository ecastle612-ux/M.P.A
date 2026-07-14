import { describe, expect, it } from "vitest";
import { evaluateCapability } from "./permissions";

describe("permission evaluator", () => {
  it("matches exact capability grants", () => {
    expect(evaluateCapability(["membership:read"], "membership:read")).toBe(true);
    expect(evaluateCapability(["membership:read"], "membership:update")).toBe(false);
  });

  it("matches namespace wildcard grants", () => {
    expect(evaluateCapability(["membership:*"], "membership:update")).toBe(true);
    expect(evaluateCapability(["membership:*"], "invitation:read")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  packageComponentsFor,
  isScreeningDecision,
  DEFAULT_PACKAGE_COMPONENTS
} from "./contracts";

describe("screening contracts", () => {
  it("returns standard rental components by default", () => {
    expect(packageComponentsFor("standard_rental")).toEqual(DEFAULT_PACKAGE_COMPONENTS["standard_rental"]);
    expect(packageComponentsFor("unknown-package")).toContain("identity");
    expect(packageComponentsFor("unknown-package")).toContain("credit");
  });

  it("supports guarantor credit package without income", () => {
    expect(packageComponentsFor("guarantor_credit")).toEqual(["identity", "credit"]);
  });

  it("validates decisions", () => {
    expect(isScreeningDecision("approve")).toBe(true);
    expect(isScreeningDecision("reject")).toBe(true);
    expect(isScreeningDecision("conditional")).toBe(true);
    expect(isScreeningDecision("auto")).toBe(false);
  });
});

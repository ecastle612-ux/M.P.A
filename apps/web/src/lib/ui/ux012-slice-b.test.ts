import { describe, expect, it } from "vitest";
import {
  COMPONENT_MATURITY,
  componentsAtOrAbove,
  destructiveConfirmLabel,
  getComponentMaturity,
  navItemClassName
} from "@mpa/ui";

describe("UX-012 Slice B — maturity registry", () => {
  it("registers Slice B core families at Beta or Production", () => {
    const required = [
      "button",
      "input",
      "form-field",
      "table",
      "card",
      "nav-item",
      "modal",
      "drawer"
    ];
    for (const id of required) {
      const entry = getComponentMaturity(id);
      expect(entry, id).toBeDefined();
      expect(["Beta", "Production"]).toContain(entry!.maturity);
      expect(entry!.slice).toBe("B");
    }
  });

  it("exposes Production-ready inventory for widespread use", () => {
    const production = componentsAtOrAbove("Production").filter(
      (entry) => entry.maturity === "Production"
    );
    expect(production.length).toBeGreaterThanOrEqual(15);
    expect(COMPONENT_MATURITY.every((entry) => entry.id.length > 0)).toBe(true);
  });
});

describe("UX-012 Slice B — form helpers", () => {
  it("builds explicit destructive confirm verbs", () => {
    expect(destructiveConfirmLabel("property")).toBe("Delete property");
    expect(destructiveConfirmLabel("invite", "Revoke")).toBe("Revoke invite");
    expect(destructiveConfirmLabel("")).toBe("Delete");
  });
});

describe("UX-012 Slice B — nav pattern", () => {
  it("composes selected nav item classes from the pill pattern", () => {
    const selected = navItemClassName(true);
    const idle = navItemClassName(false);
    expect(selected).not.toEqual(idle);
    expect(selected.length).toBeGreaterThan(0);
  });
});

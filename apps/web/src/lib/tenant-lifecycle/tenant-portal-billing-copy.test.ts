import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TENANT_PORTAL_NAVIGATION } from "../../components/portal/navigation";
import { tenantPortalSubtitle } from "./portal-context";

const webRoot = join(process.cwd(), "src");

describe("Tenant Portal billing copy while Stripe execution is disabled", () => {
  it("does not present Pay rent as an available Tenant Portal action", () => {
    const home = readFileSync(join(webRoot, "app/(portals)/portal/tenant/page.tsx"), "utf8");
    const billing = readFileSync(
      join(webRoot, "app/(portals)/portal/tenant/billing/page.tsx"),
      "utf8"
    );
    const nav = readFileSync(join(webRoot, "components/portal/navigation.ts"), "utf8");
    const subtitle = readFileSync(join(webRoot, "lib/tenant-lifecycle/portal-context.ts"), "utf8");

    expect(home).toContain('label: "Billing"');
    expect(home).not.toMatch(/Pay rent/);
    expect(billing).toContain('title="Billing"');
    expect(billing).not.toMatch(/Pay rent/);
    expect(billing).toMatch(/payment history/);
    expect(nav).not.toMatch(/label: "Pay"/);
    expect(subtitle).not.toMatch(/Pay rent/);
  });

  it("keeps Billing navigation and history-oriented subtitle", () => {
    expect(TENANT_PORTAL_NAVIGATION.some((item) => item.label === "Billing")).toBe(true);
    expect(TENANT_PORTAL_NAVIGATION.map((item) => item.label)).not.toContain("Pay");
    expect(tenantPortalSubtitle("active")).toMatch(/billing/i);
    expect(tenantPortalSubtitle("active")).not.toMatch(/Pay rent/);
    expect(tenantPortalSubtitle("moved_out")).toMatch(/Historical records/i);
  });
});

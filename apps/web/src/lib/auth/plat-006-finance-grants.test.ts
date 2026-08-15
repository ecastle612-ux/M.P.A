import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FINANCE_CAPABILITIES, FINANCE_ROLE_GRANTS } from "@mpa/shared";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260815190000_plat_006_finance_capability_grants.sql"),
  "utf8"
);

describe("PLAT-006 Slice A finance grant migration contract", () => {
  it("inserts the eight canonical FINANCE_CAPABILITIES keys only", () => {
    expect(FINANCE_CAPABILITIES).toEqual([
      "pm.finance:read",
      "pm.finance:charge.write",
      "pm.finance:payment.refund",
      "pm.finance:late_fee.manage",
      "pm.finance:vendor_invoice.review",
      "pm.finance:vendor_payment.release",
      "pm.finance:reports.read",
      "pm.finance:settings.manage"
    ]);
    for (const key of FINANCE_CAPABILITIES) {
      expect(migration).toContain(`('${key}'`);
    }
    expect(migration).toContain("on conflict (key) do nothing");
    expect(migration).toContain("on conflict (role, capability_key) do nothing");
  });

  it("grants the approved role matrix and revokes only tenant/vendor pm.finance:read", () => {
    expect(migration).toContain("('organization_admin', 'pm.finance:settings.manage')");
    expect(migration).toContain("('property_manager', 'pm.finance:settings.manage')");
    expect(migration).toContain("('leasing_agent', 'pm.finance:read')");
    expect(migration).toContain("('property_owner', 'pm.finance:reports.read')");
    expect(migration).not.toContain("('leasing_agent', 'pm.finance:charge.write')");
    expect(migration).not.toContain("('maintenance_technician', 'pm.finance:");
    expect(migration).toMatch(
      /delete from public\.role_permission_grants[\s\S]*capability_key = 'pm\.finance:read'[\s\S]*role in \('tenant', 'vendor'\)/
    );
  });

  it("does not mutate subscriptions, SKUs, billing, RLS, or financial:* grants", () => {
    expect(migration).not.toMatch(/organization_subscriptions/);
    expect(migration).not.toMatch(/product_skus/);
    expect(migration).not.toMatch(/stripe/i);
    expect(migration).not.toMatch(/create policy|alter policy|drop policy/i);
    expect(migration).not.toMatch(/delete from public\.role_permission_grants[\s\S]*financial:/);
    expect(migration).not.toMatch(/delete from public\.permission_capabilities/);
    expect(migration).not.toMatch(/drop table|alter table|create table/i);
  });

  it("keeps source FINANCE_ROLE_GRANTS aligned with the approved matrix", () => {
    const byRole = Object.fromEntries(
      FINANCE_ROLE_GRANTS.map((row) => [row.role, [...row.capabilities]])
    );
    expect(byRole["organization_admin"]).toEqual([...FINANCE_CAPABILITIES]);
    expect(byRole["property_manager"]).toEqual([...FINANCE_CAPABILITIES]);
    expect(byRole["leasing_agent"]).toEqual(["pm.finance:read"]);
    expect(byRole["property_owner"]).toEqual(["pm.finance:read", "pm.finance:reports.read"]);
    expect(byRole["maintenance_technician"]).toEqual([]);
    expect(byRole["tenant"]).toEqual([]);
    expect(byRole["vendor"]).toEqual([]);
  });
});

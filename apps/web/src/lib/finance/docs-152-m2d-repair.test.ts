import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const m2dPath = resolve(
  process.cwd(),
  "../../supabase/migrations/20260816054252_docs_152_fin_ops_m2d_development_identity_repair.sql"
);
const m2d = readFileSync(m2dPath, "utf8");

describe("docs/152 M2D Development identity repair contract", () => {
  it("installs a trusted unit_id-only mechanism and does not execute Production M2", () => {
    expect(m2dPath).toContain("20260816054252");
    expect(m2d).toContain("finance_m2d_repair");
    expect(m2d).toContain("finance_m2d_approved_map");
    expect(m2d).toContain("docs_152_m2d_owner_unit_map");
    expect(m2d).toContain("f8232926-149d-46b3-829f-c84b55378718");
    expect(m2d).toContain("2649465e-1894-4c19-b699-457c8570a7f3");
    expect(m2d).toContain("de460536-d3c9-45c6-bfcd-4f14c42f3991");
    expect(m2d).toContain("set unit_id");
    expect(m2d).not.toMatch(/set property_id/);
    expect(m2d).not.toMatch(/set organization_id/);
    expect(m2d).not.toMatch(/set amount/);
    expect(m2d).not.toMatch(/select public\.finance_m2_run\(false/);
    expect(m2d).not.toMatch(/language\s+\w+\s+security\s+definer/i);
    expect(m2d).not.toMatch(/create or replace function[\s\S]{0,240}security\s+definer/i);
    expect(m2d).toContain("revoke all on function public.finance_m2d_repair(boolean) from public, anon, authenticated");
    expect(m2d).toContain("grant execute on function public.finance_m2d_repair(boolean) to service_role");
  });

  it("repairs the approved Development map on a scratch fixture without writing Production", () => {
    const script = resolve(process.cwd(), "../../scripts/validate-docs-152-m2d-sql.sh");
    const output = execFileSync("bash", [script], { encoding: "utf8" });
    expect(output).toContain("docs/152 M2D scratch apply: PASS");
  });
});

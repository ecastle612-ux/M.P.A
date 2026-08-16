import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const m2Path = resolve(
  process.cwd(),
  "../../supabase/migrations/20260816020000_docs_140_fin_ops_reconciliation_m2.sql"
);
const m1Live = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260816003005_docs_140_fin_ops_reconciliation_m1.sql"),
  "utf8"
);
const m1Source = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260816010000_docs_140_fin_ops_reconciliation_m1.sql"),
  "utf8"
);
const m2 = readFileSync(m2Path, "utf8");
const s0 = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260806030000_fin_ops_001_s0_foundation.sql"),
  "utf8"
);
const s1 = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260806040000_fin_ops_001_s1_resident_billing.sql"),
  "utf8"
);
const s2 = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260806050000_fin_ops_001_s2_delinquency_vendor_ap.sql"),
  "utf8"
);
const plat006 = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260815190000_plat_006_finance_capability_grants.sql"),
  "utf8"
);
const adr033 = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260815200000_adr_033_member_operating_scope.sql"),
  "utf8"
);

describe("docs/140 M2 FIN-OPS backfill contract", () => {
  it("is a successor stamp after live M1 and does not replay S0/S1/S2 or 20260816010000", () => {
    expect(m2Path).toContain("20260816020000");
    expect(m2).toContain("20260816003005");
    expect(m2).toContain("docs_140_fin_ops_reconciliation_m1");
    expect(m2).toContain("Slice M2");
    expect(m2).toContain("finance_m2_run");
    expect(m2).toContain("finance_m2_preflight");
    expect(m2).toContain("finance_m2_org_report");
    expect(m2).toContain("finance_m2_ensure_canonical_unit");
    expect(m2).toContain("finance_m2_reconcile");
    expect(m2).toContain("docs/146");
    expect(m2).toContain("ADR-035");
    expect(m2).toContain("This file INSTALLS the trusted backfill mechanism");
    expect(m2).not.toMatch(/select public\.finance_m2_run\(false\)/);
    expect(m1Live).toContain("Slice M1");
    expect(m1Live).toContain("create table if not exists public.finance_lineage_map");
    expect(m1Source).toContain("create table if not exists public.financial_charges");
    expect(s0).toContain("create table if not exists public.financial_connect_accounts");
    expect(s1).toContain("create table if not exists public.financial_charges");
    expect(s2).toContain("create table if not exists public.financial_delinquency_cases");
  });

  it("maps July facts without inventing Stripe, late fees, or schedules", () => {
    expect(m2).toContain("monthly_rent");
    expect(m2).toContain("return 'rent'");
    expect(m2).toContain("return 'one_time'");
    expect(m2).toContain("return 'partially_paid'");
    expect(m2).toContain("return 'manual_other'");
    expect(m2).toContain("return 'manual_check'");
    expect(m2).toContain("unexpected_stripe_source");
    expect(m2).toContain("july-charge:");
    expect(m2).toContain("july-payment:");
    expect(m2).toContain("july-allocation:");
    expect(m2).toContain("july-vendor-invoice:");
    expect(m2).toContain("mapped_stripe_customer_metadata");
    expect(m2).not.toMatch(/mapped_method := 'online_stripe'/);
    expect(m2).not.toMatch(/insert into public\.financial_late_fee_policies/);
    expect(m2).not.toMatch(/insert into public\.financial_delinquency_cases/);
    expect(m2).not.toMatch(/insert into public\.financial_charge_schedules/);
    expect(m2).not.toMatch(/insert into public\.financial_stripe_webhook_events/);
  });

  it("keeps July sources immutable and does not grant client EXECUTE", () => {
    expect(m2).not.toMatch(/update public\.(rent_charges|payments|vendor_invoices|vendor_payments)/i);
    expect(m2).not.toMatch(/delete from public\.(rent_charges|payments|vendor_invoices|vendor_payments)/i);
    expect(m2).not.toMatch(/truncate public\.(rent_charges|payments)/i);
    expect(m2).toContain("revoke all on function public.finance_m2_run(boolean, uuid) from public, anon, authenticated");
    expect(m2).toContain("revoke all on function public.finance_m2_org_report(uuid) from public, anon, authenticated");
    expect(m2).toContain("grant execute on function public.finance_m2_run(boolean, uuid) to service_role");
    expect(m2).toContain("grant execute on function public.finance_m2_org_report(uuid) to service_role");
    expect(m2).not.toMatch(/grant execute on function public\.finance_m2_.* to (anon|authenticated)/);
    expect(m2).not.toContain("security definer");
    expect(m2).not.toContain("member_operating_scope");
    expect(m2).not.toContain("create policy");
    expect(plat006).toContain("pm.finance:read");
    expect(adr033).toContain("create or replace function public.member_operating_scope");
  });

  it("applies docs/146 currency, unit proof, and per-org dry-run contracts", () => {
    expect(m2).toContain("finance_m2_source_currency");
    expect(m2).toContain("finance_m2_currency_provenance");
    expect(m2).toContain("migration_default_usd");
    expect(m2).toContain("unit_property_mismatch");
    expect(m2).toContain("missing_unit_for_resident");
    expect(m2).toContain("ready_count");
    expect(m2).toContain("blocked_count");
    expect(m2).toContain("if public.finance_m2_column_exists('rent_charges', 'currency')");
    expect(m2).toContain("if public.finance_m2_column_exists('payments', 'currency')");
    const staticSql = m2.replace(/\$q\$[\s\S]*?\$q\$/g, "");
    expect(staticSql).not.toMatch(/\brc\.currency\b/);
    expect(staticSql).not.toMatch(/\bp\.currency\b/);
    expect(m2).not.toContain("Unknown Unit");
    expect(m2).not.toContain("Legacy Unit");
    expect(m2).not.toContain("Unit 0");
    expect(m2).not.toMatch(/gen_random_uuid\(\).*property_units|insert into public\.property_units[\s\S]{0,80}gen_random_uuid/);
  });

  it("does not mutate billing, SKUs, subscriptions, or Stripe commerce", () => {
    expect(m2).not.toMatch(/product_skus|saas_invoices/);
    expect(m2).not.toMatch(/\/api\/commerce\/webhooks\/stripe/);
    expect(m2).not.toContain("insert into public.organization_subscriptions");
    expect(m2).not.toContain("stripe.customers.create");
    expect(m2).not.toContain("PaymentIntent");
  });

  it("applies the M2 backfill twice on a Production-shaped fixture and fails closed", () => {
    const script = resolve(process.cwd(), "../../scripts/validate-docs-140-m2-sql.sh");
    const output = execFileSync("bash", [script], { encoding: "utf8" });
    expect(output).toContain("docs/140 M2 scratch apply: PASS");
  });
});

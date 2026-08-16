import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "../../supabase/migrations/20260816010000_docs_140_fin_ops_reconciliation_m1.sql"
);
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
const plat002 = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260814160000_plat_002_authorization_hardening.sql"),
  "utf8"
);
const migration = readFileSync(migrationPath, "utf8");

const requiredTables = [
  "financial_connect_accounts",
  "financial_module_settings",
  "financial_charge_schedules",
  "financial_charges",
  "financial_payments",
  "financial_payment_allocations",
  "financial_ledger_entries",
  "financial_receipts",
  "financial_stripe_webhook_events",
  "financial_notifications",
  "financial_late_fee_policies",
  "financial_delinquency_cases",
  "financial_payment_arrangements",
  "financial_vendor_invoices",
  "financial_vendor_payments",
  "finance_lineage_map"
] as const;

const serviceSources = [
  resolve(process.cwd(), "src/lib/finance/billing-service.ts"),
  resolve(process.cwd(), "src/lib/finance/collections-service.ts"),
  resolve(process.cwd(), "src/lib/finance/reporting-service.ts"),
  resolve(process.cwd(), "src/lib/finance/events-audit.ts"),
  resolve(process.cwd(), "src/lib/finance/rent-readiness.ts"),
  resolve(process.cwd(), "src/app/api/finance/webhooks/stripe/route.ts"),
  resolve(process.cwd(), "src/app/api/finance/snapshot/route.ts")
].map((file) => readFileSync(file, "utf8"));

describe("docs/140 M1 FIN-OPS empty schema contract", () => {
  it("is a new successor stamp after the live Production tip", () => {
    expect(migrationPath).toContain("20260816010000");
    expect(migration).toContain("20260815222252");
    expect(migration).toContain("Slice M1");
  });

  it("creates the approved empty FIN-OPS object inventory plus lineage map", () => {
    for (const table of requiredTables) {
      expect(migration).toContain(`create table if not exists public.${table}`);
    }
  });

  it("matches the live application column contract", () => {
    expect(migration).toContain("due_at date not null");
    expect(migration).toContain("amount_paid numeric(14, 2)");
    expect(migration).toContain("late_fee_assessed_at timestamptz");
    expect(migration).toContain("source_charge_id uuid");
    expect(migration).toContain("stripe_checkout_session_id text");
    expect(migration).toContain("stripe_payment_intent_id text");
    expect(migration).toContain("stripe_event_id text not null unique");
    expect(migration).toContain("idempotency_key text not null");
    expect(migration).toContain("unique (payment_id, charge_id)");
    expect(migration).toContain("aging_bucket");
    expect(migration).toContain("invoice_number text not null");
    expect(migration).toContain("status text not null default 'not_started'");
    expect(joinedServices()).toContain('.from("financial_charges")');
    expect(joinedServices()).toContain('.from("financial_payments")');
    expect(joinedServices()).toContain('.from("financial_ledger_entries")');
    expect(joinedServices()).toContain('.from("financial_stripe_webhook_events")');
    expect(joinedServices()).toContain('.from("financial_vendor_invoices")');
    expect(joinedServices()).toContain("late_fee_assessed_at");
    expect(joinedServices()).toContain("source_charge_id");
  });

  it("defaults module settings safely and keeps late fees off", () => {
    expect(migration).toMatch(/late_fees_enabled boolean not null default false/);
    expect(migration).toMatch(/stripe_payment_execution_enabled boolean not null default false/);
    expect(migration).toMatch(/vendor_invoices_enabled boolean not null default false/);
    expect(migration).toMatch(/vendor_payments_enabled boolean not null default false/);
    expect(migration).toMatch(/charges_enabled boolean not null default true/);
    expect(migration).toMatch(/payments_enabled boolean not null default true/);
    expect(migration).not.toMatch(/late_fees_enabled boolean not null default true/);
    expect(migration).not.toMatch(/stripe_payment_execution_enabled boolean not null default true/);
    expect(migration).not.toContain("insert into public.financial_module_settings");
    expect(migration).not.toContain("insert into public.financial_connect_accounts");
  });

  it("uses canonical Property and vendor identity without creating a third domain", () => {
    expect(migration).toContain("references public.lease_agreements");
    expect(migration).toContain("references public.lease_residents");
    expect(migration).toContain("references public.property_properties");
    expect(migration).toContain("references public.vendor_vendors");
    expect(migration).not.toContain("create table if not exists public.lease_agreements");
    expect(migration).not.toContain("create table if not exists public.lease_residents");
    expect(migration).not.toContain("create table if not exists public.pm_residents");
    expect(migration).not.toContain("create table if not exists public.property_properties");
    expect(migration).not.toContain("create table if not exists public.vendor_vendors");
    expect(migration).not.toContain("create table if not exists public.tenants");
    expect(migration).not.toContain("create table if not exists public.leases");
  });

  it("records a lineage map without migrating July rows", () => {
    expect(migration).toContain("source_table text not null");
    expect(migration).toContain("source_id uuid not null");
    expect(migration).toContain("target_table text not null");
    expect(migration).toContain("target_id uuid not null");
    expect(migration).toContain("migration_version text not null");
    expect(migration).toContain("run_id uuid");
    expect(migration).toContain("unique (source_table, source_id, target_table)");
    expect(migration).not.toMatch(/insert into public\.(rent_charges|payments|financial_charges)/);
    expect(migration).not.toMatch(/\b(delete from|truncate|update public\.(rent_charges|payments|vendor_invoices))\b/i);
  });

  it("omits S0/S1/S2 scaffolding, grants, and helper replacement", () => {
    expect(migration).not.toContain("create table if not exists public.event_domain_events");
    expect(migration).not.toContain("create table if not exists public.audit_events");
    expect(migration).not.toContain("create or replace function public.is_org_member");
    expect(migration).not.toContain("create or replace function public.is_org_manager");
    expect(migration).not.toContain("insert into public.permission_capabilities");
    expect(migration).not.toContain("insert into public.role_permission_grants");
    expect(migration).not.toContain("('tenant', 'pm.finance:read')");
    expect(migration).not.toContain("('vendor', 'pm.finance:read')");
    expect(s0).toContain("('tenant', 'pm.finance:read')");
    expect(s1).toContain("create table if not exists public.property_properties");
    expect(s2).toContain("create table if not exists public.vendor_vendors");
  });

  it("enables fail-closed RLS without org-member or tenant/vendor staff policies", () => {
    expect(migration).toContain("alter table public.%I enable row level security");
    expect(migration).toContain("revoke all on table public.%I from public");
    expect(migration).toContain("revoke all on table public.%I from %I");
    expect(migration).toContain("grant all on table public.%I to service_role");
    expect(migration).not.toMatch(/create policy/i);
    expect(migration).not.toContain("is_org_member(");
    expect(migration).not.toContain("is_org_manager(");
    expect(migration).not.toContain("is_lease_resident(");
  });

  it("does not mutate Stripe, billing, SKUs, ADR-033, or PLAT-006 grants", () => {
    expect(migration).not.toMatch(/organization_subscriptions|product_skus|saas_invoices/);
    expect(migration).not.toMatch(/\/api\/commerce\/webhooks\/stripe/);
    expect(migration).not.toContain("member_operating_scope");
    expect(migration).not.toContain("member_allows_work_surface");
    expect(plat006).toContain("pm.finance:read");
    expect(adr033).toContain("create or replace function public.member_operating_scope");
    expect(plat002).toContain("revoke all on function public.org_sku(uuid) from public, anon");
    expect(migration).not.toEqual(s0);
    expect(migration).not.toEqual(s1);
    expect(migration).not.toEqual(s2);
  });

  it("applies idempotently on a Production-like parent lineage without changing July stubs", () => {
    const script = resolve(process.cwd(), "../../scripts/validate-docs-140-m1-sql.sh");
    const output = execFileSync("bash", [script], { encoding: "utf8" });
    expect(output).toContain("docs/140 M1 scratch apply: PASS");
  });
});

function joinedServices() {
  return serviceSources.join("\n");
}

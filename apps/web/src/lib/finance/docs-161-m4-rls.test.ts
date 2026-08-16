import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const m4 = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260816080000_docs_161_fin_ops_reconciliation_m4_write_rls.sql"),
  "utf8"
);
const m3a = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260816064707_docs_157_fin_ops_reconciliation_m3a.sql"),
  "utf8"
);
const m3b = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260816064447_docs_157_fin_ops_reconciliation_m3b.sql"),
  "utf8"
);

describe("docs/161 M4-RLS write policy contract", () => {
  it("is a successor after the live Production M3 stamps and does not replay unused stamps", () => {
    expect(m4).toContain("Successor after live Production M3A stamp 20260816064707");
    expect(m4).toContain("Do not replay 20260816070000 / 20260816070100");
    expect(m4).not.toMatch(/finance_ops_writes_set\s*\(/);
  });

  it("requires member-effective PLAT-006 capabilities on every staff write policy", () => {
    expect(m4).toContain("member_has_finance_capability(organization_id, 'pm.finance:charge.write')");
    expect(m4).toContain("member_has_finance_capability(organization_id, 'pm.finance:vendor_invoice.review')");
    expect(m4).toContain("member_has_finance_capability(organization_id, 'pm.finance:vendor_payment.release')");
    expect(m4).not.toMatch(/public\.is_org_manager\(/);
    expect(m4).not.toMatch(/public\.is_org_member\(/);
    expect(m4).not.toMatch(/roles && array\['property_manager'/);
    expect(m4).not.toMatch(/org_sku\(organization_id\) = 'mpa_/);
  });

  it("does not weaken M3 SELECT rules", () => {
    expect(m3a).toContain("financial_charges_select_staff");
    expect(m3a).toContain("financial_charges_select_resident");
    expect(m4).not.toContain("drop policy if exists financial_charges_select_staff");
    expect(m4).not.toContain("drop policy if exists financial_payments_select_staff");
    expect(m4).not.toContain("drop policy if exists financial_charges_select_resident");
    expect(m4).toContain("M3 SELECT policies are unchanged");
  });

  it("does not grant M5, Connect, settings, webhook, or lineage writes", () => {
    expect(m4).not.toContain("financial_late_fee_policies_insert");
    expect(m4).not.toContain("financial_delinquency_cases_insert");
    expect(m4).not.toContain("financial_payment_arrangements_insert");
    expect(m4).not.toContain("financial_connect_accounts_insert");
    expect(m4).not.toContain("financial_module_settings_update");
    expect(m4).toContain("revoke insert, update, delete on table public.%I from authenticated");
    expect(m4).toContain("financial_stripe_webhook_events");
    expect(m4).toContain("finance_lineage_map");
  });

  it("does not expose a new privileged client-callable SECURITY DEFINER RPC", () => {
    expect(m4).not.toMatch(/create (or replace )?function/i);
    expect(m4).not.toMatch(/security definer/i);
    expect(m4).not.toMatch(/grant execute/i);
  });

  it("does not mutate July, SKUs, subscriptions, or Stripe execution", () => {
    expect(m4).not.toMatch(/rent_charges|payment_receipts|billing_ledger_entries|financial_activity/);
    expect(m4).not.toMatch(/organization_subscriptions|product_skus|saas_/);
    expect(m4).not.toMatch(/stripe_payment_execution_enabled/);
    expect(m4).not.toMatch(/update public\.(financial_charges|financial_payments)/);
  });

  it("Complete FACILITY still cannot satisfy the member-effective helper", () => {
    expect(m3a).toContain("member_allows_work_surface(target_org_id, 'residential')");
    expect(m3a).toContain("org_allows_work_surface(target_org_id, 'residential')");
    expect(m3a).toContain("has_org_capability(target_org_id, required_capability)");
    expect(m4).toContain("member_has_finance_capability");
    expect(m4).not.toContain("create or replace function public.member_has_finance_capability");
  });

  it("keeps the M3 write-guard in place", () => {
    expect(m3b).toContain("raise exception 'finance_ops_writes_frozen'");
    expect(m3b).toContain("create or replace function public.finance_ops_writes_enabled()");
    expect(m4).toContain("fail closed with finance_ops_writes_frozen");
    expect(m4).not.toContain("drop function public.finance_ops_writes_enabled");
    expect(m4).not.toContain("drop trigger");
  });
});

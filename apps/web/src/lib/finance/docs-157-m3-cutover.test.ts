import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FINANCE_CAPABILITIES } from "@mpa/shared";

const root = resolve(process.cwd(), "../..");
const m3bPath = resolve(root, "supabase/migrations/20260816070000_docs_157_fin_ops_reconciliation_m3b.sql");
const m3aPath = resolve(root, "supabase/migrations/20260816070100_docs_157_fin_ops_reconciliation_m3a.sql");
const m3b = readFileSync(m3bPath, "utf8");
const m3a = readFileSync(m3aPath, "utf8");
const plat006 = readFileSync(
  resolve(root, "supabase/migrations/20260815190000_plat_006_finance_capability_grants.sql"),
  "utf8"
);

const LIVE_FINANCE_KEYS = [
  "pm.finance:read",
  "pm.finance:charge.write",
  "pm.finance:payment.refund",
  "pm.finance:late_fee.manage",
  "pm.finance:vendor_invoice.review",
  "pm.finance:vendor_payment.release",
  "pm.finance:reports.read",
  "pm.finance:settings.manage"
] as const;

function readApp(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

function listTs(dir: string): string[] {
  return readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      return listTs(rel);
    }
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") ? [rel] : [];
  });
}

describe("docs/157 M3 cutover contract", () => {
  it("installs M3B then M3A after the live Production tip and does not replay unused stamps", () => {
    expect(m3bPath).toContain("20260816070000");
    expect(m3aPath).toContain("20260816070100");
    expect(m3b).toContain("20260816060336");
    expect(m3b).toContain("docs_152_fin_ops_m2d_development_identity_repair");
    expect(m3a).toContain("20260816070000");
    expect(m3b).toContain("finance_ops_writes_enabled");
    expect(m3b).toContain("finance_july_freeze_enabled");
    expect(m3b).toContain("finance_m3_assert_preflight");
    expect(m3b).toContain("finance_m3_preflight");
    expect(m3b).not.toMatch(/select public\.finance_m3_assert_preflight\(/);
    expect(m3b).not.toMatch(/perform public\.finance_m3_assert_preflight\(/);
    expect(m3b).not.toMatch(/finance_ops_writes_set\(true\)/);
    expect(m3a).not.toMatch(/finance_ops_writes_set\(true\)/);
    expect(m3b).not.toContain("20260816020000_docs_140");
    expect(m3b).not.toContain("20260806030000");
    expect(m3b).not.toContain("20260806040000");
    expect(m3b).not.toContain("20260806050000");
    expect(m3a).not.toContain("20260806030000");
  });

  it("installs the approved member-aware finance helper and fail-closed staff rule", () => {
    expect(m3a).toContain("member_has_finance_capability");
    expect(m3a).toContain("org_allows_work_surface(target_org_id, 'residential')");
    expect(m3a).toContain("member_allows_work_surface(target_org_id, 'residential')");
    expect(m3a).toContain("has_org_capability(target_org_id, required_capability)");
    expect(m3a).toContain("finance_resident_owns_lease");
    expect(m3a).toContain("lease_residents");
    expect(m3a).toContain("pm_residents");
    expect(m3a).not.toMatch(/using \(public\.is_org_member/);
    expect(m3a).not.toMatch(/using \(public\.is_org_manager/);
    expect(m3a).not.toMatch(/for insert/i);
    expect(m3a).not.toMatch(/for update/i);
    expect(m3a).not.toMatch(/for delete/i);
    expect(m3a).not.toMatch(/for all/i);
    expect(m3a).toContain("grant select on table public.%I to authenticated");
    expect(m3a).toContain("revoke all on table public.%I from authenticated");
    expect(m3a).toContain("financial_stripe_webhook_events");
    expect(m3a).toContain("finance_lineage_map");
  });

  it("uses only the live PLAT-006 finance keys and does not grant tenant or vendor staff finance", () => {
    expect(FINANCE_CAPABILITIES).toEqual([...LIVE_FINANCE_KEYS]);
    for (const key of LIVE_FINANCE_KEYS) {
      expect(plat006).toContain(`('${key}'`);
    }
    expect(m3a).toContain("pm.finance:read");
    expect(m3a).toContain("pm.finance:settings.manage");
    expect(m3a).toContain("pm.finance:late_fee.manage");
    expect(m3a).not.toContain("pm.finance:payment.write");
    expect(m3a).not.toContain("pm.finance:payment.create");
    expect(m3a).not.toMatch(/insert into public\.role_permission_grants/);
    expect(m3a).not.toMatch(/\('tenant', 'pm\.finance:/);
    expect(m3a).not.toMatch(/\('vendor', 'pm\.finance:/);
    expect(m3b).not.toMatch(/insert into public\.role_permission_grants/);
  });

  it("revokes privileged setters from authenticated (PLAT-005)", () => {
    expect(m3b).toContain("revoke all on function public.finance_ops_writes_set(boolean) from public, anon, authenticated");
    expect(m3b).toContain("revoke all on function public.finance_july_freeze_set(boolean) from public, anon, authenticated");
    expect(m3b).toContain("revoke all on function public.finance_m3_assert_preflight() from public, anon, authenticated");
    expect(m3b).toContain("grant execute on function public.finance_ops_writes_set(boolean) to service_role");
    expect(m3b).not.toMatch(/grant execute on function public\.finance_ops_writes_set\(boolean\) to authenticated/);
  });

  it("freezes the approved July inventory and does not delete history", () => {
    for (const table of [
      "rent_charges",
      "payments",
      "payment_receipts",
      "payment_customers",
      "payment_attempts",
      "payment_methods",
      "billing_ledger_entries",
      "financial_activity",
      "expenses",
      "owner_statements",
      "vendor_invoices",
      "vendor_payments",
      "late_fees",
      "billing_schedules",
      "billing_invoices",
      "billing_adjustments",
      "autopay_enrollments"
    ]) {
      expect(m3b).toContain(`'${table}'`);
    }
    expect(m3b).toContain("finance_july_frozen");
    expect(m3b).toContain("revoke insert, update, delete, truncate");
    expect(m3b).toContain("polcmd <> 'r'");
    expect(m3b).not.toMatch(/drop table public\.(rent_charges|payments|vendor_invoices)/);
    expect(m3b).not.toMatch(/truncate table public\.(rent_charges|payments)/);
    expect(m3b).not.toMatch(/delete from public\.rent_charges/);
    expect(m3b).not.toMatch(/delete from public\.finance_lineage_map/);
  });

  it("does not change application finance write paths or SaaS billing", () => {
    const checkout = readApp("apps/web/src/app/api/finance/checkout/route.ts");
    const webhook = readApp("apps/web/src/app/api/finance/webhooks/stripe/route.ts");
    const commerce = readApp("apps/web/src/app/api/commerce/webhooks/stripe/route.ts");
    expect(checkout).toContain("createServiceRoleClient");
    expect(checkout).toContain('from("financial_payments")');
    expect(checkout).toContain("property_manager");
    expect(webhook).toContain("createServiceRoleClient");
    expect(webhook).toContain("financial_stripe_webhook_events");
    expect(commerce).toContain("handleSaasStripeEvent");
    expect(commerce).toContain("Do not share with /api/finance/webhooks/stripe");
    expect(m3a).not.toMatch(/organization_subscriptions|product_skus|saas_invoices/);
    expect(m3b).not.toMatch(/organization_subscriptions|product_skus|saas_invoices/);
  });

  it("classifies current finance endpoints for the M3→M4 split state", () => {
    const snapshot = readApp("apps/web/src/app/api/finance/snapshot/route.ts");
    const charges = readApp("apps/web/src/app/api/finance/charges/route.ts");
    const payments = readApp("apps/web/src/app/api/finance/payments/route.ts");
    const checkout = readApp("apps/web/src/app/api/finance/checkout/route.ts");
    const settings = readApp("apps/web/src/app/api/finance/properties/route.ts");
    const reports = readApp("apps/web/src/app/api/finance/reports/command-center/route.ts");
    const vendors = readApp("apps/web/src/app/api/finance/vendors/route.ts");
    const vendorInvoices = readApp("apps/web/src/app/api/finance/vendor-invoices/route.ts");
    const collections = readApp("apps/web/src/app/api/finance/collections/route.ts");
    const resident = readApp("apps/web/src/app/api/finance/resident/billing/route.ts");
    const financeWebhook = readApp("apps/web/src/app/api/finance/webhooks/stripe/route.ts");
    const reminders = readApp("apps/web/src/app/api/finance/reminders/route.ts");

    expect(snapshot).toContain('requireFinancePermission("pm.finance:read")');
    expect(charges).toContain('requireFinancePermission("pm.finance:read")');
    expect(charges).toContain('requireFinancePermission("pm.finance:charge.write")');
    expect(payments).toContain('requireFinancePermission("pm.finance:charge.write")');
    expect(reports).toContain('requireFinancePermission("pm.finance:reports.read")');
    expect(vendors).toContain('requireFinancePermission("pm.finance:read")');
    expect(vendorInvoices).toContain('requireFinancePermission("pm.finance:vendor_invoice.review")');
    expect(collections).toContain('requireFinancePermission("pm.finance:late_fee.manage")');
    expect(resident).toContain("lease_residents");
    expect(resident).toContain("financial_payment_arrangements");
    expect(checkout).not.toContain("requireFinancePermission");
    expect(financeWebhook).toContain("applySucceededPayment");
    expect(reminders).toContain('requireFinancePermission("pm.finance:charge.write")');
    expect(settings).toContain('requireFinancePermission("pm.finance:settings.manage")');

    const classification = {
      "GET /api/finance/snapshot": "READ SAFE",
      "GET /api/finance/charges": "READ SAFE",
      "POST /api/finance/charges": "WRITE GUARDED",
      "GET /api/finance/payments": "READ SAFE",
      "POST /api/finance/payments": "WRITE GUARDED",
      "POST /api/finance/checkout": "WRITE GUARDED",
      "GET /api/finance/properties": "READ SAFE",
      "POST /api/finance/properties": "READ SAFE",
      "GET /api/finance/reports/*": "READ SAFE",
      "GET /api/finance/vendors": "READ SAFE",
      "POST /api/finance/vendors": "WRITE GUARDED",
      "GET /api/finance/vendor-invoices": "READ SAFE",
      "POST /api/finance/vendor-invoices": "WRITE GUARDED",
      "GET /api/finance/collections": "READ SAFE",
      "POST /api/finance/collections": "WRITE GUARDED",
      "GET /api/finance/resident/billing": "READ SAFE",
      "POST /api/finance/reminders": "WRITE GUARDED",
      "POST /api/finance/webhooks/stripe": "WRITE GUARDED",
      "POST /api/commerce/webhooks/stripe": "DENIED"
    } as const;

    expect(classification["GET /api/finance/snapshot"]).toBe("READ SAFE");
    expect(classification["POST /api/finance/charges"]).toBe("WRITE GUARDED");
    expect(classification["POST /api/finance/checkout"]).toBe("WRITE GUARDED");
    expect(classification["POST /api/finance/webhooks/stripe"]).toBe("WRITE GUARDED");
    expect(classification["POST /api/commerce/webhooks/stripe"]).toBe("DENIED");
    expect(checkout).toContain("createServiceRoleClient");
    expect(m3b).toContain("finance_ops_writes_frozen");
  });

  it("does not write July finance tables from the current application", () => {
    const appFiles = [
      ...listTs("apps/web/src/app/api/finance"),
      ...listTs("apps/web/src/lib/finance")
    ];
    const joined = appFiles.map((file) => readApp(file)).join("\n");
    expect(joined).not.toMatch(/from\(["']rent_charges["']\)/);
    expect(joined).not.toMatch(/from\(["']payments["']\)/);
    expect(joined).not.toMatch(/from\(["']payment_receipts["']\)/);
    expect(joined).not.toMatch(/from\(["']vendor_invoices["']\)/);
    expect(joined).not.toMatch(/from\(["']vendor_payments["']\)/);
    expect(joined).not.toMatch(/from\(["']billing_ledger_entries["']\)/);
    expect(joined).not.toMatch(/from\(["']financial_activity["']\)/);
  });

  it("proves M3A+M3B on a scratch fixture without writing Production", () => {
    const script = resolve(root, "scripts/validate-docs-157-m3-sql.sh");
    const output = execFileSync("bash", [script], { encoding: "utf8" });
    expect(output).toContain("docs/157 M3 scratch apply: PASS");
    expect(output).not.toContain("mpa-prod");
    expect(output).not.toContain("vahnmcrpnuggxkivynvo");
  });
});

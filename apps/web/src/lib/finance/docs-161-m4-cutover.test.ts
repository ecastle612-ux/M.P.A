import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  classifyFinanceMutationError,
  resolveCheckoutFailure,
  resolveCheckoutSessionCompleted
} from "./finops-stripe-webhook";
import {
  FINANCE_M5_COLLECTION_KINDS,
  financeM5CollectionCapability,
  isFinanceM5CollectionKind
} from "./m5-hard-stop";
import { entitlementsForMember } from "@mpa/shared";

const webRoot = resolve(process.cwd(), "src");
const repoRoot = resolve(process.cwd(), "../..");

function readRepo(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function collectWebSources(dir = webRoot): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectWebSources(full));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const julyTables = [
  "rent_charges",
  "payments",
  "payment_receipts",
  "payment_customers",
  "billing_ledger_entries",
  "financial_activity",
  "expenses",
  "owner_statements",
  "vendor_invoices",
  "vendor_payments"
];

describe("docs/161 M4-APP source contracts", () => {
  it("checkout manager branch no longer uses role-only authorization", () => {
    const checkout = readRepo("apps/web/src/app/api/finance/checkout/route.ts");
    const authz = readRepo("apps/web/src/lib/finance/checkout-authz.ts");
    expect(checkout).toContain("authorizeFinanceCheckout");
    expect(checkout).toContain("createServiceRoleClient");
    expect(checkout.indexOf("authorizeFinanceCheckout")).toBeLessThan(
      checkout.indexOf("createServiceRoleClient")
    );
    expect(checkout).not.toMatch(/membershipRoles\.includes\("property_manager"\)/);
    expect(checkout).not.toMatch(/membershipRoles\.includes\("organization_admin"\)/);
    expect(checkout).not.toContain("isManager");
    expect(authz).toContain('requireFinancePermission("pm.finance:charge.write"');
    expect(authz).not.toMatch(/roles\.includes\(/);
    expect(authz).not.toContain("finance_ops_writes_enabled");
  });

  it("staff charge and manual payment writes keep pm.finance:charge.write", () => {
    const charges = readRepo("apps/web/src/app/api/finance/charges/route.ts");
    const payments = readRepo("apps/web/src/app/api/finance/payments/route.ts");
    expect(charges).toContain('requireFinancePermission("pm.finance:charge.write")');
    expect(payments).toContain('requireFinancePermission("pm.finance:charge.write")');
    expect(payments).not.toContain("payment.create");
    expect(payments).not.toContain("pm.finance:payment.refund");
  });

  it("resident billing GET and ledger GET do not persist financial_status", () => {
    const billing = readRepo("apps/web/src/app/api/finance/resident/billing/route.ts");
    const ledger = readRepo("apps/web/src/lib/finance/billing-service.ts");
    expect(billing).not.toContain("refreshResidentFinancialStatus");
    expect(billing).toContain("getLeaseLedger");
    expect(ledger).toContain("loadResidentFinancialStatus(supabase, organizationId, leaseId)");
    expect(ledger).not.toMatch(
      /export async function getLeaseLedger[\s\S]*refreshResidentFinancialStatus/
    );
  });

  it("FIN-OPS Stripe webhook stays isolated from SaaS commerce webhook", () => {
    const finops = readRepo("apps/web/src/app/api/finance/webhooks/stripe/route.ts");
    const saas = readRepo("apps/web/src/app/api/commerce/webhooks/stripe/route.ts");
    expect(finops).toContain("resolveCheckoutSessionCompleted");
    expect(finops).toContain("applySucceededPayment");
    expect(finops).not.toContain("handleSaasStripeEvent");
    expect(finops).not.toContain("verifySaasStripeWebhook");
    expect(saas).toContain("handleSaasStripeEvent");
    expect(saas).toContain("verifySaasStripeWebhook");
    expect(saas).not.toContain("applySucceededPayment");
    expect(saas).not.toContain("financial_payments");
    expect(saas).toContain("Do not share with /api/finance/webhooks/stripe");
  });

  it("M4 application paths do not write July operational finance tables", () => {
    const sources = collectWebSources();
    for (const file of sources) {
      const source = readFileSync(file, "utf8");
      for (const table of julyTables) {
        expect(source).not.toMatch(new RegExp(`\\.from\\(["']${table}["']\\)`));
      }
    }
  });

  it("stored BOTH cannot expand a single-product SKU into finance", () => {
    const foBoth = entitlementsForMember({
      sku: "mpa_facility_operations",
      roles: ["property_manager"],
      storedScope: "both"
    });
    expect(foBoth).not.toContain("pm.financial_operations");
    const pmBoth = entitlementsForMember({
      sku: "mpa_property_manager",
      roles: ["property_manager"],
      storedScope: "both"
    });
    expect(pmBoth).toContain("pm.financial_operations");
    expect(pmBoth).not.toContain("facility.operations");
  });

  it("collections POST hard-stops every M5 mutation kind", () => {
    const collections = readRepo("apps/web/src/app/api/finance/collections/route.ts");
    expect(collections).toContain("isFinanceM5CollectionKind");
    expect(collections).toContain("financeM5NotAuthorizedResponse");
    expect(collections).not.toContain("upsertLateFeePolicy");
    expect(collections).not.toContain("assessLateFees(");
    expect(collections).not.toContain("syncDelinquencyCases");
    expect(collections).not.toContain("createPaymentArrangement");
    expect(collections).not.toContain("sendDelinquencyReminder");
    expect(FINANCE_M5_COLLECTION_KINDS).toEqual([
      "policy",
      "assess_late_fees",
      "sync_delinquency",
      "reminder",
      "arrangement"
    ]);
    expect(financeM5CollectionCapability("policy")).toBe("pm.finance:late_fee.manage");
    expect(financeM5CollectionCapability("sync_delinquency")).toBe("pm.finance:read");
    expect(isFinanceM5CollectionKind("one_time")).toBe(false);
  });
});

describe("docs/161 FIN-OPS webhook pending-row contract", () => {
  const pending = {
    id: "pay_1",
    organization_id: "org_1",
    lease_id: "lease_1",
    amount: 100,
    status: "pending",
    stripe_checkout_session_id: "cs_1"
  };

  it("refuses a completed session without an existing pending payment", () => {
    const result = resolveCheckoutSessionCompleted({
      payment: null,
      organizationId: "org_1",
      leaseId: "lease_1",
      checkoutSessionId: "cs_1",
      amountTotalCents: 10000
    });
    expect(result).toEqual({ action: "refuse", error: "pending_payment_missing" });
  });

  it("never returns apply without a paymentId", () => {
    const result = resolveCheckoutSessionCompleted({
      payment: pending,
      organizationId: "org_1",
      leaseId: "lease_1",
      checkoutSessionId: "cs_1",
      amountTotalCents: 10000
    });
    expect(result.action).toBe("apply");
    if (result.action === "apply") {
      expect(result.paymentId).toBe("pay_1");
    }
  });

  it("refuses org, lease, session, or amount mismatch", () => {
    expect(
      resolveCheckoutSessionCompleted({
        payment: pending,
        organizationId: "org_other",
        leaseId: "lease_1",
        checkoutSessionId: "cs_1",
        amountTotalCents: 10000
      }).action
    ).toBe("refuse");
    expect(
      resolveCheckoutSessionCompleted({
        payment: pending,
        organizationId: "org_1",
        leaseId: "lease_1",
        checkoutSessionId: "cs_other",
        amountTotalCents: 10000
      }).action
    ).toBe("refuse");
    expect(
      resolveCheckoutSessionCompleted({
        payment: pending,
        organizationId: "org_1",
        leaseId: "lease_1",
        checkoutSessionId: "cs_1",
        amountTotalCents: 5000
      }).action
    ).toBe("refuse");
  });

  it("expired or failed events only mutate an existing pending row", () => {
    expect(resolveCheckoutFailure({ paymentId: "pay_1", organizationId: "org_1", payment: null })).toEqual({
      action: "refuse",
      error: "pending_payment_missing"
    });
    expect(
      resolveCheckoutFailure({
        paymentId: "pay_1",
        organizationId: "org_1",
        payment: { ...pending, status: "succeeded" }
      }).action
    ).toBe("refuse");
    expect(resolveCheckoutFailure({ paymentId: null, organizationId: "org_1", payment: null })).toEqual({
      action: "ignore"
    });
  });

  it("distinguishes write-guard failure from authorization denial", () => {
    expect(classifyFinanceMutationError("finance_ops_writes_frozen")).toBe("frozen");
    expect(classifyFinanceMutationError("Forbidden")).toBe("authorization");
    expect(classifyFinanceMutationError("finance_m5_not_authorized")).toBe("authorization");
  });
});

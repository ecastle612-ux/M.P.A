import { listProvisioningJobs } from "../saas-provisioning/jobs-store";
import { listSaasPurchases } from "../saas-stripe/purchase-store";
import { createServiceRoleClient } from "../supabase/service-role";
import {
  mergeCommerceOrgCreateSignals,
  type CommerceOrgCreateContext
} from "./manual-org-create";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isAbandonedCheckoutStatus(status: string | null | undefined): boolean {
  return (
    status === "checkout_expired" ||
    status === "checkout_canceled" ||
    status === "payment_failed"
  );
}

/**
 * Resolve whether this email already has a commerce/subscription claim/session.
 * Fail closed when signals exist but SKU cannot be determined.
 */
export async function resolveCommerceOrgCreateContext(
  email: string | null | undefined
): Promise<CommerceOrgCreateContext> {
  if (!email || !email.includes("@")) {
    return { kind: "none" };
  }

  const needle = normalizeEmail(email);
  const signals: Array<{ productSku?: string | null; organizationId?: string | null }> = [];

  for (const purchase of listSaasPurchases()) {
    if (!purchase.customerEmail || normalizeEmail(purchase.customerEmail) !== needle) {
      continue;
    }
    if (isAbandonedCheckoutStatus(purchase.status)) {
      continue;
    }
    signals.push({
      productSku: purchase.productSku,
      organizationId: purchase.organizationId
    });
  }

  for (const job of listProvisioningJobs()) {
    if (normalizeEmail(job.ownerEmail) !== needle) {
      continue;
    }
    signals.push({
      productSku: job.productSku,
      organizationId: job.organizationId
    });
  }

  try {
    const admin = createServiceRoleClient();
    const [{ data: sessions }, { data: jobs }] = await Promise.all([
      admin
        .from("saas_checkout_sessions")
        .select("product_sku, organization_id, customer_email, status")
        .ilike("customer_email", needle),
      admin
        .from("provisioning_jobs")
        .select("product_sku, organization_id, owner_email")
        .ilike("owner_email", needle)
    ]);

    for (const row of sessions ?? []) {
      if (isAbandonedCheckoutStatus(row.status as string | null)) {
        continue;
      }
      signals.push({
        productSku: row.product_sku as string | null,
        organizationId: row.organization_id as string | null
      });
    }
    for (const row of jobs ?? []) {
      signals.push({
        productSku: row.product_sku as string | null,
        organizationId: row.organization_id as string | null
      });
    }

    const { data: grants } = await admin
      .from("complimentary_access_grants")
      .select("product_sku, organization_id, recipient_email, status")
      .eq("recipient_email", needle);
    for (const row of grants ?? []) {
      if (row.status === "revoked") {
        continue;
      }
      signals.push({
        productSku: row.product_sku as string | null,
        organizationId: row.organization_id as string | null
      });
    }
  } catch {
    // Memory stores remain authoritative in tests and when service role is absent.
  }

  return mergeCommerceOrgCreateSignals(signals);
}

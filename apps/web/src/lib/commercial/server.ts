import {
  defaultHomeForSku,
  entitlementsForSku,
  isProductSku,
  resolveCommercialEntitlement,
  toSkuLabel,
  type EntitlementKey,
  type EntitlementSource,
  type ProductSku
} from "@mpa/shared";

export { defaultHomeForSku };
import type { User } from "@supabase/supabase-js";
import { createAuthServerClient } from "../auth/server";
import { loadEntitlementActiveGrantForOrganization } from "../admin/complimentary-grants";

export type OrganizationCommercialState = {
  sku: ProductSku | null;
  skuLabel: string | null;
  subscriptionStatus:
    | "pending"
    | "active"
    | "past_due"
    | "canceled"
    | "expired"
    | "unpaid"
    | "incomplete"
    | "dispute_hold"
    | "trialing"
    | null;
  entitlements: EntitlementKey[];
  productConfirmed: boolean;
  setupComplete: boolean;
  /** ADM-001: how the effective SKU was resolved. */
  entitlementSource: EntitlementSource | null;
};

const BASELINE_ENTITLEMENTS: EntitlementKey[] = [
  "platform.org",
  "platform.guided_setup",
  "platform.billing_self"
];

export async function getOrganizationCommercialState(
  organizationId: string
): Promise<OrganizationCommercialState> {
  const supabase = await createAuthServerClient();

  // Generated Database types lag Stripe columns on organization_subscriptions.
  const loose = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (
          column: string,
          value: string
        ) => {
          maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
        };
      };
    };
  };

  const [{ data: subscription }, { data: setup }, grant] = await Promise.all([
    loose
      .from("organization_subscriptions")
      .select("sku_code, status, stripe_subscription_id")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("organization_setup_state")
      .select("product_confirmed, completed_at")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    loadEntitlementActiveGrantForOrganization(organizationId)
  ]);

  const resolved = resolveCommercialEntitlement({
    subscription: subscription
      ? {
          sku_code: typeof subscription["sku_code"] === "string" ? subscription["sku_code"] : null,
          status: typeof subscription["status"] === "string" ? subscription["status"] : null,
          stripe_subscription_id:
            typeof subscription["stripe_subscription_id"] === "string"
              ? subscription["stripe_subscription_id"]
              : null
        }
      : null,
    grant: grant
      ? {
          plan_granted: grant.plan_granted,
          status: grant.status,
          start_date: grant.start_date,
          expiration_date: grant.expiration_date
        }
      : null
  });

  const sku = resolved.sku && isProductSku(resolved.sku) ? resolved.sku : null;
  const subscriptionStatus =
    typeof subscription?.["status"] === "string"
      ? (subscription["status"] as OrganizationCommercialState["subscriptionStatus"])
      : null;

  return {
    sku,
    skuLabel: sku ? toSkuLabel(sku) : null,
    subscriptionStatus,
    entitlements: sku ? entitlementsForSku(sku) : BASELINE_ENTITLEMENTS,
    productConfirmed: Boolean(setup?.product_confirmed),
    setupComplete: Boolean(setup?.completed_at),
    entitlementSource: resolved.source
  };
}

export async function assignOrganizationSubscription(input: {
  organizationId: string;
  sku: ProductSku;
  assignedBy: string;
}): Promise<{ error: string | null }> {
  const supabase = await createAuthServerClient();
  const { error } = await supabase.from("organization_subscriptions").upsert(
    {
      organization_id: input.organizationId,
      sku_code: input.sku,
      status: "active",
      assigned_by: input.assignedBy
    },
    { onConflict: "organization_id" }
  );

  if (error) {
    return { error: error.message };
  }

  const { error: setupError } = await supabase.from("organization_setup_state").upsert(
    {
      organization_id: input.organizationId,
      product_confirmed: true,
      checklist: {
        product_selected: true
      }
    },
    { onConflict: "organization_id" }
  );

  return { error: setupError?.message ?? null };
}

export async function isPlatformOperatorUser(user: User): Promise<boolean> {
  if (user.app_metadata?.["platform_operator"] === true) {
    return true;
  }

  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("platform_operators")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

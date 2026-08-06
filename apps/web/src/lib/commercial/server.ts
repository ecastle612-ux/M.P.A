import {
  entitlementsForSku,
  isProductSku,
  toSkuLabel,
  type EntitlementKey,
  type ProductSku
} from "@mpa/shared";
import type { User } from "@supabase/supabase-js";
import { createAuthServerClient } from "../auth/server";

export type OrganizationCommercialState = {
  sku: ProductSku | null;
  skuLabel: string | null;
  subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | null;
  entitlements: EntitlementKey[];
  productConfirmed: boolean;
  setupComplete: boolean;
};

export async function getOrganizationCommercialState(
  organizationId: string
): Promise<OrganizationCommercialState> {
  const supabase = await createAuthServerClient();

  const [{ data: subscription }, { data: setup }] = await Promise.all([
    supabase
      .from("organization_subscriptions")
      .select("sku_code, status")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("organization_setup_state")
      .select("product_confirmed, completed_at")
      .eq("organization_id", organizationId)
      .maybeSingle()
  ]);

  const sku = subscription && isProductSku(subscription.sku_code) ? subscription.sku_code : null;

  return {
    sku,
    skuLabel: sku ? toSkuLabel(sku) : null,
    subscriptionStatus: subscription?.status ?? null,
    entitlements: sku ? entitlementsForSku(sku) : ["platform.org", "platform.guided_setup", "platform.billing_self"],
    productConfirmed: Boolean(setup?.product_confirmed),
    setupComplete: Boolean(setup?.completed_at)
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

export function defaultHomeForSku(sku: ProductSku | null): string {
  if (!sku) {
    return "/setup";
  }
  if (sku === "mpa_facility_operations") {
    return "/facility/mission-control";
  }
  if (sku === "mpa_complete_platform") {
    return "/launcher";
  }
  return "/pm/mission-control";
}

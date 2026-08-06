import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { isProductSku, toSkuLabel, type ProductSku } from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { ACTIVE_ORGANIZATION_COOKIE, type OrganizationSummary } from "./contracts";

type MembershipWithOrganizationRow = {
  id: string;
  organization_id: string;
  user_id: string;
  roles: string[];
  status: "active" | "inactive";
  organizations: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type SubscriptionRow = {
  organization_id: string;
  sku_code: string;
  status: string;
};

type SetupRow = {
  organization_id: string;
  completed_at: string | null;
};

export async function requireAuthenticatedUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  user: User;
}> {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  return { supabase, user };
}

export function isOrganizationManager(roles: readonly string[]): boolean {
  return roles.includes("property_manager");
}

export async function getOrganizationsForUser(userId: string): Promise<OrganizationSummary[]> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("id, organization_id, user_id, roles, status, organizations(id, name, slug)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as MembershipWithOrganizationRow[];
  const organizationIds = rows.map((row) => row.organization_id);

  const subscriptionByOrg = new Map<string, ProductSku>();
  const setupCompleteByOrg = new Map<string, boolean>();

  if (organizationIds.length > 0) {
    const [{ data: subscriptions }, { data: setups }] = await Promise.all([
      supabase
        .from("organization_subscriptions")
        .select("organization_id, sku_code, status")
        .in("organization_id", organizationIds),
      supabase.from("organization_setup_state").select("organization_id, completed_at").in("organization_id", organizationIds)
    ]);

    for (const subscription of (subscriptions ?? []) as SubscriptionRow[]) {
      if (isProductSku(subscription.sku_code) && subscription.status !== "canceled") {
        subscriptionByOrg.set(subscription.organization_id, subscription.sku_code);
      }
    }

    for (const setup of (setups ?? []) as SetupRow[]) {
      setupCompleteByOrg.set(setup.organization_id, Boolean(setup.completed_at));
    }
  }

  return rows
    .filter((row) => row.organizations)
    .map((row) => {
      const productSku = subscriptionByOrg.get(row.organization_id) ?? null;
      return {
        id: row.organization_id,
        name: row.organizations?.name ?? "",
        slug: row.organizations?.slug ?? "",
        roles: row.roles.filter(
          (role): role is "property_manager" | "property_owner" | "tenant" | "vendor" =>
            role === "property_manager" || role === "property_owner" || role === "tenant" || role === "vendor"
        ),
        productSku,
        productLabel: productSku ? toSkuLabel(productSku) : null,
        setupComplete: setupCompleteByOrg.get(row.organization_id) ?? false
      };
    });
}

export async function getActiveOrganizationIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
}

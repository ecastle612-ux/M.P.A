import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import {
  isActiveComplimentaryGrant,
  isUserRole,
  resolveCommercialEntitlement,
  toSkuLabel,
  type ProductSku,
  type UserRole
} from "@mpa/shared";
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
  stripe_subscription_id?: string | null;
};

type GrantRow = {
  organization_id: string;
  plan_granted: string;
  grant_status: string;
  start_date: string;
  expiration_date: string | null;
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
  return roles.includes("property_manager") || roles.includes("organization_admin");
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

  const subscriptionRows = new Map<string, SubscriptionRow>();
  const grantByOrg = new Map<string, GrantRow>();

  if (organizationIds.length > 0) {
    // Generated Database types lag Stripe / ADM-001 columns; use loose selects.
    const loose = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          in: (
            column: string,
            values: string[]
          ) => Promise<{ data: Record<string, unknown>[] | null }> & {
            eq: (
              column: string,
              value: string
            ) => Promise<{ data: Record<string, unknown>[] | null }>;
          };
        };
      };
    };

    const [{ data: subscriptions }, { data: setups }, { data: grants }] = await Promise.all([
      loose
        .from("organization_subscriptions")
        .select("organization_id, sku_code, status, stripe_subscription_id")
        .in("organization_id", organizationIds),
      supabase
        .from("organization_setup_state")
        .select("organization_id, completed_at")
        .in("organization_id", organizationIds),
      loose
        .from("master_admin_access_grants")
        .select("organization_id, plan_granted, grant_status, start_date, expiration_date")
        .in("organization_id", organizationIds)
        .eq("grant_status", "active")
    ]);

    for (const subscription of (subscriptions ?? []) as unknown as SubscriptionRow[]) {
      subscriptionRows.set(subscription.organization_id, subscription);
    }

    for (const grant of (grants ?? []) as unknown as GrantRow[]) {
      if (isActiveComplimentaryGrant(grant)) {
        grantByOrg.set(grant.organization_id, grant);
      }
    }

    for (const setup of (setups ?? []) as SetupRow[]) {
      setupCompleteByOrg.set(setup.organization_id, Boolean(setup.completed_at));
    }

    for (const organizationId of organizationIds) {
      const resolved = resolveCommercialEntitlement({
        subscription: subscriptionRows.get(organizationId) ?? null,
        grant: grantByOrg.get(organizationId)
          ? {
              plan_granted: grantByOrg.get(organizationId)!.plan_granted,
              grant_status: grantByOrg.get(organizationId)!.grant_status,
              start_date: grantByOrg.get(organizationId)!.start_date,
              expiration_date: grantByOrg.get(organizationId)!.expiration_date
            }
          : null
      });
      if (resolved.sku) {
        subscriptionByOrg.set(organizationId, resolved.sku);
      }
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
        roles: row.roles.filter((role): role is UserRole => isUserRole(role)),
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

import { defaultOrganizationName, storedScopeForNewMembership, type ProductSku } from "@mpa/shared";
import { createOrganizationSlugFromName } from "../organization/contracts";
import { serverEnv } from "../env/server-env";
import { loadComplimentaryStoreFromDb, persistComplimentaryEvent, persistComplimentaryGrant } from "./durable";
import {
  listComplimentaryGrantEvents,
  type ComplimentaryServiceDeps
} from "./service";
import { getComplimentaryGrantStore, type ComplimentaryGrantStore } from "./store";

async function tryServiceRole() {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

export async function loadRuntimeComplimentaryStore(): Promise<ComplimentaryGrantStore> {
  const supabase = await tryServiceRole();
  if (!supabase) {
    return getComplimentaryGrantStore();
  }
  return loadComplimentaryStoreFromDb(supabase);
}

export async function persistRuntimeComplimentaryState(store: ComplimentaryGrantStore): Promise<void> {
  const supabase = await tryServiceRole();
  if (!supabase) {
    return;
  }
  for (const grant of store.list()) {
    await persistComplimentaryGrant(supabase, grant);
    for (const event of store.listEvents(grant.id)) {
      await persistComplimentaryEvent(supabase, event);
    }
  }
}

export async function createRuntimeComplimentaryDeps(
  store: ComplimentaryGrantStore
): Promise<ComplimentaryServiceDeps> {
  const supabase = await tryServiceRole();
  return {
    store,
    findAuthUserByEmail: async (email) => {
      if (!supabase) return null;
      const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = listed.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
      return existing ? { id: existing.id, email } : null;
    },
    createOrUpdateAuthUser: async ({ email, password, existing }) => {
      if (!supabase) {
        return existing ?? { id: `pending_user_${email}`, email };
      }
      if (existing) {
        if (password && password.length >= 8) {
          await supabase.auth.admin.updateUserById(existing.id, {
            password,
            email_confirm: true
          });
        }
        return existing;
      }
      const created = await supabase.auth.admin.createUser({
        email,
        ...(password && password.length >= 8 ? { password } : {}),
        email_confirm: true,
        user_metadata: { mpa_complimentary: true }
      });
      if (created.error || !created.data.user) {
        throw new Error(created.error?.message ?? "auth_user_create_failed");
      }
      return { id: created.data.user.id, email };
    },
    createOrganization: async ({ name, ownerUserId, email, sku }) => {
      const organizationName = name || defaultOrganizationName(email);
      if (!supabase) {
        return { organizationId: `org_${ownerUserId}`, organizationName };
      }
      const slug = `${createOrganizationSlugFromName(organizationName)}-${crypto.randomUUID().slice(0, 8)}`;
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name: organizationName,
          slug,
          created_by: ownerUserId
        })
        .select("id, name")
        .single();
      if (error || !data) {
        throw new Error(error?.message ?? "org_create_failed");
      }
      await supabase.from("organization_memberships").upsert(
        {
          organization_id: data.id,
          user_id: ownerUserId,
          roles: ["organization_admin", "property_manager"],
          status: "active",
          operating_scope: storedScopeForNewMembership(sku)
        },
        { onConflict: "organization_id,user_id" }
      );
      return { organizationId: data.id, organizationName: data.name };
    },
    assignSku: async ({ organizationId, sku, assignedBy }) => {
      if (!supabase) {
        return { error: null };
      }
      const { error } = await supabase.from("organization_subscriptions").upsert(
        {
          organization_id: organizationId,
          sku_code: sku,
          status: "active",
          assigned_by: assignedBy
        },
        { onConflict: "organization_id" }
      );
      if (error) {
        return { error: error.message };
      }
      const { error: setupError } = await supabase.from("organization_setup_state").upsert(
        {
          organization_id: organizationId,
          product_confirmed: true,
          checklist: {
            product_selected: true,
            billing_acknowledged: true,
            modules_reviewed: false,
            home_selected: false,
            next_step_acknowledged: false
          }
        },
        { onConflict: "organization_id" }
      );
      return { error: setupError?.message ?? null };
    },
    hasPaidSubscription: async (organizationId) => {
      if (!supabase) {
        return { stripeSubscriptionId: null, status: null, sku: null };
      }
      const { data } = await supabase
        .from("organization_subscriptions")
        .select("sku_code, status, stripe_subscription_id")
        .eq("organization_id", organizationId)
        .maybeSingle();
      return {
        stripeSubscriptionId: (data?.stripe_subscription_id as string | null) ?? null,
        status: (data?.status as string | null) ?? null,
        sku: (data?.sku_code as ProductSku | null) ?? null
      };
    }
  };
}

export { listComplimentaryGrantEvents };

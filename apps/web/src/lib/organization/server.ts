import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createAuthServerComponentClient } from "../auth/server";
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

export async function requireAuthenticatedUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createAuthServerComponentClient>>;
  user: User;
}> {
  const supabase = await createAuthServerComponentClient();
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
  const supabase = await createAuthServerComponentClient();
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("id, organization_id, user_id, roles, status, organizations(id, name, slug)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as MembershipWithOrganizationRow[];

  return rows
    .filter((row) => row.organizations)
    .map((row) => ({
      id: row.organization_id,
      name: row.organizations?.name ?? "",
      slug: row.organizations?.slug ?? "",
      roles: row.roles.filter(
        (role): role is "property_manager" | "property_owner" | "tenant" | "vendor" =>
          role === "property_manager" || role === "property_owner" || role === "tenant" || role === "vendor"
      )
    }));
}

export async function getActiveOrganizationIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
}

export async function resolveActiveOrganizationIdForUser(userId: string): Promise<string | null> {
  const cookieOrganizationId = await getActiveOrganizationIdFromCookie();
  const organizations = await getOrganizationsForUser(userId);
  if (organizations.length === 0) {
    return null;
  }
  if (cookieOrganizationId && organizations.some((organization) => organization.id === cookieOrganizationId)) {
    return cookieOrganizationId;
  }
  return organizations[0]?.id ?? null;
}

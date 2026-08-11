import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import {
  aggregateUsersFromMemberships,
  filterMemberships,
  filterUsers,
  parseUserFilters,
  type Ma3MembershipRow,
  type Ma3UserFilters,
  type Ma3UserRow
} from "./ma3-users";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- additive ops tables
type AnyClient = { from: (table: string) => any };

async function tryServiceRole(): Promise<AnyClient | null> {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient() as unknown as AnyClient;
  } catch {
    return null;
  }
}

export type Ma3UsersDirectory = {
  users: Ma3UserRow[];
  memberships: Ma3MembershipRow[];
  filters: Ma3UserFilters;
  degraded: string[];
  totals: {
    users: number;
    memberships: number;
    activeMemberships: number;
  };
};

export async function loadMa3UsersDirectory(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> = {}
): Promise<Ma3UsersDirectory> {
  const degraded: string[] = [];
  const filters = parseUserFilters(searchParams);
  const service = await tryServiceRole();
  const client = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;

  let membershipRows: Ma3MembershipRow[] = [];

  try {
    const { data, error } = await client
      .from("organization_memberships")
      .select(
        "id, user_id, organization_id, roles, status, created_at, updated_at, organizations(id, name)"
      )
      .order("updated_at", { ascending: false })
      .limit(2000);
    if (error) {
      degraded.push(`Memberships: ${error.message}`);
    } else {
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      const userIds = [...new Set(rows.map((r) => String(r["user_id"])))];

      const profileByUser = new Map<string, { displayName: string | null; email: string | null }>();
      if (userIds.length) {
        try {
          const { data: profiles } = await client
            .from("user_profiles")
            .select("user_id, display_name, contact_email")
            .in("user_id", userIds.slice(0, 1000));
          for (const p of (profiles ?? []) as Array<Record<string, unknown>>) {
            profileByUser.set(String(p["user_id"]), {
              displayName: typeof p["display_name"] === "string" ? p["display_name"] : null,
              email: typeof p["contact_email"] === "string" ? p["contact_email"] : null
            });
          }
        } catch (e) {
          degraded.push(
            `Profiles: ${e instanceof Error ? e.message : "profile lookup failed"}`
          );
        }
      }

      membershipRows = rows.map((r) => {
        const orgRaw = r["organizations"];
        const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
        const orgObj = (org ?? {}) as Record<string, unknown>;
        const userId = String(r["user_id"]);
        const profile = profileByUser.get(userId);
        return {
          membershipId: String(r["id"]),
          userId,
          organizationId: String(r["organization_id"]),
          organizationName:
            typeof orgObj["name"] === "string" ? orgObj["name"] : "Organization",
          roles: Array.isArray(r["roles"]) ? (r["roles"] as string[]) : [],
          status: String(r["status"] ?? ""),
          createdAt: typeof r["created_at"] === "string" ? r["created_at"] : null,
          updatedAt: String(r["updated_at"] ?? ""),
          displayName: profile?.displayName ?? null,
          email: profile?.email ?? null
        };
      });
    }
  } catch (e) {
    degraded.push(e instanceof Error ? e.message : "Failed to load memberships");
  }

  if (!service) degraded.push("Service role unavailable — directory may be incomplete under RLS");

  const filteredMemberships = filterMemberships(membershipRows, filters);
  const users = filterUsers(aggregateUsersFromMemberships(filteredMemberships), filters);

  return {
    users,
    memberships: filteredMemberships,
    filters,
    degraded,
    totals: {
      users: users.length,
      memberships: filteredMemberships.length,
      activeMemberships: filteredMemberships.filter((m) => m.status === "active").length
    }
  };
}

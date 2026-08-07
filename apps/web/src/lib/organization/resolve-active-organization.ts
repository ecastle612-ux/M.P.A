import type { SupabaseClient } from "@supabase/supabase-js";
import { getActiveOrganizationIdFromCookie, getOrganizationsForUser } from "./server";

type Db = SupabaseClient;

/**
 * Resolve the active organization for portal/API work.
 * Cookie first (staff + switched context), then resident link, then first membership.
 * Never leave a provisioned resident without an org when membership/resident rows exist.
 */
export async function resolveActiveOrganizationIdForUser(
  supabase: Db,
  userId: string,
  options?: { allowResidentFallback?: boolean }
): Promise<string | null> {
  const fromCookie = await getActiveOrganizationIdFromCookie();
  if (fromCookie) {
    return fromCookie;
  }

  if (options?.allowResidentFallback !== false) {
    const { data: resident } = await supabase
      .from("pm_residents")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    const residentOrg =
      resident && typeof (resident as { organization_id?: string }).organization_id === "string"
        ? (resident as { organization_id: string }).organization_id
        : null;
    if (residentOrg) {
      return residentOrg;
    }
  }

  const organizations = await getOrganizationsForUser(userId);
  return organizations[0]?.id ?? null;
}

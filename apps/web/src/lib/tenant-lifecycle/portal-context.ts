import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantAccessMode } from "@mpa/shared";
import {
  listOccupanciesForUser,
  resolveTenantPortalMode,
  type OccupancyRow
} from "./tenant-lifecycle-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type TenantPortalContext = {
  mode: TenantAccessMode;
  current: OccupancyRow | null;
  historical: OccupancyRow[];
};

export async function loadTenantPortalContext(
  supabase: Db,
  organizationId: string,
  userId: string
): Promise<TenantPortalContext> {
  const occupancies = await listOccupanciesForUser(supabase, organizationId, userId);
  return resolveTenantPortalMode(occupancies);
}

export function tenantPortalSubtitle(mode: TenantAccessMode): string {
  if (mode === "active") {
    return "Review billing, report issues, and find what you need — fast.";
  }
  if (mode === "future") {
    return "Your move-in date is on file. Current unit tools open on that date.";
  }
  if (mode === "moved_out") {
    return "Your active property access has ended. Historical records stay available.";
  }
  return "Waiting for an authorized occupancy.";
}

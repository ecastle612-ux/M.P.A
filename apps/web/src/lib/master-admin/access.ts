import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { DEV_MASTER_ADMIN_APP_METADATA_FLAG } from "@mpa/shared";
import { createAuthServerClient, createAuthServerComponentClient } from "../auth/server";
import { resolveActiveOrganizationIdForUser } from "../organization/server";
import { apiError } from "../api/http";

/**
 * MAC-002 — single source of truth for platform Master Admin.
 *
 * Platform Master Admin is granted ONLY via Auth `app_metadata.dev_master_admin`.
 * It is NOT an organization role and MUST NOT be granted via
 * `organization_permission_overrides` (org managers cannot escalate).
 *
 * Middleware, API gates, page guards, and helpers all use this check.
 */
export function hasPlatformMasterAdminGrant(
  user: { app_metadata?: Record<string, unknown> } | null | undefined
): boolean {
  const metadata = user?.app_metadata as Record<string, unknown> | undefined;
  return metadata?.[DEV_MASTER_ADMIN_APP_METADATA_FLAG] === true;
}

/** @deprecated Use hasPlatformMasterAdminGrant — kept as the async-capable name used across the codebase. */
export async function userHasMasterAdminCapability(user: User): Promise<boolean> {
  return hasPlatformMasterAdminGrant(user);
}

export async function requireMasterAdminPageAccess(): Promise<{
  user: User;
  organizationId: string;
}> {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/setup");

  if (!hasPlatformMasterAdminGrant(user)) {
    redirect("/unauthorized");
  }

  return { user, organizationId };
}

export async function requireMasterAdminApiAccess(): Promise<
  | { ok: true; user: User; organizationId: string }
  | { ok: false; response: ReturnType<typeof apiError> }
> {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: apiError(401, "UNAUTHORIZED", "Authentication required.") };
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return { ok: false, response: apiError(400, "NO_ORGANIZATION", "Active organization required.") };
  }

  if (!hasPlatformMasterAdminGrant(user)) {
    return { ok: false, response: apiError(403, "FORBIDDEN", "Master Admin capability required.") };
  }

  return { ok: true, user, organizationId };
}

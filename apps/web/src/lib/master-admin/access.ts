import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import { createAuthServerClient, createAuthServerComponentClient } from "../auth/server";
import { resolveActiveOrganizationIdForUser } from "../organization/server";
import { apiError } from "../api/http";

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

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "master_admin")) {
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
    return { ok: false, response: apiError(401, "UNAUTHENTICATED", "Please sign in to continue.") };
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return {
      ok: false,
      response: apiError(400, "NO_ORGANIZATION", "Select or create an organization first.")
    };
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "master_admin")) {
    return {
      ok: false,
      response: apiError(403, "FORBIDDEN", "Master Admin capability required.")
    };
  }

  return { ok: true, user, organizationId };
}

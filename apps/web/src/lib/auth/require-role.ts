import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessRole, type UserRole } from "@mpa/shared";
import { createAuthServerComponentClient } from "./server";
import { buildAuthorizationContext } from "./session";
import { ACTIVE_ORGANIZATION_COOKIE } from "../organization/contracts";

export async function requireRole(requiredRole: UserRole | UserRole[]) {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;

  let organizationRoles: string[] | undefined;
  if (activeOrganizationId) {
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("roles")
      .eq("organization_id", activeOrganizationId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    organizationRoles = membership?.roles;
  }

  const context = buildAuthorizationContext(
    user,
    null,
    organizationRoles
      ? {
          organizationId: activeOrganizationId,
          roles: organizationRoles
        }
      : {
          organizationId: activeOrganizationId
        }
  );
  if (!canAccessRole(context, requiredRole)) {
    redirect("/unauthorized");
  }

  return context;
}

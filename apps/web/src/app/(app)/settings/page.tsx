import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveAuthenticatedShellContext } from "../../../lib/auth/get-shell-context";
import { userHasMasterAdminCapability } from "../../../lib/master-admin/access";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { resolveSettingsLandingHref } from "../../../lib/settings/nav";

/**
 * Settings home — first entitled tab (A09).
 * HQ-only Master Admin lands on Preferences.
 */
export default async function SettingsIndexPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [organizationId, isMasterAdmin, shellContext] = await Promise.all([
    resolveActiveOrganizationIdForUser(user.id),
    userHasMasterAdminCapability(user),
    resolveAuthenticatedShellContext(user)
  ]);
  const authorization = await resolveAuthorizationContext(user, organizationId);
  const masterAdminOnly = isMasterAdmin && shellContext.availableRoles.length === 0;

  redirect(
    resolveSettingsLandingHref({
      authorization,
      isMasterAdmin,
      hasActiveOrganization: Boolean(organizationId),
      masterAdminOnly
    })
  );
}

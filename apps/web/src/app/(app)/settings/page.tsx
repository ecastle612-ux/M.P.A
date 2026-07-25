import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { userHasMasterAdminCapability } from "../../../lib/master-admin/access";
import { resolveAuthenticatedShellContext } from "../../../lib/auth/get-shell-context";

/**
 * Settings home: org-first for portfolio operators; appearance-first for HQ-only Master Admin
 * so theme (light/dark) is always one click away.
 */
export default async function SettingsIndexPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const [isMasterAdmin, shellContext] = await Promise.all([
      userHasMasterAdminCapability(user),
      resolveAuthenticatedShellContext(user)
    ]);
    const masterAdminOnly = isMasterAdmin && shellContext.availableRoles.length === 0;
    if (masterAdminOnly) {
      redirect("/settings/appearance");
    }
  }

  redirect("/settings/organization");
}

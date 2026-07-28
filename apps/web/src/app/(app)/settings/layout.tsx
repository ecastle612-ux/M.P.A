import type { ReactNode } from "react";
import { AppPage } from "../../../components/presentation/app-page";
import { SettingsSubnav } from "../../../components/settings/settings-subnav";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../lib/master-admin/access";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { resolveVisibleSettingsNavItems } from "../../../lib/settings/nav";

/** UX-012 A09 — Settings shell with capability-filtered subnav. */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let items: ReturnType<typeof resolveVisibleSettingsNavItems> = [];
  if (user) {
    const [organizationId, isMasterAdmin] = await Promise.all([
      resolveActiveOrganizationIdForUser(user.id),
      userHasMasterAdminCapability(user)
    ]);
    const authorization = await resolveAuthorizationContext(user, organizationId);
    items = resolveVisibleSettingsNavItems({
      authorization,
      isMasterAdmin,
      hasActiveOrganization: Boolean(organizationId)
    });
  }

  return (
    <AppPage wide breadcrumbs={[{ label: "Settings" }]}>
      <SettingsSubnav items={items} />
      {children}
    </AppPage>
  );
}

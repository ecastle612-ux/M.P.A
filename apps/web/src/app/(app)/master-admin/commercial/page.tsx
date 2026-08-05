import { requireMasterAdminPageAccess } from "../../../../lib/master-admin/access";
import { CommercialUniversalDashboard } from "../../../../components/master-admin/commercial-universal-dashboard";
import { formatHumanGreetingName } from "../../../../lib/format/display-labels";
import { getUserDisplayNameForGreeting } from "../../../../lib/profile/server-fetch";

/** STD-001 compliance remediation — Commercial ops on Universal Dashboard Framework. */
export default async function MasterAdminCommercialPage() {
  const { user } = await requireMasterAdminPageAccess();
  const profileDisplayName = await getUserDisplayNameForGreeting(user.id, user.email ?? null);
  const userName = formatHumanGreetingName(profileDisplayName, user.email ?? null);

  return <CommercialUniversalDashboard userName={userName} />;
}

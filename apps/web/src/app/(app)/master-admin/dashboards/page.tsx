import { PortalLauncher } from "../../../../components/master-admin/portal-launcher";

export default function MasterAdminDashboardsPage() {
  return (
    <PortalLauncher
      title="Surface Switcher"
      description="Launch every role and dashboard without signing out. Organization context stays in the shell switcher. View As opens Impersonation Center; Launch in Test Mode uses existing portal Test Mode where supported."
    />
  );
}

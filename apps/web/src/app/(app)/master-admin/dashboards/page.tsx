import { redirect } from "next/navigation";

/** NAV-001 — Surface Switcher deprecated; Mission Control is the authoritative hub. */
export default function MasterAdminDashboardsPage() {
  redirect("/master-admin#workspace-launcher");
}

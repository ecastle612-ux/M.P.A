import { redirect } from "next/navigation";
import { createAuthServerClient } from "../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../lib/auth/get-shell-context";
import { defaultHomeForSku } from "../../../lib/commercial/server";

export default async function DashboardPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const shell = await resolveAuthenticatedShellContext(user);
  const active = shell.organizations.find((organization) => organization.id === shell.defaultOrganizationId);

  if (!active?.productSku) {
    redirect("/setup");
  }
  // J0: unfinished Guided Setup always wins over Mission Control / Launcher.
  if (!active.setupComplete) {
    redirect("/setup");
  }
  redirect(defaultHomeForSku(active.productSku));
}

import { redirect } from "next/navigation";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../../lib/auth/get-shell-context";
import { defaultHomeForSku } from "../../../../lib/commercial/server";

/** P0 IA: manager portal consolidates into the commercial operating system home. */
export default async function ManagerPortalPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const shell = await resolveAuthenticatedShellContext(user);
  const active = shell.organizations.find((organization) => organization.id === shell.defaultOrganizationId);
  redirect(defaultHomeForSku(active?.productSku ?? null));
}

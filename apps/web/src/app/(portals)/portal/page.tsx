import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../lib/auth/get-shell-context";
import { toPortalPath } from "../../../lib/auth/portal-routes";

export default async function PortalIndexPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const shellContext = await resolveAuthenticatedShellContext(user);
  if (!shellContext.defaultOrganizationId) {
    redirect("/dashboard");
  }
  redirect(toPortalPath(shellContext.defaultRole));
}

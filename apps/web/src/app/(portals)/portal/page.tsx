import { redirect } from "next/navigation";
import { resolvePostAuthHome } from "@mpa/shared";
import { createAuthServerClient } from "../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../lib/auth/get-shell-context";
import { isPlatformOperatorUser } from "../../../lib/commercial/server";

export default async function PortalIndexPage() {
  const supabase = await createAuthServerClient();
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
  if (!shellContext.defaultRole) {
    redirect("/unauthorized?reason=role");
  }

  const active = shellContext.organizations.find(
    (organization) => organization.id === shellContext.defaultOrganizationId
  );
  const isPlatformOperator = await isPlatformOperatorUser(user);

  redirect(
    resolvePostAuthHome({
      roles: shellContext.availableRoles,
      productSku: active?.productSku ?? null,
      setupComplete: active?.setupComplete ?? false,
      isPlatformOperator
    })
  );
}

import { redirect } from "next/navigation";
import { resolvePostAuthHome } from "@mpa/shared";
import { createAuthServerClient } from "../../../lib/auth/server";
import { resolveAuthenticatedShellContext } from "../../../lib/auth/get-shell-context";
import { isPlatformOperatorUser } from "../../../lib/commercial/server";

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
  const isPlatformOperator = await isPlatformOperatorUser(user);

  redirect(
    resolvePostAuthHome({
      roles: shell.availableRoles,
      productSku: active?.productSku ?? null,
      setupComplete: active?.setupComplete ?? false,
      isPlatformOperator,
      storedScope: active?.operatingScope ?? null
    })
  );
}

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "../../lib/auth/server";
import { ApplicationShell } from "../../components/shell/application-shell";
import { resolveAuthenticatedShellContext } from "../../lib/auth/get-shell-context";
import { isPlatformOperatorUser } from "../../lib/commercial/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const shellContext = await resolveAuthenticatedShellContext(user);
  const isPlatformOperator = await isPlatformOperatorUser(user);

  // Membership without a recognized role must not inherit a fake Property Manager shell.
  if (shellContext.defaultOrganizationId && !shellContext.defaultRole) {
    redirect("/unauthorized?reason=role");
  }

  return (
    <ApplicationShell
      availableRoles={shellContext.availableRoles}
      defaultRole={shellContext.defaultRole ?? "property_manager"}
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      isPlatformOperator={isPlatformOperator}
    >
      {children}
    </ApplicationShell>
  );
}

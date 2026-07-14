import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "../../lib/auth/server";
import { ApplicationShell } from "../../components/shell/application-shell";
import { resolveAuthenticatedShellContext } from "../../lib/auth/get-shell-context";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const shellContext = await resolveAuthenticatedShellContext(user);

  return (
    <ApplicationShell
      availableRoles={shellContext.availableRoles}
      defaultRole={shellContext.defaultRole}
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
    >
      {children}
    </ApplicationShell>
  );
}

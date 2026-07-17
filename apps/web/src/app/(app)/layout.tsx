import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../lib/auth/server";
import { ApplicationShell } from "../../components/shell/application-shell";
import { resolveAuthenticatedShellContext } from "../../lib/auth/get-shell-context";
import { getSetupStatus } from "../../lib/setup/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [shellContext, setupStatus] = await Promise.all([
    resolveAuthenticatedShellContext(user),
    getSetupStatus(user.id, false, {
      email: user.email ?? null,
      appMetadata: user.app_metadata
    })
  ]);

  return (
    <ApplicationShell
      availableRoles={shellContext.availableRoles}
      defaultRole={shellContext.defaultRole}
      organizations={shellContext.organizations}
      defaultOrganizationId={shellContext.defaultOrganizationId}
      isSetupComplete={setupStatus.isComplete}
    >
      {children}
    </ApplicationShell>
  );
}

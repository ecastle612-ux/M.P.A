import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { USER_ROLES } from "@mpa/shared";
import { createAuthServerClient } from "../../lib/auth/server";
import { buildAuthorizationContext } from "../../lib/auth/session";
import { ApplicationShell } from "../../components/shell/application-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const context = buildAuthorizationContext(user, null);

  const availableRoles = context.roles.length ? context.roles : [USER_ROLES[0]];
  const defaultRole = context.activeRole ?? availableRoles[0];

  if (!defaultRole) {
    redirect("/login");
  }

  return (
    <ApplicationShell availableRoles={availableRoles} defaultRole={defaultRole}>
      {children}
    </ApplicationShell>
  );
}

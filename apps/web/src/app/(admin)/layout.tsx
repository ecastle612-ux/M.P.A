import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createAuthServerClient } from "../../lib/auth/server";
import { isPlatformOperatorUser } from "../../lib/commercial/server";
import { MasterAdminShell } from "../../components/admin/master-admin-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isOperator = await isPlatformOperatorUser(user);
  if (!isOperator) {
    redirect("/unauthorized");
  }

  return <MasterAdminShell operatorEmail={user.email ?? user.id}>{children}</MasterAdminShell>;
}

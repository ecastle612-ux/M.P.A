import { redirect } from "next/navigation";
import { canAccessRole, type UserRole } from "@mpa/shared";
import { createAuthServerClient } from "./server";
import { buildAuthorizationContext } from "./session";

export async function requireRole(requiredRole: UserRole | UserRole[]) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const context = buildAuthorizationContext(user, null);
  if (!canAccessRole(context, requiredRole)) {
    redirect("/dashboard");
  }

  return context;
}

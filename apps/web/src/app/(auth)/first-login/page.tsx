import { redirect } from "next/navigation";
import { AuthBrandShell } from "../../../components/branding/auth-brand-shell";
import { FirstLoginForm } from "../../../components/auth/first-login-form";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import {
  getPrincipalByAuthSubject,
  requiresFirstLoginGate
} from "../../../lib/auth/identity";

type SearchParams = Promise<{
  error?: string | string[];
}>;

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

export default async function FirstLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const principal = await getPrincipalByAuthSubject(user.id).catch(() => null);
  if (!requiresFirstLoginGate(principal)) {
    const isMasterAdmin = user.app_metadata?.["dev_master_admin"] === true;
    redirect(isMasterAdmin ? "/master-admin" : "/dashboard");
  }

  const params = await searchParams;
  const error = firstParam(params.error);

  return (
    <AuthBrandShell>
      <FirstLoginForm username={principal?.username ?? null} error={error} />
    </AuthBrandShell>
  );
}

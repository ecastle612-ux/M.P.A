import type { Metadata } from "next";
import { ModulesPage } from "../../../components/marketing/modules-page";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Choose Your Platform — M.P.A.",
  description: "Select Property Manager, Facility Operations, or Complete Platform."
};

export default async function Page() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return <ModulesPage isAuthenticated={Boolean(user)} />;
}

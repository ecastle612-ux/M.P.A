import type { Metadata } from "next";
import { ModulesPage } from "../../../components/marketing/modules-page";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Explore Platforms — M.P.A.",
  description:
    "Compare Property Manager, Facility Operations, and Complete Platform. Property Manager and Complete include online rent collection and tenant AutoPay on the Property Operations side."
};

export default async function Page() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return <ModulesPage isAuthenticated={Boolean(user)} />;
}

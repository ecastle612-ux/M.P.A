import type { Metadata } from "next";
import { EnterprisePage } from "../../../components/marketing/enterprise-page";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Enterprise Solutions — M.P.A.",
  description:
    "Optional Enterprise path for custom contracts, SSO, integrations, and dedicated onboarding."
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return <EnterprisePage isAuthenticated={Boolean(user)} selectedSkuRaw={params.intent ?? null} />;
}

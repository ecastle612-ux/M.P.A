import type { Metadata } from "next";
import { PublicLandingPage } from "../../components/marketing/public-landing-page";
import { createAuthServerClient } from "../../lib/auth/server";

export const metadata: Metadata = {
  title: "M.P.A. — Property Operations Platform",
  description:
    "Workflow-first Property Operations Platform for property managers, owners, and facility teams. Transparent unit-volume pricing. Get Started online."
};

/**
 * Public homepage. Never redirects to authentication.
 * Funnel: Choose Modules → Pricing → Confirm Plan → account creation.
 */
export default async function MarketingHomePage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <PublicLandingPage isAuthenticated={Boolean(user)} />;
}

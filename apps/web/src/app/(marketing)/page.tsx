import type { Metadata } from "next";
import { PublicLandingPage } from "../../components/marketing/public-landing-page";
import { createAuthServerClient } from "../../lib/auth/server";

export const metadata: Metadata = {
  title: "M.P.A. — My Property Assistant",
  description:
    "Property operations for portfolio managers, facility teams, residents, vendors, and owners."
};

/**
 * Public homepage. Never redirects to authentication.
 * Auth begins only when the visitor chooses Sign In, Get Started, Choose Modules, or a protected route.
 */
export default async function MarketingHomePage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <PublicLandingPage isAuthenticated={Boolean(user)} />;
}

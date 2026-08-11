import type { Metadata } from "next";
import { PublicLandingPage } from "../../components/marketing/public-landing-page";
import { createAuthServerClient } from "../../lib/auth/server";

export const metadata: Metadata = {
  title: "M.P.A. — My Property Assistant",
  description:
    "Run the whole property operation — not just rent collection. M.P.A. is a workflow-first Property Operations Platform for properties, residents, leases, billing, maintenance, vendors, and day-to-day attention."
};

/**
 * Public homepage. Never redirects to authentication.
 * Commercial flow: Landing → Choose Product → Monthly/Annual → Stripe Checkout →
 * Create Account → Guided Setup → Mission Control.
 */
export default async function MarketingHomePage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <PublicLandingPage isAuthenticated={Boolean(user)} />;
}

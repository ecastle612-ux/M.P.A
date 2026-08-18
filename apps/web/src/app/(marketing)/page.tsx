import type { Metadata } from "next";
import { PublicLandingPage } from "../../components/marketing/public-landing-page";
import { createAuthServerClient } from "../../lib/auth/server";

export const metadata: Metadata = {
  title: "M.P.A. — Property Operations Platform",
  description:
    "Property management software for property and facility operations. Collect rent online with Stripe — ACH rent payments, cards, and tenant AutoPay — plus maintenance, residents, and Mission Control."
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

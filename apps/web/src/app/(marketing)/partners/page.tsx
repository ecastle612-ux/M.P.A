import type { Metadata } from "next";
import { PARTNER_ANALYTICS_EVENTS } from "@mpa/shared";
import { PartnersPage } from "../../../components/marketing/partners-page";
import { createAuthServerClient } from "../../../lib/auth/server";
import { trackEvent } from "../../../lib/observability/analytics";

export const metadata: Metadata = {
  title: "Partner Program — M.P.A.",
  description:
    "Grow your property service business with M.P.A. You handle the physical work. M.P.A. powers the software behind it."
};

export default async function Page() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  trackEvent({
    eventName: PARTNER_ANALYTICS_EVENTS.page_viewed,
    properties: { route: "/partners" }
  });
  return <PartnersPage isAuthenticated={Boolean(user)} />;
}

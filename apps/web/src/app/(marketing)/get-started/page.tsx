import type { Metadata } from "next";
import { PARTNER_ANALYTICS_EVENTS, parsePartnerRefParam } from "@mpa/shared";
import { AcquisitionQuestionnairePage } from "../../../components/marketing/acquisition-questionnaire-page";
import { createAuthServerClient } from "../../../lib/auth/server";
import { trackEvent } from "../../../lib/observability/analytics";

export const metadata: Metadata = {
  title: "Get started — My Property Assistant",
  description:
    "Tell us how many units you manage and what you need help with. We’ll recommend a platform and show your plan before checkout."
};

type Search = {
  intent?: string;
  cycle?: string;
  units?: string;
  ref?: string;
};

export default async function GetStartedRoute({
  searchParams
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  if (parsePartnerRefParam(params.ref ?? null)) {
    trackEvent({
      eventName: PARTNER_ANALYTICS_EVENTS.referral_link_visited,
      properties: { route: "/get-started" }
    });
    trackEvent({
      eventName: PARTNER_ANALYTICS_EVENTS.referred_signup_initiated,
      properties: { route: "/get-started" }
    });
  }
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <AcquisitionQuestionnairePage
      isAuthenticated={Boolean(user)}
      initialSkuRaw={params.intent ?? null}
      initialCycleRaw={params.cycle ?? null}
      initialUnitsRaw={params.units ?? null}
    />
  );
}

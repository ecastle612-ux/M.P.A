import type { Metadata } from "next";
import { AcquisitionQuestionnairePage } from "../../../components/marketing/acquisition-questionnaire-page";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Get started — My Property Assistant",
  description:
    "Tell us how many units you manage and what you need help with. We’ll recommend a platform and show your plan before checkout."
};

type Search = {
  intent?: string;
  cycle?: string;
  units?: string;
};

export default async function GetStartedRoute({
  searchParams
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
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

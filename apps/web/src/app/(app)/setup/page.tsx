import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { getSetupStatus } from "../../../lib/setup/server";
import { SetupWizard } from "../../../components/setup/setup-wizard";

export default async function SetupPage({
  searchParams
}: {
  searchParams: Promise<{ celebrate?: string; from?: string }>;
}) {
  const { celebrate, from } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const status = await getSetupStatus(user.id, false, {
    email: user.email ?? null,
    appMetadata: user.app_metadata
  });

  // Allow a one-shot celebration screen before leaving setup.
  if (status.isComplete && celebrate !== "1") {
    redirect("/setup?celebrate=1");
  }

  return <SetupWizard initialStatus={status} celebrate={celebrate === "1"} fromBanner={from ?? null} />;
}

import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { getSetupStatus } from "../../../lib/setup/server";
import { SetupWizard } from "../../../components/setup/setup-wizard";

export default async function SetupPage() {
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

  if (status.isComplete) {
    redirect("/dashboard");
  }

  return <SetupWizard initialStatus={status} />;
}

import { redirect } from "next/navigation";
import { hasMasterAdminAppGrant } from "@mpa/shared";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { userHasMasterAdminCapability } from "../../../lib/master-admin/access";
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

  // Master Admin never uses the property-manager onboarding wizard.
  if (
    hasMasterAdminAppGrant({
      email: user.email ?? null,
      appMetadata: user.app_metadata
    }) ||
    (await userHasMasterAdminCapability(user))
  ) {
    redirect("/master-admin");
  }

  const status = await getSetupStatus(user.id, false, {
    email: user.email ?? null,
    appMetadata: user.app_metadata
  });

  if (status.isComplete) {
    redirect("/dashboard");
  }

  return <SetupWizard initialStatus={status} celebrate={celebrate === "1"} fromBanner={from ?? null} />;
}

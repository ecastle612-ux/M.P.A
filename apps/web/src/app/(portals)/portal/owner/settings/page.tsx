import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { OwnerSettingsExperience } from "../../../../../components/portal/owner-settings-experience";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { loadOwnerSettingsExperience } from "../../../../../lib/owner-portal/settings-experience";

export default async function OwnerSettingsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/owner");

  let model = null;
  let loadError: string | null = null;
  try {
    model = await loadOwnerSettingsExperience({ organizationId, user, supabase });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Settings could not be loaded.";
  }

  if (!model) {
    return (
      <AppPage
        breadcrumbs={[
          { href: "/portal/owner", label: "Owner" },
          { label: "Settings" }
        ]}
      >
        <Card variant="elevated" className="space-y-2 p-5">
          <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            Settings unavailable
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            We couldn’t load your settings right now. Retry in a moment, or contact your property manager if
            this continues.
          </p>
          {loadError ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{loadError}</p>
          ) : null}
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/owner", label: "Owner" },
        { label: "Settings" }
      ]}
    >
      <OwnerSettingsExperience model={model} />
    </AppPage>
  );
}

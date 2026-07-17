import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { MigrationWizardStarter } from "../../../../components/migration/migration-wizard-starter";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";

export default async function NewMigrationPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage wide breadcrumbs={[{ href: "/migration", label: "Migration Center" }, { label: "New migration" }]}>
        <Card>
          <h1 className="text-xl font-semibold">No active organization</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">Select an organization before starting a migration.</p>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "migration:create")) redirect("/unauthorized");

  return (
    <AppPage wide breadcrumbs={[{ href: "/migration", label: "Migration Center" }, { label: "New migration" }]}>
      <MigrationWizardStarter />
    </AppPage>
  );
}

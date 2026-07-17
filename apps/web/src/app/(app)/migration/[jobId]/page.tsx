import { redirect } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import { MigrationWizard } from "../../../../components/migration/migration-wizard";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import {
  getMigrationImportFiles,
  getMigrationJobForOrganization,
  getMigrationReviewItems
} from "../../../../lib/migration/server";

type PageProps = { params: Promise<{ jobId: string }> };

export default async function MigrationJobPage({ params }: PageProps) {
  const { jobId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/setup");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "migration:read")) redirect("/unauthorized");

  const [job, files, reviewItems] = await Promise.all([
    getMigrationJobForOrganization(organizationId, jobId, supabase),
    getMigrationImportFiles(organizationId, jobId, supabase),
    getMigrationReviewItems(organizationId, jobId, supabase)
  ]);

  if (!job) redirect("/migration");

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/migration", label: "Migration Center" },
        { label: job.name }
      ]}
    >
      <MigrationWizard
        job={job}
        initialFiles={files}
        initialReviewItems={reviewItems}
        permissions={{
          canUpdate: evaluatePermission(authorization, "migration:update"),
          canRollback: evaluatePermission(authorization, "migration:rollback"),
          canDelete: evaluatePermission(authorization, "migration:delete")
        }}
      />
    </AppPage>
  );
}

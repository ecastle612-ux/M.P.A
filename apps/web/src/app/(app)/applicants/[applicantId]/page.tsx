import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, DetailHero, DetailMetric } from "@mpa/ui";
import { DetailPageLayout } from "../../../../components/presentation/detail-page-layout";
import { ApplicantDocumentsPanel } from "../../../../components/applicant/applicant-documents-panel";
import { ApplicantStatusPanel } from "../../../../components/applicant/applicant-status-panel";
import { ApplicantTimelinePanel } from "../../../../components/applicant/applicant-timeline-panel";
import { ApplicantScreeningPanel } from "../../../../components/screening/applicant-screening-panel";
import { SignaturePackagePanel } from "../../../../components/signature/signature-package-panel";
import { WorkflowSuccessBanner } from "../../../../components/workflow/workflow-success-banner";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { toApplicantStatusLabel } from "../../../../lib/applicant/contracts";
import { getApplicantEvents, getApplicantForOrganization } from "../../../../lib/applicant/server";
import { getThreadBySourceEntity } from "../../../../lib/messaging/server";
import { getVaultDocumentsForEntity } from "../../../../lib/vault/server";
import { ApplicantMessagingPanel } from "../../../../components/messaging/applicant-messaging-panel";

export default async function ApplicantDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ applicantId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { applicantId } = await params;
  const { from } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "applicant:read")) redirect("/unauthorized");

  const applicant = await getApplicantForOrganization(organizationId, applicantId);
  if (!applicant) redirect("/applicants");

  const [events, documents, applicantThread] = await Promise.all([
    getApplicantEvents(organizationId, applicantId, supabase),
    getVaultDocumentsForEntity(organizationId, "applicant", applicantId, supabase),
    getThreadBySourceEntity(organizationId, "applicant", applicantId, supabase)
  ]);

  const canUpdate = evaluatePermission(authorization, "applicant:update");
  const canCreateDocument = evaluatePermission(authorization, "document:create");
  const canCreateScreening = evaluatePermission(authorization, "screening:create");
  const canDecideScreening = evaluatePermission(authorization, "screening:decide");
  const canReadScreening = evaluatePermission(authorization, "screening:read");
  const canCreateSignature = evaluatePermission(authorization, "signature:create");
  const canSendSignature = evaluatePermission(authorization, "signature:send");
  const canReadSignature = evaluatePermission(authorization, "signature:read");
  const displayName = applicant.preferredName || `${applicant.firstName} ${applicant.lastName}`;

  return (
    <DetailPageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/applicants", label: "Applicants" },
        { label: applicant.applicationNumber }
      ]}
      hero={
        <>
          {from === "applicant-created" ? (
            <WorkflowSuccessBanner
              dismissPath={`/applicants/${applicantId}`}
              title="Application created"
              description={`${displayName} is on the board. Submit for review when intake is complete.`}
              primaryAction={{ label: "View application", href: `/applicants/${applicantId}` }}
              recommendations={["Submit the application when intake is complete.", "Request documents before starting screening."]}
            />
          ) : null}
          <DetailHero
            title={displayName}
            subtitle={`${applicant.applicationNumber} · ${applicant.email}`}
            badges={[
              <Badge key="status">{toApplicantStatusLabel(applicant.status)}</Badge>,
              applicant.isPrimary ? <Badge key="primary">Primary applicant</Badge> : null
            ].filter(Boolean)}
            actions={
              canUpdate ? (
                <Link href={`/applicants/${applicantId}/edit`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
              ) : undefined
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailMetric label="Property" value={applicant.propertyName ?? "Unassigned"} />
            <DetailMetric label="Unit" value={applicant.unitNumber ? `Unit ${applicant.unitNumber}` : "—"} />
            <DetailMetric label="Planned move-in" value={applicant.plannedMoveInDate ?? "—"} />
            <DetailMetric label="Employer" value={applicant.profile.employment.employer ?? "—"} />
          </div>
        </>
      }
      main={
        <div className="space-y-6">
          <Card className="space-y-3">
            <h3 className="text-base font-semibold">Profile summary</h3>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt className="text-[var(--mpa-color-text-secondary)]">Phone</dt><dd>{applicant.phone ?? "—"}</dd></div>
              <div><dt className="text-[var(--mpa-color-text-secondary)]">Monthly income</dt><dd>{applicant.profile.employment.monthlyIncome ?? "—"}</dd></div>
              <div><dt className="text-[var(--mpa-color-text-secondary)]">Emergency contact</dt><dd>{applicant.profile.emergency.name ?? "—"}</dd></div>
              <div><dt className="text-[var(--mpa-color-text-secondary)]">Household members</dt><dd>{applicant.profile.householdMembers.length}</dd></div>
            </dl>
            {applicant.internalNotes ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{applicant.internalNotes}</p>
            ) : null}
          </Card>
          <ApplicantMessagingPanel applicantName={displayName} thread={applicantThread} />
          {canReadScreening ? (
            <ApplicantScreeningPanel
              applicantId={applicantId}
              canCreate={canCreateScreening}
              canDecide={canDecideScreening}
            />
          ) : null}
          {canReadSignature ? (
            <SignaturePackagePanel
              applicantId={applicantId}
              canCreate={canCreateSignature}
              canSend={canSendSignature}
            />
          ) : null}
          <ApplicantDocumentsPanel applicantId={applicantId} initialDocuments={documents} canCreate={canCreateDocument} />
          <ApplicantTimelinePanel events={events} />
        </div>
      }
      contextRail={<ApplicantStatusPanel applicant={applicant} canUpdate={canUpdate} />}
    />
  );
}

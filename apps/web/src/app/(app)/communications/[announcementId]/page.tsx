import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, DetailHero, DetailMetric } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { AnnouncementLifecyclePanel } from "../../../../components/communication/announcement-lifecycle-panel";
import { AnnouncementReadershipPanel } from "../../../../components/communication/announcement-readership-panel";
import { WorkflowSuccessBanner } from "../../../../components/workflow/workflow-success-banner";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { fetchAuthedApi } from "../../../../lib/communication/server-fetch";
import {
  announcementCategoryLabel,
  announcementPriorityLabel,
  announcementStatusLabel,
  type AnnouncementReadRecord,
  type AnnouncementRecipientRecord,
  type AnnouncementRecord
} from "../../../../lib/communication/contracts";
import { buildAnnouncementCreatedSuccess } from "../../../../lib/workflow/shared/success-configs";

type AnnouncementDetailResponse = {
  announcement: AnnouncementRecord;
  recipients?: AnnouncementRecipientRecord[];
  reads?: AnnouncementReadRecord[];
};

export default async function AnnouncementDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ announcementId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { announcementId } = await params;
  const { from } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/dashboard");
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "communication:read")) {
    redirect("/unauthorized");
  }

  const result = await fetchAuthedApi<AnnouncementDetailResponse>(`/api/announcements/${announcementId}`);
  if (!result.ok || !result.data.announcement) {
    redirect("/communications");
  }

  const { announcement, recipients = [], reads = [] } = result.data;
  const canUpdate = evaluatePermission(authorization, "communication:update");
  const canPublish = evaluatePermission(authorization, "communication:publish");
  const canArchive = evaluatePermission(authorization, "communication:archive");
  const canEdit = canUpdate && announcement.status === "draft";

  const announcementSuccess =
    from === "announcement-created"
      ? buildAnnouncementCreatedSuccess({ id: announcement.id, title: announcement.title })
      : null;

  return (
    <AppPage
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/communications", label: "Communications" },
        { label: announcement.title }
      ]}
    >
      {announcementSuccess ? (
        <WorkflowSuccessBanner dismissPath={`/communications/${announcementId}`} {...announcementSuccess} />
      ) : null}

      <DetailHero
        title={announcement.title}
        subtitle={`${announcementCategoryLabel(announcement.category)} · ${announcementPriorityLabel(announcement.priority)} priority`}
        badges={
          <>
            <Badge
              variant={
                announcement.status === "published"
                  ? "success"
                  : announcement.status === "archived"
                    ? "warning"
                    : "info"
              }
            >
              {announcementStatusLabel(announcement.status)}
            </Badge>
            {announcement.requiresAcknowledgment ? <Badge variant="warning">Ack required</Badge> : null}
            {announcement.archivedAt ? <Badge variant="warning">Archived</Badge> : null}
          </>
        }
        metrics={
          <>
            <DetailMetric label="Recipients" value={announcement.recipientCount.toString()} />
            <DetailMetric label="Read count" value={announcement.readCount.toString()} />
            <DetailMetric label="Targeting" value={announcement.targetingScope} />
            <DetailMetric
              label="Scheduled"
              value={announcement.scheduledAt ? new Date(announcement.scheduledAt).toLocaleDateString() : "—"}
            />
            <DetailMetric
              label="Published"
              value={announcement.publishedAt ? new Date(announcement.publishedAt).toLocaleDateString() : "—"}
            />
          </>
        }
        actions={
          <>
            {canEdit ? (
              <Link href={`/communications/${announcement.id}/edit`}>
                <Button>Edit Announcement</Button>
              </Link>
            ) : null}
            <Link href="/communications">
              <Button variant="ghost">Back to Communications</Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <Card variant="elevated" className="space-y-4">
          <h2 className="mpa-section-title">Message</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
            {announcement.message}
          </div>

          <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
            <p>Expires: {announcement.expiresAt ? new Date(announcement.expiresAt).toLocaleString() : "—"}</p>
          </div>
        </Card>

        <div id="lifecycle" className="space-y-5">
          <AnnouncementLifecyclePanel
            announcementId={announcement.id}
            status={announcement.status}
            scheduledAt={announcement.scheduledAt}
            canPublish={canPublish}
            canArchive={canArchive}
          />
        </div>
      </section>

      <AnnouncementReadershipPanel
        recipientCount={announcement.recipientCount}
        readCount={announcement.readCount}
        recipients={recipients}
        reads={reads}
      />
    </AppPage>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, DetailHero, DetailMetric } from "@mpa/ui";
import { DetailPageLayout } from "../../../../../components/presentation/detail-page-layout";
import { EntityRelationshipChain } from "../../../../../components/presentation/entity-relationship-chain";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { AssetLinkPanel } from "../../../../../components/facility/asset-link-panel";
import { listFacilityAssets } from "../../../../../lib/facility/asset-server";
import { getFacilityRecordForOrganization, listFacilityTimelineEvents } from "../../../../../lib/facility/server";
import { getVaultDocumentsForEntity } from "../../../../../lib/vault/server";

export default async function FacilityRecordDetailPage({
  params
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "maintenance:read")) {
    redirect("/unauthorized");
  }

  const record = await getFacilityRecordForOrganization(organizationId, recordId, supabase);
  if (!record) redirect("/maintenance");

  const [vaultDocuments, timeline, propertyAssets] = await Promise.all([
    getVaultDocumentsForEntity(organizationId, "maintenance", record.workOrderId, supabase),
    listFacilityTimelineEvents(
      organizationId,
      {
        propertyId: record.propertyId,
        ...(record.unitId ? { unitId: record.unitId } : {}),
        limit: 20
      },
      supabase
    ),
    listFacilityAssets(organizationId, { propertyId: record.propertyId, limit: 100 }, supabase)
  ]);

  const relatedTimeline = timeline.filter((event) => event.facilityRecordId === record.id);
  const photos = vaultDocuments.filter((doc) =>
    record.photoDocumentIds.includes(doc.id)
      ? true
      : doc.documentType.toLowerCase().includes("photo") ||
        doc.documentType.toLowerCase().includes("image")
  );
  const documents = vaultDocuments.filter((doc) => !photos.some((photo) => photo.id === doc.id));

  return (
    <DetailPageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: `/properties/${record.propertyId}`, label: record.propertyName ?? "Property" },
        { label: "Facility Record" }
      ]}
      relationshipChain={
        <EntityRelationshipChain
          links={[
            { href: `/properties/${record.propertyId}`, label: record.propertyName ?? "Property" },
            ...(record.unitId && record.unitNumber
              ? [{ href: `/units/${record.unitId}`, label: `Unit ${record.unitNumber}` }]
              : []),
            { href: `/maintenance/${record.workOrderId}`, label: record.workOrderNumber ?? "Work order" },
            { label: "Facility Record" }
          ]}
        />
      }
      hero={
        <DetailHero
          title={record.issue}
          subtitle="Permanent facility record · read-only"
          badges={
            <>
              <Badge variant={record.status === "active" ? "success" : "warning"}>
                {record.status === "active" ? "Active" : "Superseded"}
              </Badge>
              <Badge variant="neutral">{record.lifecycleStatus}</Badge>
            </>
          }
          metrics={
            <>
              <DetailMetric
                label="Completed"
                value={new Date(record.completedAt).toLocaleDateString()}
              />
              <DetailMetric label="Property" value={record.propertyName ?? "—"} />
              <DetailMetric
                label="Unit"
                value={record.unitNumber ? `Unit ${record.unitNumber}` : "Property-wide"}
              />
              <DetailMetric
                label="Service provider"
                value={record.serviceProviderDisplayName ?? "Unassigned"}
              />
              <DetailMetric label="Record ID" value={record.id.slice(0, 8)} />
            </>
          }
          actions={
            <>
              <Link href={`/maintenance/${record.workOrderId}`}>
                <Button>Open work order</Button>
              </Link>
              <Link href={`/properties/${record.propertyId}#property-timeline`}>
                <Button variant="ghost">Property history</Button>
              </Link>
            </>
          }
        />
      }
      contextRail={null}
      main={
        <>
          <Card variant="elevated" className="space-y-4">
            <h2 className="mpa-section-title">Repair outcome</h2>
            <div className="space-y-3 text-sm text-[var(--mpa-color-text-secondary)]">
              <p>
                <span className="font-medium text-[var(--mpa-color-text-primary)]">Issue:</span>{" "}
                {record.issue}
              </p>
              <p>
                <span className="font-medium text-[var(--mpa-color-text-primary)]">Resolution:</span>{" "}
                {record.resolution || "—"}
              </p>
              <p>
                <span className="font-medium text-[var(--mpa-color-text-primary)]">Warranty:</span>{" "}
                {record.warrantyPlaceholder || "Not recorded"}
              </p>
              <p>
                <span className="font-medium text-[var(--mpa-color-text-primary)]">Invoice:</span>{" "}
                {record.invoicePlaceholder || "Not recorded"}
              </p>
              <p>
                <span className="font-medium text-[var(--mpa-color-text-primary)]">Created:</span>{" "}
                {new Date(record.createdAt).toLocaleString()}
              </p>
              {record.correctionReason ? (
                <p>
                  <span className="font-medium text-[var(--mpa-color-text-primary)]">
                    Correction reason:
                  </span>{" "}
                  {record.correctionReason}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-[var(--mpa-color-text-muted)]">
              Facility records are permanent. Normal users cannot edit. Administrative corrections are
              audited and never delete prior history.
            </p>
          </Card>

          <AssetLinkPanel
            recordId={record.id}
            currentAssetId={record.assetId}
            currentAssetLabel={
              record.assetId && record.assetCode
                ? `${record.assetCode}${record.assetName ? ` · ${record.assetName}` : ""}`
                : null
            }
            assets={propertyAssets}
            canLink={evaluatePermission(authorization, "maintenance:update")}
          />

          <Card variant="elevated" className="space-y-3">
            <h2 className="mpa-section-title">Photos & documents</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              References Document Vault media on the linked work order — storage is not duplicated.
            </p>
            {photos.length === 0 && documents.length === 0 ? (
              <p className="text-sm text-[var(--mpa-color-text-muted)]">No vault media linked yet.</p>
            ) : (
              <ul className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
                {photos.map((doc) => (
                  <li key={doc.id}>
                    Photo · {doc.title}
                    {doc.fileUrl ? (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={doc.fileUrl}
                          className="font-medium text-[var(--mpa-color-brand-primary)]"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
                {documents.map((doc) => (
                  <li key={doc.id}>
                    Document · {doc.title}
                    {doc.fileUrl ? (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={doc.fileUrl}
                          className="font-medium text-[var(--mpa-color-brand-primary)]"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card variant="elevated" className="space-y-3">
            <h2 className="mpa-section-title">Timeline references</h2>
            {relatedTimeline.length === 0 ? (
              <p className="text-sm text-[var(--mpa-color-text-muted)]">No timeline events for this record.</p>
            ) : (
              <ul className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
                {relatedTimeline.map((event) => (
                  <li key={event.id}>
                    <span className="font-medium text-[var(--mpa-color-text-primary)]">{event.title}</span>
                    {" · "}
                    {new Date(event.occurredAt).toLocaleString()}
                    <br />
                    {event.summary}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      }
    />
  );
}

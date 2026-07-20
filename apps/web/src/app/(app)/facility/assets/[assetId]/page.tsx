import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, DetailHero, DetailMetric } from "@mpa/ui";
import { DetailPageLayout } from "../../../../../components/presentation/detail-page-layout";
import { EntityRelationshipChain } from "../../../../../components/presentation/entity-relationship-chain";
import { RepairHistoryPanel } from "../../../../../components/facility/repair-history-panel";
import { PropertyTimeline } from "../../../../../components/facility/property-timeline";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getFacilityAssetForOrganization } from "../../../../../lib/facility/asset-server";
import {
  formatAssetStatusLabel,
  formatAssetTypeLabel,
  formatLocationScopeLabel
} from "../../../../../lib/facility/asset-contracts";
import { listFacilityRecords } from "../../../../../lib/facility/server";
import { listFacilityTimelineEvents } from "../../../../../lib/facility/timeline";
import { getVaultDocumentsForEntity } from "../../../../../lib/vault/server";
import { FutureReleaseNotice } from "../../../../../components/experience/future-release-notice";

export default async function FacilityAssetProfilePage({
  params
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
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

  const asset = await getFacilityAssetForOrganization(organizationId, assetId, supabase);
  if (!asset) redirect("/properties");

  const [repairs, propertyTimeline, vaultDocuments] = await Promise.all([
    listFacilityRecords(organizationId, { assetId, limit: 50 }, supabase),
    listFacilityTimelineEvents(
      organizationId,
      {
        propertyId: asset.propertyId,
        ...(asset.unitId ? { unitId: asset.unitId, includePropertyWide: true } : {}),
        limit: 80
      },
      supabase
    ),
    getVaultDocumentsForEntity(organizationId, "asset", assetId, supabase)
  ]);

  const repairIds = new Set(repairs.map((repair) => repair.id));
  const timeline = propertyTimeline.filter(
    (event) =>
      event.assetId === assetId ||
      event.sourceEntityId === assetId ||
      (event.facilityRecordId ? repairIds.has(event.facilityRecordId) : false) ||
      (event.payload["assetId"] as string | undefined) === assetId
  );

  const photos = vaultDocuments.filter((doc) => {
    const type = doc.documentType.toLowerCase();
    return type.includes("photo") || type.includes("image") || type.includes("media");
  });
  const documents = vaultDocuments.filter((doc) => !photos.some((photo) => photo.id === doc.id));

  return (
    <DetailPageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: `/properties/${asset.propertyId}`, label: asset.propertyName ?? "Property" },
        { href: `/properties/${asset.propertyId}#assets`, label: "Assets" },
        { label: asset.assetCode }
      ]}
      relationshipChain={
        <EntityRelationshipChain
          links={[
            { href: `/properties/${asset.propertyId}`, label: asset.propertyName ?? "Property" },
            ...(asset.unitId && asset.unitNumber
              ? [{ href: `/units/${asset.unitId}`, label: `Unit ${asset.unitNumber}` }]
              : [{ label: formatLocationScopeLabel(asset.locationScope) }]),
            { label: asset.assetCode }
          ]}
        />
      }
      hero={
        <DetailHero
          title={`${asset.assetCode} · ${asset.name}`}
          subtitle="Asset profile · read-only registry identity"
          badges={
            <>
              <Badge>{formatAssetTypeLabel(asset.assetType, asset.customTypeLabel)}</Badge>
              <Badge>{formatAssetStatusLabel(asset.status)}</Badge>
            </>
          }
          actions={
            <Link href={`/properties/${asset.propertyId}#assets`}>
              <Button type="button" variant="secondary">
                Back to property assets
              </Button>
            </Link>
          }
          metrics={
            <>
              <DetailMetric label="Repairs" value={String(asset.repairCount)} />
              <DetailMetric
                label="Last repair"
                value={asset.lastRepairAt ? new Date(asset.lastRepairAt).toLocaleDateString() : "—"}
              />
              <DetailMetric
                label="Install date"
                value={asset.installDate ? new Date(asset.installDate).toLocaleDateString() : "—"}
              />
              <DetailMetric
                label="Expected life"
                value={asset.expectedLifeYears != null ? `${asset.expectedLifeYears} yrs` : "—"}
              />
            </>
          }
        />
      }
      contextRail={null}
      main={
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <h2 className="text-base font-semibold">Overview</h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--mpa-color-text-tertiary)]">Manufacturer</dt>
                  <dd>{asset.manufacturer || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-tertiary)]">Model</dt>
                  <dd>{asset.model || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-tertiary)]">Serial number</dt>
                  <dd>{asset.serialNumber || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-tertiary)]">Location</dt>
                  <dd>
                    {asset.unitNumber
                      ? `Unit ${asset.unitNumber}`
                      : formatLocationScopeLabel(asset.locationScope)}
                    {asset.locationNote ? ` · ${asset.locationNote}` : ""}
                  </dd>
                </div>
              </dl>
              {asset.notes ? (
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">{asset.notes}</p>
              ) : null}
            </Card>

            <Card className="space-y-3">
              <h2 className="text-base font-semibold">Warranty</h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                {asset.warrantyPlaceholder?.trim() ||
                  "No warranty notes on file for this asset yet."}
              </p>
            </Card>
          </div>

          <div id="repair-history">
            <RepairHistoryPanel
              title="Repair history"
              description="Facility Records linked to this asset. History is never duplicated — the same permanent records appear here."
              records={repairs}
              emptyLabel="No facility records linked to this asset yet. Link completed repairs from the Facility Record detail."
              showUnit
            />
          </div>

          <div id="asset-timeline">
            <PropertyTimeline
              events={timeline}
              propertyName={asset.propertyName}
              emptyLabel="No timeline events for this asset yet."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <h2 className="text-base font-semibold">Documents</h2>
              {documents.length === 0 ? (
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                  No vault documents attached. Document Vault references appear here when linked to this asset.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {documents.map((doc) => (
                    <li key={doc.id} className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2">
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {doc.documentType.replaceAll("_", " ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="space-y-3">
              <h2 className="text-base font-semibold">Photos</h2>
              {photos.length === 0 ? (
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">No photos on file for this asset.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {photos.map((doc) => (
                    <li key={doc.id} className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2">
                      <p className="font-medium">{doc.title}</p>
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[var(--mpa-color-brand-primary)]"
                        >
                          Open
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <FutureReleaseNotice
            title="Preventive planning"
            description="Scheduled preventive maintenance and replacement planning for this asset are not enabled yet. Repair history and the property timeline remain the source of truth today."
            primaryHref={`/properties/${asset.propertyId}#assets`}
            primaryLabel="Back to property assets"
          />
        </>
      }
    />
  );
}

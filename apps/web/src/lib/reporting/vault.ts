import type { User } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { createServiceRoleServerClient } from "../auth/server";
import { MEDIA_PRIVATE_BUCKET } from "../media/constants";
import { mediaBucket } from "../media/paths";
import {
  createVaultDocument,
  getVaultDocumentsForEntity
} from "../vault/server";
import {
  FINANCIAL_REPORT_DOCUMENT_TYPE,
  type RecognitionBasis,
  type ReportType,
  type ReportVersionSummary,
  reportTypeTitle
} from "./contracts";

function requireServiceClient() {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Service role client is not configured");
  return client;
}

export async function listReportVersions(input: {
  organizationId: string;
  propertyId: string;
  reportType?: ReportType;
  year?: number;
  month?: number;
}): Promise<ReportVersionSummary[]> {
  const docs = await getVaultDocumentsForEntity(input.organizationId, "property", input.propertyId);
  return docs
    .filter((doc) => doc.documentType === FINANCIAL_REPORT_DOCUMENT_TYPE)
    .map(toVersionSummary)
    .filter((version) => {
      if (input.reportType && version.reportType !== input.reportType) return false;
      if (input.year !== undefined && version.year !== input.year) return false;
      if (input.month !== undefined && version.month !== input.month) return false;
      return true;
    })
    .sort((a, b) => b.version - a.version || b.generatedAt.localeCompare(a.generatedAt));
}

export async function getReportVersion(
  organizationId: string,
  propertyId: string,
  documentId: string
): Promise<ReportVersionSummary | null> {
  const versions = await listReportVersions({ organizationId, propertyId });
  return versions.find((version) => version.id === documentId) ?? null;
}

export async function findCachedReportVersion(input: {
  organizationId: string;
  propertyId: string;
  reportType: ReportType;
  year: number;
  month: number;
  recognitionBasis: RecognitionBasis;
  sourceFingerprint: string;
}): Promise<ReportVersionSummary | null> {
  const versions = await listReportVersions({
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    reportType: input.reportType,
    year: input.year,
    month: input.month
  });
  return (
    versions.find(
      (version) =>
        version.recognitionBasis === input.recognitionBasis &&
        version.sourceFingerprint === input.sourceFingerprint
    ) ?? null
  );
}

export async function nextReportVersionNumber(input: {
  organizationId: string;
  propertyId: string;
  reportType: ReportType;
  year: number;
  month: number;
}): Promise<number> {
  const versions = await listReportVersions(input);
  const max = versions.reduce((current, version) => Math.max(current, version.version), 0);
  return max + 1;
}

export async function persistReportPdf(input: {
  user: User;
  organizationId: string;
  propertyId: string;
  reportType: ReportType;
  year: number;
  month: number;
  recognitionBasis: RecognitionBasis;
  sourceFingerprint: string;
  contentHash: string;
  pageCount: number;
  pdfBytes: Uint8Array;
  periodLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: any;
}): Promise<ReportVersionSummary> {
  const version = await nextReportVersionNumber({
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    reportType: input.reportType,
    year: input.year,
    month: input.month
  });

  const mediaAssetId = await storePdfMediaAsset({
    user: input.user,
    organizationId: input.organizationId,
    propertyId: input.propertyId,
    reportType: input.reportType,
    year: input.year,
    month: input.month,
    version,
    contentHash: input.contentHash,
    pdfBytes: input.pdfBytes
  });

  const title = `${reportTypeTitle(input.reportType)} · ${input.periodLabel} · v${version}`;
  const downloadPath = `/api/reporting/versions/PLACEHOLDER/download?propertyId=${input.propertyId}`;

  const doc = await createVaultDocument(
    input.organizationId,
    input.user.id,
    {
      entityType: "property",
      entityId: input.propertyId,
      documentType: FINANCIAL_REPORT_DOCUMENT_TYPE,
      title,
      fileUrl: null,
      notes: `Financial Reports / ${input.year} / ${String(input.month).padStart(2, "0")}`,
      metadata: {
        category: "financial_reports",
        reportType: input.reportType,
        year: input.year,
        month: input.month,
        version,
        recognitionBasis: input.recognitionBasis,
        sourceFingerprint: input.sourceFingerprint,
        contentHash: input.contentHash,
        mediaAssetId,
        pageCount: input.pageCount,
        generatedAt: new Date().toISOString(),
        folderPath: `Documents/Properties/Financial Reports/${input.year}/${String(input.month).padStart(2, "0")}`,
        downloadPath
      }
    },
    input.client
  );

  const resolvedDownloadPath = `/api/reporting/versions/${doc.id}/download?propertyId=${input.propertyId}`;
  const { updateVaultDocument } = await import("../vault/server");
  await updateVaultDocument(
    input.organizationId,
    doc.id,
    input.user.id,
    {
      metadata: {
        ...doc.metadata,
        downloadPath: resolvedDownloadPath
      }
    },
    input.client
  );

  return {
    id: doc.id,
    reportType: input.reportType,
    propertyId: input.propertyId,
    year: input.year,
    month: input.month,
    version,
    recognitionBasis: input.recognitionBasis,
    sourceFingerprint: input.sourceFingerprint,
    generatedAt: doc.createdAt,
    title,
    mediaAssetId,
    downloadPath: resolvedDownloadPath
  };
}

export async function getReportPdfBytes(input: {
  organizationId: string;
  propertyId: string;
  documentId: string;
}): Promise<{ bytes: Uint8Array; filename: string } | null> {
  const version = await getReportVersion(input.organizationId, input.propertyId, input.documentId);
  if (!version?.mediaAssetId) return null;

  const supabase = requireServiceClient();
  const { data: asset, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", version.mediaAssetId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (error || !asset || asset.deleted_at) return null;

  const { data, error: downloadError } = await supabase.storage
    .from(asset.storage_bucket)
    .download(asset.storage_path);
  if (downloadError || !data) return null;

  const buffer = Buffer.from(await data.arrayBuffer());
  const filename = `${version.reportType}_${version.year}-${String(version.month).padStart(2, "0")}_v${version.version}.pdf`;
  return { bytes: buffer, filename };
}

async function storePdfMediaAsset(input: {
  user: User;
  organizationId: string;
  propertyId: string;
  reportType: ReportType;
  year: number;
  month: number;
  version: number;
  contentHash: string;
  pdfBytes: Uint8Array;
}): Promise<string> {
  const supabase = requireServiceClient();
  const assetId = crypto.randomUUID();
  const storagePath = [
    input.organizationId,
    "document",
    "property",
    input.propertyId,
    "financial-reports",
    String(input.year),
    String(input.month).padStart(2, "0"),
    input.reportType,
    `v${input.version}-${input.contentHash.slice(0, 12)}.pdf`
  ].join("/");

  const { error: uploadError } = await supabase.storage.from(mediaBucket()).upload(storagePath, input.pdfBytes, {
    contentType: "application/pdf",
    upsert: false
  });
  if (uploadError) {
    throw new Error(`VAULT_FAILED: ${uploadError.message}`);
  }

  const { error: insertError } = await supabase.from("media_assets").insert({
    id: assetId,
    organization_id: input.organizationId,
    owner_user_id: input.user.id,
    plane: "organization",
    kind: "document",
    entity_type: "property",
    entity_id: input.propertyId,
    status: "ready",
    mime_type: "application/pdf",
    byte_size: input.pdfBytes.byteLength,
    content_hash: input.contentHash,
    storage_bucket: MEDIA_PRIVATE_BUCKET,
    storage_path: storagePath,
    original_filename: `${input.reportType}_v${input.version}.pdf`,
    version: 1,
    metadata: {
      reportType: input.reportType,
      year: input.year,
      month: input.month,
      reportVersion: input.version
    }
  });

  if (insertError) {
    throw new Error(`VAULT_FAILED: ${insertError.message}`);
  }

  await supabase.from("media_asset_variants").upsert(
    {
      media_asset_id: assetId,
      variant: "original",
      storage_path: storagePath,
      mime_type: "application/pdf",
      byte_size: input.pdfBytes.byteLength
    },
    { onConflict: "media_asset_id,variant" }
  );

  return assetId;
}

function toVersionSummary(doc: {
  id: string;
  entityId: string;
  title: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}): ReportVersionSummary {
  const meta = doc.metadata;
  const reportType = (meta["reportType"] as ReportType) ?? "owner_statement";
  const year = Number(meta["year"] ?? 0);
  const month = Number(meta["month"] ?? 0);
  const version = Number(meta["version"] ?? 1);
  const recognitionBasis = (meta["recognitionBasis"] as RecognitionBasis) ?? "cash";
  const sourceFingerprint = String(meta["sourceFingerprint"] ?? "");
  const mediaAssetId = typeof meta["mediaAssetId"] === "string" ? meta["mediaAssetId"] : null;
  const downloadPath =
    typeof meta["downloadPath"] === "string"
      ? meta["downloadPath"]
      : `/api/reporting/versions/${doc.id}/download?propertyId=${doc.entityId}`;

  return {
    id: doc.id,
    reportType,
    propertyId: doc.entityId,
    year,
    month,
    version,
    recognitionBasis,
    sourceFingerprint,
    generatedAt: typeof meta["generatedAt"] === "string" ? meta["generatedAt"] : doc.createdAt,
    title: doc.title,
    mediaAssetId,
    downloadPath
  };
}

export function fingerprintCacheKey(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

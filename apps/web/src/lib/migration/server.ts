import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import { createApplicant } from "../applicant/server";
import { defaultApplicantProfile } from "../applicant/contracts";
import { notify } from "../notifications/service";
import { createProperty } from "../property/server";
import { createTenant } from "../tenant/server";
import { createUnit } from "../unit/server";
import { createVendor } from "../vendor/server";
import { createLease } from "../lease/server";
import { createVaultDocument } from "../vault/server";
import type {
  ColumnMap,
  CreateMigrationJobInput,
  MigrationActivityRecord,
  MigrationEntityType,
  MigrationImportFileRecord,
  MigrationJobRecord,
  MigrationReviewItemRecord,
  MigrationReviewResolution,
  MigrationSourceSoftware,
  MigrationWizardStep,
  ParsedImportFile,
  UpdateMigrationJobInput
} from "./contracts";
import { detectFileType, nextWizardStep } from "./contracts";
import { parseCsvContent } from "./importers/csv";
import { parseXlsxBuffer } from "./importers/xlsx";
import { mergeParsedFiles, parseZipBuffer } from "./importers/zip";
import { applyColumnMapping, buildDuplicateKey, detectColumnMapping, findDuplicateIndices } from "./mapping";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

type JobRow = Database["public"]["Tables"]["migration_jobs"]["Row"];
type ImportFileRow = Database["public"]["Tables"]["migration_import_files"]["Row"];
type ReviewRow = Database["public"]["Tables"]["migration_review_items"]["Row"];
type ActivityRow = Database["public"]["Tables"]["migration_activity"]["Row"];

export type MigrationDashboardMetrics = {
  activeJobs: number;
  completedJobs: number;
  pendingReview: number;
  recentErrors: number;
  averageCompletionPct: number;
  recentImports: Array<{
    id: string;
    jobNumber: string;
    name: string;
    status: string;
    completionPct: number;
    href: string;
  }>;
  pendingReviewSample: Array<{
    id: string;
    jobId: string;
    title: string;
    itemType: string;
    href: string;
  }>;
  recentActivity: Array<{
    id: string;
    jobId: string;
    jobNumber: string;
    summary: string;
    eventType: string;
    createdAt: string;
    href: string;
  }>;
};

export type MigrationPreviewResult = {
  entityType: MigrationEntityType;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  sampleRows: Array<Record<string, string>>;
};

const JOB_SELECT =
  "id, organization_id, job_number, name, status, source_software, current_step, progress_total, progress_imported, progress_errors, progress_warnings, completion_pct, checkpoint_id, summary, metadata, started_at, completed_at, rolled_back_at, created_at, updated_at, deleted_at";

export async function getMigrationJobsForOrganization(
  organizationId: string,
  client?: SupabaseClientType
): Promise<MigrationJobRecord[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("migration_jobs")
    .select(JOB_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as JobRow[]).map(toMigrationJobRecord);
}

export async function getMigrationJobForOrganization(
  organizationId: string,
  jobId: string,
  client?: SupabaseClientType
): Promise<MigrationJobRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("migration_jobs")
    .select(JOB_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", jobId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toMigrationJobRecord(data as JobRow) : null;
}

export async function createMigrationJob(
  organizationId: string,
  userId: string,
  input: CreateMigrationJobInput,
  client?: SupabaseClientType
): Promise<MigrationJobRecord> {
  const supabase = await resolveClient(client);
  const jobNumber = await nextJobNumber(organizationId, supabase);

  const { data, error } = await supabase
    .from("migration_jobs")
    .insert({
      organization_id: organizationId,
      job_number: jobNumber,
      name: input.name,
      source_software: input.sourceSoftware ?? "custom",
      status: input.sourceSoftware && input.sourceSoftware !== "custom" ? "source_selected" : "draft",
      current_step: input.sourceSoftware && input.sourceSoftware !== "custom" ? "upload" : "select_software",
      created_by: userId,
      updated_by: userId
    })
    .select(JOB_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Migration job creation failed");
  const job = toMigrationJobRecord(data as JobRow);
  await recordMigrationActivity(organizationId, job.id, userId, "job_created", `Created migration job ${job.jobNumber}`, {}, supabase);
  return job;
}

export async function updateMigrationJob(
  organizationId: string,
  jobId: string,
  userId: string,
  updates: UpdateMigrationJobInput,
  client?: SupabaseClientType
): Promise<MigrationJobRecord | null> {
  const supabase = await resolveClient(client);
  const existing = await getMigrationJobForOrganization(organizationId, jobId, supabase);
  if (!existing) return null;

  const patch: Database["public"]["Tables"]["migration_jobs"]["Update"] = {
    updated_by: userId
  };

  if (updates.name) patch.name = updates.name;
  if (updates.sourceSoftware) {
    patch.source_software = updates.sourceSoftware;
    patch.status = "source_selected";
    if (existing.currentStep === "select_software") patch.current_step = "upload";
  }
  if (updates.currentStep) patch.current_step = updates.currentStep;
  if (updates.status) patch.status = updates.status;

  if (updates.columnMaps) {
    const metadata = { ...existing.metadata, columnMaps: updates.columnMaps };
    patch.metadata = metadata as Json;
    patch.status = "mapped";
    patch.current_step = "preview";
  }

  const { data, error } = await supabase
    .from("migration_jobs")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", jobId)
    .is("deleted_at", null)
    .select(JOB_SELECT)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  if (updates.sourceSoftware) {
    await recordMigrationActivity(
      organizationId,
      jobId,
      userId,
      "source_selected",
      `Selected ${updates.sourceSoftware} as source software`,
      { sourceSoftware: updates.sourceSoftware },
      supabase
    );
  }
  if (updates.columnMaps) {
    await recordMigrationActivity(organizationId, jobId, userId, "mapping_saved", "Saved column mappings", {}, supabase);
  }

  return toMigrationJobRecord(data as JobRow);
}

export async function getMigrationImportFiles(
  organizationId: string,
  jobId: string,
  client?: SupabaseClientType
): Promise<MigrationImportFileRecord[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("migration_import_files")
    .select(
      "id, organization_id, job_id, file_type, original_filename, storage_path, entity_type, row_count, column_headers, parse_status, metadata, created_at"
    )
    .eq("organization_id", organizationId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ImportFileRow[]).map(toImportFileRecord);
}

export async function uploadMigrationFile(
  organizationId: string,
  jobId: string,
  userId: string,
  file: File,
  entityType: MigrationEntityType | null,
  client?: SupabaseClientType
): Promise<MigrationImportFileRecord> {
  const supabase = await resolveClient(client);
  const job = await getMigrationJobForOrganization(organizationId, jobId, supabase);
  if (!job) throw new Error("Migration job not found");

  const fileType = detectFileType(file.name, file.type);
  if (!fileType) throw new Error("Unsupported file type. Upload CSV, Excel, or ZIP exports.");

  const buffer = await file.arrayBuffer();
  const parsedFiles = await parseUploadedBuffer(buffer, fileType, file.name);
  const merged = mergeParsedFiles(parsedFiles);
  const detection = entityType
    ? detectColumnMapping(merged.headers, entityType, job.sourceSoftware)
    : null;

  const metadata: Record<string, unknown> = {
    originalPath: file.name,
    parsedRows: merged.rows,
    detectedMapping: detection?.columnMap ?? null
  };

  const { data, error } = await supabase
    .from("migration_import_files")
    .insert({
      organization_id: organizationId,
      job_id: jobId,
      file_type: fileType,
      original_filename: file.name,
      storage_path: file.name,
      entity_type: entityType,
      row_count: merged.rows.length,
      column_headers: merged.headers as unknown as Json,
      parse_status: merged.rows.length > 0 ? "parsed" : "failed",
      metadata: metadata as Json,
      created_by: userId
    })
    .select(
      "id, organization_id, job_id, file_type, original_filename, storage_path, entity_type, row_count, column_headers, parse_status, metadata, created_at"
    )
    .single();

  if (error || !data) throw new Error(error?.message ?? "File upload failed");

  await supabase
    .from("migration_jobs")
    .update({
      status: "files_uploaded",
      current_step: "map_columns",
      progress_total: (job.progressTotal ?? 0) + merged.rows.length,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", jobId);

  await recordMigrationActivity(
    organizationId,
    jobId,
    userId,
    "file_uploaded",
    `Uploaded ${file.name} (${merged.rows.length} rows)`,
    { filename: file.name, rowCount: merged.rows.length, entityType },
    supabase
  );

  return toImportFileRecord(data as ImportFileRow);
}

export async function previewMigrationImport(
  organizationId: string,
  jobId: string,
  client?: SupabaseClientType
): Promise<MigrationPreviewResult[]> {
  const supabase = await resolveClient(client);
  const job = await getMigrationJobForOrganization(organizationId, jobId, supabase);
  if (!job) throw new Error("Migration job not found");

  const files = await getMigrationImportFiles(organizationId, jobId, supabase);
  const columnMaps = (job.metadata["columnMaps"] as Partial<Record<MigrationEntityType, ColumnMap>> | undefined) ?? {};
  const previews: MigrationPreviewResult[] = [];

  for (const file of files) {
    if (!file.entityType) continue;
    const rows = extractParsedRows(file);
    const columnMap =
      columnMaps[file.entityType] ??
      detectColumnMapping(file.columnHeaders, file.entityType, job.sourceSoftware).columnMap;
    const mappedRows = rows.map((row) => applyColumnMapping(row, columnMap));
    const duplicateIndices = new Set(findDuplicateIndices(mappedRows, file.entityType));

    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;

    mappedRows.forEach((row, index) => {
      const validation = validateMappedRow(file.entityType!, row);
      if (!validation.valid) errorRows += 1;
      else if (duplicateIndices.has(index)) warningRows += 1;
      else validRows += 1;
    });

    previews.push({
      entityType: file.entityType,
      totalRows: mappedRows.length,
      validRows,
      warningRows,
      errorRows,
      sampleRows: mappedRows.slice(0, 5)
    });
  }

  await supabase
    .from("migration_jobs")
    .update({ status: "preview_ready", current_step: "preview" })
    .eq("organization_id", organizationId)
    .eq("id", jobId);

  return previews;
}

export async function runMigrationImport(
  organizationId: string,
  jobId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<MigrationJobRecord> {
  const supabase = await resolveClient(client);
  const job = await getMigrationJobForOrganization(organizationId, jobId, supabase);
  if (!job) throw new Error("Migration job not found");

  await supabase
    .from("migration_jobs")
    .update({
      status: "importing",
      current_step: "import",
      started_at: job.startedAt ?? new Date().toISOString(),
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", jobId);

  await recordMigrationActivity(organizationId, jobId, userId, "import_started", "Import started", {}, supabase);

  const files = await getMigrationImportFiles(organizationId, jobId, supabase);
  const columnMaps = (job.metadata["columnMaps"] as Partial<Record<MigrationEntityType, ColumnMap>> | undefined) ?? {};
  const propertyIdByKey = new Map<string, string>();
  const unitIdByKey = new Map<string, string>();
  const tenantIdByEmail = new Map<string, string>();

  let imported = 0;
  let errors = 0;
  let warnings = 0;

  for (const file of files) {
    if (!file.entityType) continue;
    const rows = extractParsedRows(file);
    const columnMap =
      columnMaps[file.entityType] ??
      detectColumnMapping(file.columnHeaders, file.entityType, job.sourceSoftware).columnMap;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const mapped = applyColumnMapping(rows[rowIndex]!, columnMap);
      try {
        const result = await importMappedRow({
          organizationId,
          jobId,
          userId,
          entityType: file.entityType,
          mapped,
          importFileId: file.id,
          rowIndex,
          propertyIdByKey,
          unitIdByKey,
          tenantIdByEmail,
          client: supabase
        });
        if (result.status === "imported") imported += 1;
        if (result.status === "warning") warnings += 1;
        if (result.status === "review") warnings += 1;
      } catch {
        errors += 1;
      }
    }
  }

  const total = job.progressTotal || imported + errors + warnings;
  const completionPct = total === 0 ? 0 : Math.round((imported / total) * 10000) / 100;

  const { data, error } = await supabase
    .from("migration_jobs")
    .update({
      status: errors > 0 && imported === 0 ? "failed" : "completed",
      current_step: warnings > 0 ? "review_exceptions" : "results",
      progress_imported: imported,
      progress_errors: errors,
      progress_warnings: warnings,
      completion_pct: completionPct,
      completed_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", jobId)
    .select(JOB_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Import failed");

  await recordMigrationActivity(
    organizationId,
    jobId,
    userId,
    errors > 0 && imported === 0 ? "import_failed" : "import_completed",
    `Import finished — ${imported} imported, ${warnings} warnings, ${errors} errors`,
    { imported, warnings, errors, completionPct },
    supabase
  );

  const jobRecord = toMigrationJobRecord(data as JobRow);
  const failed = errors > 0 && imported === 0;
  await notify(
    {
      organizationId,
      actorUserId: userId,
      eventKey: failed ? `migration.failed:${jobId}` : `migration.completed:${jobId}`,
      recipientUserIds: [userId],
      category: "system",
      priority: failed ? "high" : "normal",
      title: failed ? "Migration import failed" : "Migration import completed",
      body: `${jobRecord.name}: ${imported} imported, ${warnings} warnings, ${errors} errors`,
      href: `/migration/${jobId}`,
      sourceEntityType: "migration_job",
      sourceEntityId: jobId
    },
    supabase
  ).catch(() => undefined);

  return jobRecord;
}

export async function getMigrationReviewItems(
  organizationId: string,
  jobId: string,
  client?: SupabaseClientType
): Promise<MigrationReviewItemRecord[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("migration_review_items")
    .select(
      "id, organization_id, job_id, item_type, status, title, description, source_row, candidate_records, resolution, resolved_by, resolved_at, created_at"
    )
    .eq("organization_id", organizationId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ReviewRow[]).map(toReviewItemRecord);
}

export async function resolveMigrationReviewItem(
  organizationId: string,
  jobId: string,
  reviewItemId: string,
  userId: string,
  resolution: MigrationReviewResolution,
  payload: Record<string, unknown>,
  client?: SupabaseClientType
): Promise<MigrationReviewItemRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("migration_review_items")
    .update({
      status: resolution,
      resolution: payload as Json,
      resolved_by: userId,
      resolved_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("job_id", jobId)
    .eq("id", reviewItemId)
    .select(
      "id, organization_id, job_id, item_type, status, title, description, source_row, candidate_records, resolution, resolved_by, resolved_at, created_at"
    )
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) {
    await recordMigrationActivity(
      organizationId,
      jobId,
      userId,
      "review_item_resolved",
      `Resolved review item (${resolution})`,
      { reviewItemId, resolution },
      supabase
    );
  }
  return data ? toReviewItemRecord(data as ReviewRow) : null;
}

export async function rollbackMigrationJob(
  organizationId: string,
  jobId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<MigrationJobRecord> {
  const supabase = await resolveClient(client);
  await recordMigrationActivity(organizationId, jobId, userId, "rollback_started", "Rollback started", {}, supabase);

  const { data: links, error: linksError } = await supabase
    .from("migration_record_links")
    .select("id, entity_type, entity_id")
    .eq("organization_id", organizationId)
    .eq("job_id", jobId)
    .is("rolled_back_at", null);

  if (linksError) throw new Error(linksError.message);

  for (const link of links ?? []) {
    const deletedAt = new Date().toISOString();
    const patch = { deleted_at: deletedAt, deleted_by: userId };

    switch (link.entity_type) {
      case "property":
        await supabase.from("properties").update(patch).eq("organization_id", organizationId).eq("id", link.entity_id);
        break;
      case "unit":
        await supabase.from("units").update(patch).eq("organization_id", organizationId).eq("id", link.entity_id);
        break;
      case "tenant":
        await supabase.from("tenants").update(patch).eq("organization_id", organizationId).eq("id", link.entity_id);
        break;
      case "lease":
        await supabase.from("leases").update(patch).eq("organization_id", organizationId).eq("id", link.entity_id);
        break;
      case "vendor":
        await supabase.from("vendors").update(patch).eq("organization_id", organizationId).eq("id", link.entity_id);
        break;
      case "applicant":
        await supabase.from("applicants").update(patch).eq("organization_id", organizationId).eq("id", link.entity_id);
        break;
      case "vault_document":
        await supabase
          .from("vault_documents")
          .update(patch)
          .eq("organization_id", organizationId)
          .eq("id", link.entity_id);
        break;
      default:
        break;
    }
  }

  const now = new Date().toISOString();
  await supabase
    .from("migration_record_links")
    .update({ rolled_back_at: now })
    .eq("organization_id", organizationId)
    .eq("job_id", jobId)
    .is("rolled_back_at", null);

  const { data, error } = await supabase
    .from("migration_jobs")
    .update({
      status: "rolled_back",
      rolled_back_at: now,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", jobId)
    .select(JOB_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Rollback failed");

  await recordMigrationActivity(organizationId, jobId, userId, "rollback_completed", "Rollback completed", {}, supabase);
  return toMigrationJobRecord(data as JobRow);
}

export async function getMigrationDashboardMetrics(
  organizationId: string,
  client?: SupabaseClientType
): Promise<MigrationDashboardMetrics> {
  const supabase = await resolveClient(client);
  const jobs = await getMigrationJobsForOrganization(organizationId, supabase);

  const activeJobs = jobs.filter((job) =>
    ["draft", "source_selected", "files_uploaded", "mapped", "preview_ready", "importing"].includes(job.status)
  ).length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const averageCompletionPct =
    jobs.length === 0 ? 0 : Math.round(jobs.reduce((sum, job) => sum + job.completionPct, 0) / jobs.length);

  const { count: pendingReview } = await supabase
    .from("migration_review_items")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "pending");

  const recentErrors = jobs.reduce((sum, job) => sum + job.progressErrors, 0);

  const { data: reviewSample } = await supabase
    .from("migration_review_items")
    .select("id, job_id, title, item_type")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: activityRows } = await supabase
    .from("migration_activity")
    .select("id, job_id, event_type, summary, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(8);

  const jobNumberById = new Map(jobs.map((job) => [job.id, job.jobNumber]));

  return {
    activeJobs,
    completedJobs,
    pendingReview: pendingReview ?? 0,
    recentErrors,
    averageCompletionPct,
    recentImports: jobs.slice(0, 5).map((job) => ({
      id: job.id,
      jobNumber: job.jobNumber,
      name: job.name,
      status: job.status,
      completionPct: job.completionPct,
      href: `/migration/${job.id}`
    })),
    pendingReviewSample: (reviewSample ?? []).map((item) => ({
      id: item.id,
      jobId: item.job_id,
      title: item.title,
      itemType: item.item_type,
      href: `/migration/${item.job_id}?step=review_exceptions`
    })),
    recentActivity: (activityRows ?? []).map((row) => ({
      id: row.id,
      jobId: row.job_id,
      jobNumber: jobNumberById.get(row.job_id) ?? "",
      summary: row.summary,
      eventType: row.event_type,
      createdAt: row.created_at,
      href: `/migration/${row.job_id}`
    }))
  };
}

export async function getMigrationActivityForJob(
  organizationId: string,
  jobId: string,
  client?: SupabaseClientType
): Promise<MigrationActivityRecord[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("migration_activity")
    .select("id, organization_id, job_id, event_type, summary, payload, created_by, created_at")
    .eq("organization_id", organizationId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return ((data ?? []) as ActivityRow[]).map(toActivityRecord);
}

export async function advanceMigrationJobStep(
  organizationId: string,
  jobId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<MigrationJobRecord | null> {
  const job = await getMigrationJobForOrganization(organizationId, jobId, client);
  if (!job) return null;
  const next = nextWizardStep(job.currentStep);
  if (!next) return job;
  return updateMigrationJob(organizationId, jobId, userId, { currentStep: next }, client);
}

async function importMappedRow(args: {
  organizationId: string;
  jobId: string;
  userId: string;
  entityType: MigrationEntityType;
  mapped: Record<string, string>;
  importFileId: string;
  rowIndex: number;
  propertyIdByKey: Map<string, string>;
  unitIdByKey: Map<string, string>;
  tenantIdByEmail: Map<string, string>;
  client: SupabaseClientType;
}): Promise<{ status: "imported" | "warning" | "review" }> {
  const validation = validateMappedRow(args.entityType, args.mapped);
  if (!validation.valid) {
    await createReviewItem(args, "validation_error", validation.message ?? "Validation failed");
    return { status: "review" };
  }

  switch (args.entityType) {
    case "property": {
      const key = buildDuplicateKey("property", args.mapped);
      if (args.propertyIdByKey.has(key)) {
        await createReviewItem(args, "duplicate_property", "Duplicate property in import batch");
        return { status: "warning" };
      }
      const created = await createProperty(
        args.organizationId,
        args.userId,
        {
          name: args.mapped["name"]!,
          code: null,
          propertyType: "residential",
          status: "active",
          description: null,
          addressLine1: args.mapped["addressLine1"]!,
          addressLine2: null,
          city: args.mapped["city"]!,
          stateRegion: args.mapped["stateRegion"]!,
          postalCode: args.mapped["postalCode"]!,
          countryCode: "US",
          timezone: null,
          latitude: null,
          longitude: null,
          ownershipEntityName: null,
          ownerContactName: null,
          ownerContactEmail: null,
          ownerContactPhone: null,
          coverImageUrl: null,
          metadata: { migrationJobId: args.jobId }
        },
        args.client
      );
      args.propertyIdByKey.set(key, created.id);
      await linkRecord(args, "property", created.id);
      return { status: "imported" };
    }
    case "unit": {
      const propertyKey = (args.mapped["propertyName"] ?? "").trim().toLowerCase();
      const propertyId = args.propertyIdByKey.get(propertyKey);
      if (!propertyId) {
        await createReviewItem(args, "unknown_property", "Property not found for unit row");
        return { status: "review" };
      }
      const unitKey = `${propertyId}|${args.mapped["unitNumber"]?.trim().toLowerCase()}`;
      if (args.unitIdByKey.has(unitKey)) {
        await createReviewItem(args, "duplicate_unit", "Duplicate unit in import batch");
        return { status: "warning" };
      }
      const created = await createUnit(
        args.organizationId,
        args.userId,
        {
          propertyId,
          unitNumber: args.mapped["unitNumber"]!,
          unitLabel: null,
          bedrooms: parseNumber(args.mapped["bedrooms"]),
          bathrooms: parseNumber(args.mapped["bathrooms"]),
          squareFeet: null,
          floor: null,
          rentAmount: parseNumber(args.mapped["rentAmount"]),
          depositAmount: null,
          currencyCode: "USD",
          occupancyStatus: "vacant_ready",
          status: "active",
          metadata: { migrationJobId: args.jobId }
        },
        args.client
      );
      args.unitIdByKey.set(unitKey, created.id);
      await linkRecord(args, "unit", created.id);
      return { status: "imported" };
    }
    case "tenant": {
      const email = args.mapped["email"]!.toLowerCase();
      if (args.tenantIdByEmail.has(email)) {
        await createReviewItem(args, "duplicate_tenant", "Duplicate tenant email in import batch");
        return { status: "warning" };
      }
      const propertyKey = (args.mapped["propertyName"] ?? "").trim().toLowerCase();
      const propertyId = propertyKey ? args.propertyIdByKey.get(propertyKey) ?? null : null;
      const unitKey = propertyId ? `${propertyId}|${(args.mapped["unitNumber"] ?? "").trim().toLowerCase()}` : "";
      const unitId = unitKey ? args.unitIdByKey.get(unitKey) ?? null : null;

      const created = await createTenant(
        args.organizationId,
        args.userId,
        {
          propertyId,
          unitId,
          firstName: args.mapped["firstName"]!,
          lastName: args.mapped["lastName"]!,
          preferredName: null,
          email,
          avatarUrl: null,
          avatarMediaAssetId: null,
          phone: args.mapped["phone"] ?? null,
          dateOfBirth: null,
          moveInDate: null,
          moveOutDate: null,
          documentsPlaceholder: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
          notes: null,
          status: "active",
          lifecycleStatus: "awaiting_move_in",
          metadata: { migrationJobId: args.jobId, migratedVia: "migration_center" }
        },
        args.client
      );
      args.tenantIdByEmail.set(email, created.id);
      await linkRecord(args, "tenant", created.id);
      return { status: "imported" };
    }
    case "vendor": {
      const created = await createVendor(
        args.organizationId,
        args.userId,
        {
          businessName: args.mapped["businessName"]!,
          primaryContactName: args.mapped["primaryContactName"] ?? null,
          phone: args.mapped["phone"] ?? null,
          email: args.mapped["email"] ?? null,
          addressLine1: null,
          addressLine2: null,
          city: null,
          stateRegion: null,
          postalCode: null,
          countryCode: "US",
          website: null,
          licenseNumber: null,
          insuranceExpiration: null,
          taxIdPlaceholder: null,
          emergencyAvailability: null,
          afterHoursAvailability: null,
          preferredVendor: false,
          rating: null,
          services: [],
          status: "active",
          internalNotes: null,
          metadata: { migrationJobId: args.jobId }
        },
        args.client
      );
      await linkRecord(args, "vendor", created.id);
      return { status: "imported" };
    }
    case "applicant": {
      const created = await createApplicant(
        args.organizationId,
        args.userId,
        {
          applicationGroupId: crypto.randomUUID(),
          isPrimary: true,
          propertyId: null,
          unitId: null,
          assignedPmId: null,
          status: "draft",
          firstName: args.mapped["firstName"]!,
          lastName: args.mapped["lastName"]!,
          preferredName: null,
          email: args.mapped["email"]!,
          phone: args.mapped["phone"] ?? null,
          dateOfBirth: null,
          plannedMoveInDate: null,
          profile: defaultApplicantProfile(),
          internalNotes: null,
          metadata: { migrationJobId: args.jobId }
        },
        args.client
      );
      await linkRecord(args, "applicant", created.id);
      return { status: "imported" };
    }
    case "document": {
      const entityId = args.mapped["entityId"] ?? args.mapped["tenantEmail"];
      if (!entityId) {
        await createReviewItem(args, "validation_error", "Document row missing entity reference");
        return { status: "review" };
      }
      const created = await createVaultDocument(
        args.organizationId,
        args.userId,
        {
          entityType: "tenant",
          entityId,
          documentType: "migration_import",
          title: args.mapped["title"] ?? args.mapped["filename"] ?? "Imported document",
          fileUrl: args.mapped["filePath"] ?? null,
          notes: "Imported via Migration Center",
          metadata: {
            migrationJobId: args.jobId,
            originalFilename: args.mapped["filename"] ?? null,
            sourcePath: args.mapped["filePath"] ?? null
          }
        },
        args.client
      );
      await linkRecord(args, "vault_document", created.id);
      return { status: "imported" };
    }
    case "lease": {
      const propertyKey = (args.mapped["propertyName"] ?? "").trim().toLowerCase();
      const propertyId = propertyKey ? args.propertyIdByKey.get(propertyKey) ?? null : null;
      const unitKey = propertyId
        ? `${propertyId}|${(args.mapped["unitNumber"] ?? "").trim().toLowerCase()}`
        : "";
      const unitId = unitKey ? args.unitIdByKey.get(unitKey) ?? null : null;
      const tenantEmail = (args.mapped["tenantEmail"] ?? "").trim().toLowerCase();
      const tenantId = tenantEmail ? args.tenantIdByEmail.get(tenantEmail) ?? null : null;
      const startDate = args.mapped["startDate"];
      const endDate = args.mapped["endDate"] ?? args.mapped["startDate"];
      const rentAmount = parseNumber(args.mapped["rentAmount"]);

      if (!propertyId || !unitId || !tenantId || !startDate || !endDate || rentAmount === null) {
        await createReviewItem(
          args,
          "ambiguous_match",
          "Lease import requires resolved property, unit, tenant, dates, and rent"
        );
        return { status: "review" };
      }

      const leaseNumber = args.mapped["leaseNumber"]?.trim();
      const created = await createLease(
        args.organizationId,
        args.userId,
        {
          ...(leaseNumber ? { leaseNumber } : {}),
          propertyId,
          unitId,
          primaryTenantId: tenantId,
          coTenantPlaceholder: null,
          leaseType: "residential",
          status: "active",
          startDate,
          endDate,
          moveInDate: startDate,
          moveOutDate: null,
          rentAmount,
          securityDeposit: parseNumber(args.mapped["securityDeposit"]) ?? 0,
          lateFeePlaceholder: null,
          renewalOption: false,
          noticePeriodDays: 30,
          renewalStatus: "none",
          internalNotes: "Imported via Migration Center",
          metadata: { migrationJobId: args.jobId }
        },
        args.client
      );
      await linkRecord(args, "lease", created.id);
      return { status: "imported" };
    }
    default:
      return { status: "warning" };
  }
}

async function createReviewItem(
  args: {
    organizationId: string;
    jobId: string;
    entityType: MigrationEntityType;
    mapped: Record<string, string>;
    importFileId: string;
    rowIndex: number;
    client: SupabaseClientType;
  },
  itemType: MigrationReviewItemRecord["itemType"],
  description: string
) {
  await args.client.from("migration_review_items").insert({
    organization_id: args.organizationId,
    job_id: args.jobId,
    item_type: itemType,
    title: `${args.entityType} row ${args.rowIndex + 1}`,
    description,
    source_row: { ...args.mapped, importFileId: args.importFileId, rowIndex: args.rowIndex } as Json
  });
}

async function linkRecord(
  args: {
    organizationId: string;
    jobId: string;
    importFileId: string;
    rowIndex: number;
    mapped: Record<string, string>;
    client: SupabaseClientType;
  },
  entityType: "property" | "unit" | "tenant" | "lease" | "vendor" | "applicant" | "vault_document",
  entityId: string
) {
  await args.client.from("migration_record_links").insert({
    organization_id: args.organizationId,
    job_id: args.jobId,
    entity_type: entityType,
    entity_id: entityId,
    source_key: buildDuplicateKey("tenant", args.mapped),
    source_row_index: args.rowIndex,
    import_file_id: args.importFileId
  });
}

function validateMappedRow(entityType: MigrationEntityType, row: Record<string, string>) {
  switch (entityType) {
    case "property":
      return row["name"] && row["addressLine1"] && row["city"] && row["stateRegion"] && row["postalCode"]
        ? { valid: true as const }
        : { valid: false as const, message: "Property requires name and full address" };
    case "unit":
      return row["unitNumber"] ? { valid: true as const } : { valid: false as const, message: "Unit number required" };
    case "tenant":
    case "applicant":
      return row["firstName"] && row["lastName"] && row["email"]
        ? { valid: true as const }
        : { valid: false as const, message: "Name and email required" };
    case "vendor":
      return row["businessName"] ? { valid: true as const } : { valid: false as const, message: "Vendor name required" };
    case "lease":
      return row["tenantEmail"] && row["startDate"] && (row["endDate"] || row["startDate"]) && row["rentAmount"]
        ? { valid: true as const }
        : { valid: false as const, message: "Lease requires tenant email, dates, and rent" };
    case "document":
      return row["filename"] || row["title"]
        ? { valid: true as const }
        : { valid: false as const, message: "Document title or filename required" };
    default:
      return { valid: true as const };
  }
}

async function parseUploadedBuffer(buffer: ArrayBuffer, fileType: string, filename: string): Promise<ParsedImportFile[]> {
  if (fileType === "csv") {
    const text = new TextDecoder("utf-8").decode(buffer);
    return [parseCsvContent(text)];
  }
  if (fileType === "xlsx") {
    return [parseXlsxBuffer(buffer)];
  }
  if (fileType === "zip") {
    const extracted = await parseZipBuffer(buffer);
    return extracted.map((entry) => entry.parsed);
  }
  if (fileType === "folder") {
    return [parseCsvContent(new TextDecoder("utf-8").decode(buffer))];
  }
  throw new Error(`Unsupported file type for ${filename}`);
}

function extractParsedRows(file: MigrationImportFileRecord): Record<string, string>[] {
  const rows = file.metadata["parsedRows"];
  if (Array.isArray(rows)) {
    return rows.filter((row): row is Record<string, string> => !!row && typeof row === "object" && !Array.isArray(row));
  }
  return [];
}

async function recordMigrationActivity(
  organizationId: string,
  jobId: string,
  userId: string,
  eventType: string,
  summary: string,
  payload: Record<string, unknown>,
  client: SupabaseClientType
) {
  await client.from("migration_activity").insert({
    organization_id: organizationId,
    job_id: jobId,
    event_type: eventType,
    summary,
    payload: payload as Json,
    created_by: userId
  });
}

async function nextJobNumber(organizationId: string, client: SupabaseClientType): Promise<string> {
  const { count } = await client
    .from("migration_jobs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  const sequence = (count ?? 0) + 1;
  return `MIG-${String(sequence).padStart(4, "0")}`;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

function toMigrationJobRecord(row: JobRow): MigrationJobRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    jobNumber: row.job_number,
    name: row.name,
    status: row.status as MigrationJobRecord["status"],
    sourceSoftware: row.source_software as MigrationSourceSoftware,
    currentStep: row.current_step as MigrationWizardStep,
    progressTotal: row.progress_total,
    progressImported: row.progress_imported,
    progressErrors: row.progress_errors,
    progressWarnings: row.progress_warnings,
    completionPct: Number(row.completion_pct),
    checkpointId: row.checkpoint_id,
    summary: (row.summary as Record<string, unknown>) ?? {},
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    startedAt: row.started_at,
    completedAt: row.completed_at,
    rolledBackAt: row.rolled_back_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function toImportFileRecord(row: ImportFileRow): MigrationImportFileRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    jobId: row.job_id,
    fileType: row.file_type as MigrationImportFileRecord["fileType"],
    originalFilename: row.original_filename,
    storagePath: row.storage_path,
    entityType: row.entity_type as MigrationEntityType | null,
    rowCount: row.row_count,
    columnHeaders: Array.isArray(row.column_headers) ? (row.column_headers as string[]) : [],
    parseStatus: row.parse_status as MigrationImportFileRecord["parseStatus"],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at
  };
}

function toReviewItemRecord(row: ReviewRow): MigrationReviewItemRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    jobId: row.job_id,
    itemType: row.item_type as MigrationReviewItemRecord["itemType"],
    status: row.status as MigrationReviewResolution,
    title: row.title,
    description: row.description,
    sourceRow: (row.source_row as Record<string, unknown>) ?? {},
    candidateRecords: Array.isArray(row.candidate_records) ? (row.candidate_records as Array<Record<string, unknown>>) : [],
    resolution: (row.resolution as Record<string, unknown>) ?? {},
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at
  };
}

function toActivityRecord(row: ActivityRow): MigrationActivityRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    jobId: row.job_id,
    eventType: row.event_type,
    summary: row.summary,
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

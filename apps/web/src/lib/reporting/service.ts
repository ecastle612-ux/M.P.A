/**
 * ReportingService — FIN-001 single entry point for financial reporting.
 * Read-only against accounting. Never mutates charges/payments/expenses/ledger.
 */
import type { User } from "@supabase/supabase-js";
import { createAuthServerClient } from "../auth/server";
import {
  REPORT_CATALOG,
  buildPeriod,
  type ReportCatalogItem,
  type ReportJobRecord,
  type ReportModel,
  type ReportRequestInput,
  type ReportType,
  type ReportVersionSummary,
  type RecognitionBasis
} from "./contracts";
import { buildReportModel } from "./engine";
import { onReportGenerated } from "./extensions";
import {
  completeReportJob,
  createReportJob,
  failReportJob,
  getReportJob,
  setJobStage
} from "./jobs";
import { renderReportPdf } from "./pdf-renderer";
import { listPropertiesForReporting, loadReportingSnapshot } from "./read-sources";
import {
  findCachedReportVersion,
  getReportPdfBytes,
  listReportVersions,
  persistReportPdf
} from "./vault";

/** Auth Supabase client from route handlers or RSC (both expose `.from`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportingDbClient = any;

export class ReportingService {
  static listReportTypes(): ReportCatalogItem[] {
    return REPORT_CATALOG;
  }

  static async listProperties(organizationId: string, client?: ReportingDbClient) {
    return listPropertiesForReporting(organizationId, client);
  }

  static async getSavedReportCount(input: {
    organizationId: string;
    propertyId: string;
    reportType: ReportType;
    year?: number;
    month?: number;
  }): Promise<number> {
    const versions = await listReportVersions(input);
    return versions.length;
  }

  static async listVersions(input: {
    organizationId: string;
    propertyId: string;
    reportType?: ReportType;
    year?: number;
    month?: number;
  }): Promise<ReportVersionSummary[]> {
    return listReportVersions(input);
  }

  static async previewReport(input: {
    user: User;
    organizationId: string;
    request: ReportRequestInput;
    client?: ReportingDbClient;
  }): Promise<ReportModel> {
    const period = buildPeriod(input.request.year, input.request.month);
    const basis: RecognitionBasis = input.request.recognitionBasis ?? "cash";
    const supabase = input.client ?? (await createAuthServerClient());
    const snapshot = await loadReportingSnapshot({
      organizationId: input.organizationId,
      userId: input.user.id,
      propertyId: input.request.propertyId,
      period,
      recognitionBasis: basis,
      client: supabase
    });
    return buildReportModel(input.request.reportType, snapshot, period);
  }

  static async generateReport(input: {
    user: User;
    organizationId: string;
    request: ReportRequestInput;
    wait?: boolean;
    client?: ReportingDbClient;
  }): Promise<ReportJobRecord> {
    const job = createReportJob({
      organizationId: input.organizationId,
      userId: input.user.id,
      request: {
        ...input.request,
        recognitionBasis: input.request.recognitionBasis ?? "cash",
        persistToVault: input.request.persistToVault !== false
      }
    });

    const run = () => this.runGenerationJob(job.id, input.user, input.organizationId, input.client);

    if (input.wait === false) {
      void run();
      return job;
    }

    await run();
    return getReportJob(job.id) ?? job;
  }

  static getJob(jobId: string, organizationId: string): ReportJobRecord | null {
    const job = getReportJob(jobId);
    if (!job || job.organizationId !== organizationId) return null;
    return job;
  }

  static async downloadVersion(input: {
    organizationId: string;
    propertyId: string;
    documentId: string;
  }) {
    return getReportPdfBytes(input);
  }

  private static async runGenerationJob(
    jobId: string,
    user: User,
    organizationId: string,
    client?: ReportingDbClient
  ): Promise<void> {
    const job = getReportJob(jobId);
    if (!job) return;

    try {
      setJobStage(jobId, "fetching_data", 15);
      const period = buildPeriod(job.input.year, job.input.month);
      const basis = job.input.recognitionBasis ?? "cash";
      const supabase = client ?? (await createAuthServerClient());
      const snapshot = await loadReportingSnapshot({
        organizationId,
        userId: user.id,
        propertyId: job.input.propertyId,
        period,
        recognitionBasis: basis,
        client: supabase
      });

      setJobStage(jobId, "building_model", 40);
      const reportModel = buildReportModel(job.input.reportType, snapshot, period);

      const cached = await findCachedReportVersion({
        organizationId,
        propertyId: job.input.propertyId,
        reportType: job.input.reportType,
        year: job.input.year,
        month: job.input.month,
        recognitionBasis: basis,
        sourceFingerprint: reportModel.sourceFingerprint
      });

      if (cached) {
        const result = {
          reportModel,
          version: cached,
          cached: true,
          contentHash: cached.sourceFingerprint
        };
        completeReportJob(jobId, result);
        await onReportGenerated({
          organizationId,
          input: job.input,
          result,
          version: cached
        });
        return;
      }

      setJobStage(jobId, "rendering_pdf", 70);
      const rendered = renderReportPdf(reportModel);

      let version = null;
      if (job.input.persistToVault !== false) {
        setJobStage(jobId, "saving_vault", 90);
        version = await persistReportPdf({
          user,
          organizationId,
          propertyId: job.input.propertyId,
          reportType: job.input.reportType,
          year: job.input.year,
          month: job.input.month,
          recognitionBasis: basis,
          sourceFingerprint: reportModel.sourceFingerprint,
          contentHash: rendered.contentHash,
          pageCount: rendered.pageCount,
          pdfBytes: rendered.bytes,
          periodLabel: period.label,
          client: supabase
        });
      }

      const result = {
        reportModel,
        version,
        cached: false,
        contentHash: rendered.contentHash,
        pdfBase64: Buffer.from(rendered.bytes).toString("base64")
      };
      completeReportJob(jobId, result);
      await onReportGenerated({
        organizationId,
        input: job.input,
        result,
        version
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Report generation failed";
      const code = message.startsWith("PROPERTY_NOT_FOUND")
        ? "PROPERTY_NOT_FOUND"
        : message.startsWith("VAULT_FAILED")
          ? "VAULT_FAILED"
          : "RENDER_FAILED";
      failReportJob(jobId, code, message);
    }
  }
}

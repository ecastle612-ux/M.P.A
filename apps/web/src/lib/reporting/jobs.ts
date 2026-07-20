import type { ReportJobRecord, ReportJobResult, ReportJobStage, ReportRequestInput } from "./contracts";

type GlobalJobStore = {
  __mpaFinancialReportJobs?: Map<string, ReportJobRecord>;
};

function store(): Map<string, ReportJobRecord> {
  const globalStore = globalThis as GlobalJobStore;
  if (!globalStore.__mpaFinancialReportJobs) {
    globalStore.__mpaFinancialReportJobs = new Map();
  }
  return globalStore.__mpaFinancialReportJobs;
}

export function createReportJob(input: {
  organizationId: string;
  userId: string;
  request: ReportRequestInput;
}): ReportJobRecord {
  const now = new Date().toISOString();
  const job: ReportJobRecord = {
    id: crypto.randomUUID(),
    organizationId: input.organizationId,
    userId: input.userId,
    status: "queued",
    stage: "queued",
    progressPercent: 0,
    input: input.request,
    error: null,
    result: null,
    createdAt: now,
    updatedAt: now
  };
  store().set(job.id, job);
  return job;
}

export function getReportJob(jobId: string): ReportJobRecord | null {
  return store().get(jobId) ?? null;
}

export function updateReportJob(
  jobId: string,
  patch: Partial<Pick<ReportJobRecord, "status" | "stage" | "progressPercent" | "error" | "result">>
): ReportJobRecord | null {
  const current = store().get(jobId);
  if (!current) return null;
  const next: ReportJobRecord = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  store().set(jobId, next);
  return next;
}

export function setJobStage(jobId: string, stage: ReportJobStage, progressPercent: number): void {
  updateReportJob(jobId, {
    status: stage === "complete" ? "succeeded" : "running",
    stage,
    progressPercent
  });
}

export function completeReportJob(jobId: string, result: ReportJobResult): ReportJobRecord | null {
  return updateReportJob(jobId, {
    status: "succeeded",
    stage: "complete",
    progressPercent: 100,
    result,
    error: null
  });
}

export function failReportJob(jobId: string, code: string, message: string): ReportJobRecord | null {
  return updateReportJob(jobId, {
    status: "failed",
    error: { code, message }
  });
}

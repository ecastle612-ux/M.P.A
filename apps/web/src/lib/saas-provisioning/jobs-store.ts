import {
  provisionIdempotencyKey,
  type ProvisioningJob,
  type ProvisioningStatus
} from "@mpa/shared";

const globalStore = globalThis as typeof globalThis & {
  __mpaProvisioningJobs?: Map<string, ProvisioningJob>;
};

function jobs(): Map<string, ProvisioningJob> {
  if (!globalStore.__mpaProvisioningJobs) {
    globalStore.__mpaProvisioningJobs = new Map();
  }
  return globalStore.__mpaProvisioningJobs;
}

export function getProvisioningJob(checkoutSessionId: string): ProvisioningJob | null {
  return jobs().get(checkoutSessionId) ?? null;
}

export function getProvisioningJobByIdempotency(key: string): ProvisioningJob | null {
  for (const job of jobs().values()) {
    if (job.idempotencyKey === key) return job;
  }
  return null;
}

export function saveProvisioningJob(job: ProvisioningJob): ProvisioningJob {
  jobs().set(job.checkoutSessionId, job);
  return job;
}

export function listProvisioningJobs(): ProvisioningJob[] {
  return [...jobs().values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createProvisioningJob(input: {
  checkoutSessionId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  catalogOfferId: string;
  productSku: string;
  planTier: string;
  billingCycle: string;
  ownerEmail: string;
  organizationName?: string | null;
}): ProvisioningJob {
  const existing = getProvisioningJob(input.checkoutSessionId);
  if (existing) {
    return existing;
  }
  const now = new Date().toISOString();
  const job: ProvisioningJob = {
    id: crypto.randomUUID(),
    checkoutSessionId: input.checkoutSessionId,
    idempotencyKey: provisionIdempotencyKey(input.checkoutSessionId),
    checkpoint: "received",
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    catalogOfferId: input.catalogOfferId,
    productSku: input.productSku,
    planTier: input.planTier,
    billingCycle: input.billingCycle,
    ownerEmail: input.ownerEmail.toLowerCase(),
    ownerUserId: null,
    organizationId: null,
    organizationName: input.organizationName ?? null,
    bindTokenHash: null,
    bindExpiresAt: null,
    attemptCount: 0,
    lastError: null,
    audit: [
      {
        at: now,
        from: "received",
        to: "received",
        attempt: 0,
        reason: "job_created"
      }
    ],
    emailsSent: [],
    createdAt: now,
    updatedAt: now
  };
  return saveProvisioningJob(job);
}

export function updateJobCheckpoint(
  checkoutSessionId: string,
  patch: Partial<ProvisioningJob> & { checkpoint?: ProvisioningStatus }
): ProvisioningJob | null {
  const current = getProvisioningJob(checkoutSessionId);
  if (!current) return null;
  const next: ProvisioningJob = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  return saveProvisioningJob(next);
}

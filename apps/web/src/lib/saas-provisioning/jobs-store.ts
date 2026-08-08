import {
  provisionIdempotencyKey,
  type ProvisioningAuditEntry,
  type ProvisioningJob,
  type ProvisioningStatus
} from "@mpa/shared";
import { serverEnv } from "../env/server-env";

const globalStore = globalThis as typeof globalThis & {
  __mpaProvisioningJobs?: Map<string, ProvisioningJob>;
};

type DbProvisioningRow = {
  id: string;
  checkout_session_id: string;
  idempotency_key: string;
  checkpoint: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  catalog_offer_id: string;
  product_sku: string;
  plan_tier: string;
  billing_cycle: string;
  owner_email: string;
  owner_user_id: string | null;
  organization_id: string | null;
  organization_name: string | null;
  bind_token_hash: string | null;
  bind_expires_at: string | null;
  attempt_count: number;
  last_error: string | null;
  audit: ProvisioningAuditEntry[] | null;
  emails_sent: string[] | null;
  created_at: string;
  updated_at: string;
};

async function tryServiceRole() {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

function mapDbJob(row: DbProvisioningRow): ProvisioningJob {
  return {
    id: row.id,
    checkoutSessionId: row.checkout_session_id,
    idempotencyKey: row.idempotency_key,
    checkpoint: row.checkpoint as ProvisioningStatus,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    catalogOfferId: row.catalog_offer_id,
    productSku: row.product_sku,
    planTier: row.plan_tier,
    billingCycle: row.billing_cycle,
    ownerEmail: row.owner_email,
    ownerUserId: row.owner_user_id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    bindTokenHash: row.bind_token_hash,
    bindExpiresAt: row.bind_expires_at,
    attemptCount: row.attempt_count ?? 0,
    lastError: row.last_error,
    audit: Array.isArray(row.audit) ? row.audit : [],
    emailsSent: Array.isArray(row.emails_sent) ? row.emails_sent : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

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

/** Load a job from Postgres into process memory (Production serverless cold start). */
export async function loadProvisioningJobFromDb(
  checkoutSessionId: string
): Promise<ProvisioningJob | null> {
  const memory = getProvisioningJob(checkoutSessionId);
  if (memory) return memory;
  const supabase = await tryServiceRole();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("provisioning_jobs")
    .select("*")
    .eq("checkout_session_id", checkoutSessionId)
    .maybeSingle();
  if (error || !data) return null;
  return saveProvisioningJob(mapDbJob(data as DbProvisioningRow));
}

export async function listProvisioningJobsFromDb(limit = 40): Promise<ProvisioningJob[]> {
  const supabase = await tryServiceRole();
  if (!supabase) return listProvisioningJobs();
  const { data, error } = await supabase
    .from("provisioning_jobs")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error || !data) return listProvisioningJobs();
  const mapped = (data as DbProvisioningRow[]).map((row) => {
    const job = mapDbJob(row);
    saveProvisioningJob(job);
    return job;
  });
  return mapped;
}

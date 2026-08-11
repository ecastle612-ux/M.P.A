/**
 * STAB-009 — minimize public commerce session responses.
 */

import {
  canAccessWorkspaceModules,
  isProvisioningComplete,
  isProvisioningCheckpoint,
  isTerminalFailure,
  operatorStepStatuses,
  type ProductSku,
  type ProvisioningJob,
  type ProvisioningStatus
} from "@mpa/shared";

export function maskEmail(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.toLowerCase().split("@");
  if (!local || !domain) return null;
  const visible = local.slice(0, Math.min(1, local.length));
  return `${visible}***@${domain}`;
}

/** Customer-visible progress steps — ids only (labels live in the UI). */
export function publicProvisioningSteps(job: ProvisioningJob): Array<{
  id: number;
  done: boolean;
  current: boolean;
}> {
  return operatorStepStatuses(job).map((step) => ({
    id: step.id,
    done: step.done,
    current: step.current
  }));
}

function asCheckpoint(value: string): ProvisioningStatus {
  return isProvisioningCheckpoint(value) ? value : "received";
}

/**
 * Minimal status safe for session_id alone (no email/org/user/subscription IDs).
 */
export function minimalProvisionStatusPayload(input: {
  checkpoint: string;
  steps: Array<{ id: number; done: boolean; current: boolean }>;
  hasTemporaryIssue: boolean;
  awaitingProvisioner?: boolean;
}) {
  const checkpoint = asCheckpoint(input.checkpoint);
  const ready = isProvisioningComplete(checkpoint);
  const canAccessModules = canAccessWorkspaceModules(checkpoint);
  const awaitingClaim =
    checkpoint === "owner_pending" ||
    checkpoint === "entitled" ||
    checkpoint === "org_created";
  return {
    checkpoint,
    ready,
    canAccessModules,
    awaitingClaim,
    steps: input.steps,
    nextPath: ready || canAccessModules || checkpoint === "owner_bound" ? "/setup" : null,
    hasTemporaryIssue: input.hasTemporaryIssue,
    awaitingProvisioner: Boolean(input.awaitingProvisioner)
  };
}

/**
 * Authorized binder/owner view — still minimized; never returns org/user IDs
 * or raw Stripe identifiers.
 */
export function authorizedProvisionStatusPayload(input: {
  job: ProvisioningJob;
  productSku: ProductSku | string;
}) {
  const base = minimalProvisionStatusPayload({
    checkpoint: input.job.checkpoint,
    steps: publicProvisioningSteps(input.job),
    hasTemporaryIssue: Boolean(input.job.lastError)
  });
  return {
    ...base,
    maskedOwnerEmail: maskEmail(input.job.ownerEmail),
    productSku: input.productSku,
    billingCycle: input.job.billingCycle,
    organizationPrepared: Boolean(input.job.organizationId)
  };
}

export function minimalCheckoutSessionPayload(input: {
  status: string;
  productSku: string;
  billingCycle: string;
  workspacePreparing: boolean;
  continuePath: string | null;
}) {
  return {
    status: input.status,
    productSku: input.productSku,
    billingCycle: input.billingCycle,
    workspacePreparing: input.workspacePreparing,
    continuePath: input.continuePath
  };
}

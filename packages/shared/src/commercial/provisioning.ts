/**
 * COM-002 Slice D — provisioning checkpoint state machine (A5).
 * Idempotent, recoverable, observable, retryable, compensatable.
 */

export const PROVISIONING_CHECKPOINTS = [
  "received",
  "customer_linked",
  "org_created",
  "entitled",
  "owner_pending",
  "owner_bound",
  "welcome_sent",
  "ready"
] as const;

export type ProvisioningCheckpoint = (typeof PROVISIONING_CHECKPOINTS)[number];

export const PROVISIONING_TERMINAL_FAILURES = [
  "failed_retryable",
  "failed_dead",
  "suspended_unclaimed"
] as const;

export type ProvisioningTerminalFailure = (typeof PROVISIONING_TERMINAL_FAILURES)[number];

export type ProvisioningStatus =
  | ProvisioningCheckpoint
  | ProvisioningTerminalFailure
  | "compensating";

/** Operator-facing 9-step view mapped onto the binding machine. */
export const OPERATOR_PROVISIONING_STEPS = [
  { id: 1, key: "validate_purchase", label: "Validate Stripe purchase", checkpoint: "received" },
  { id: 2, key: "validate_email", label: "Validate email ownership", checkpoint: "customer_linked" },
  { id: 3, key: "create_identity", label: "Create customer identity", checkpoint: "customer_linked" },
  { id: 4, key: "create_organization", label: "Create organization", checkpoint: "org_created" },
  { id: 5, key: "activate_product", label: "Activate purchased product", checkpoint: "entitled" },
  { id: 6, key: "assign_admin", label: "Assign Organization Admin", checkpoint: "owner_bound" },
  { id: 7, key: "default_settings", label: "Initialize default settings", checkpoint: "entitled" },
  { id: 8, key: "prepare_setup", label: "Prepare Guided Setup", checkpoint: "welcome_sent" },
  { id: 9, key: "route_mission_control", label: "Route to Mission Control", checkpoint: "ready" }
] as const;

export type ProvisioningAuditEntry = {
  at: string;
  from: ProvisioningStatus;
  to: ProvisioningStatus;
  reason?: string;
  attempt: number;
};

export type ProvisioningJob = {
  id: string;
  checkoutSessionId: string;
  idempotencyKey: string;
  checkpoint: ProvisioningStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  catalogOfferId: string;
  productSku: string;
  planTier: string;
  billingCycle: string;
  ownerEmail: string;
  ownerUserId: string | null;
  organizationId: string | null;
  organizationName: string | null;
  bindTokenHash: string | null;
  bindExpiresAt: string | null;
  attemptCount: number;
  lastError: string | null;
  audit: ProvisioningAuditEntry[];
  emailsSent: string[];
  createdAt: string;
  updatedAt: string;
};

export function provisionIdempotencyKey(checkoutSessionId: string): string {
  return `provision:org:${checkoutSessionId}`;
}

export function bindIdempotencyKey(checkoutSessionId: string): string {
  return `bind:owner:${checkoutSessionId}`;
}

export function isProvisioningCheckpoint(value: string): value is ProvisioningCheckpoint {
  return (PROVISIONING_CHECKPOINTS as readonly string[]).includes(value);
}

export function isTerminalFailure(status: ProvisioningStatus): status is ProvisioningTerminalFailure {
  return (PROVISIONING_TERMINAL_FAILURES as readonly string[]).includes(status);
}

export function isProvisioningComplete(status: ProvisioningStatus): boolean {
  return status === "ready";
}

export function canAccessWorkspaceModules(status: ProvisioningStatus): boolean {
  return (
    status === "owner_bound" ||
    status === "welcome_sent" ||
    status === "ready"
  );
}

const FORWARD: Record<ProvisioningCheckpoint, ProvisioningCheckpoint | null> = {
  received: "customer_linked",
  customer_linked: "org_created",
  org_created: "entitled",
  entitled: "owner_pending",
  owner_pending: "owner_bound",
  owner_bound: "welcome_sent",
  welcome_sent: "ready",
  ready: null
};

export function nextProvisioningCheckpoint(
  current: ProvisioningCheckpoint
): ProvisioningCheckpoint | null {
  return FORWARD[current];
}

export function transitionProvisioning(
  job: ProvisioningJob,
  to: ProvisioningStatus,
  reason?: string
): ProvisioningJob {
  const entry: ProvisioningAuditEntry = {
    at: new Date().toISOString(),
    from: job.checkpoint,
    to,
    attempt: job.attemptCount,
    ...(reason ? { reason } : {})
  };
  return {
    ...job,
    checkpoint: to,
    updatedAt: entry.at,
    lastError: isTerminalFailure(to) || to === "compensating" ? reason ?? job.lastError : null,
    audit: [...job.audit, entry]
  };
}

export function markProvisioningRetry(job: ProvisioningJob, reason: string): ProvisioningJob {
  const attemptCount = job.attemptCount + 1;
  const to: ProvisioningStatus = attemptCount >= 8 ? "failed_dead" : "failed_retryable";
  return transitionProvisioning({ ...job, attemptCount }, to, reason);
}

export function resumeFromRetryable(job: ProvisioningJob): ProvisioningJob {
  if (job.checkpoint !== "failed_retryable") {
    return job;
  }
  // Resume at last successful checkpoint from audit (last non-failure).
  let resume: ProvisioningCheckpoint = "received";
  for (const entry of job.audit) {
    if (isProvisioningCheckpoint(entry.to)) {
      resume = entry.to;
    }
  }
  return transitionProvisioning(job, resume, "resume_retryable");
}

export function operatorStepStatuses(job: ProvisioningJob): Array<{
  id: number;
  key: string;
  label: string;
  done: boolean;
  current: boolean;
}> {
  const order = PROVISIONING_CHECKPOINTS;
  const complete = isProvisioningComplete(job.checkpoint);
  const idx = isProvisioningCheckpoint(job.checkpoint) ? order.indexOf(job.checkpoint) : -1;

  return OPERATOR_PROVISIONING_STEPS.map((step) => {
    const stepIdx = order.indexOf(step.checkpoint);
    const isRouteStep = step.id === 9;
    const current =
      !complete &&
      isProvisioningCheckpoint(job.checkpoint) &&
      step.checkpoint === job.checkpoint;
    const done = complete
      ? true
      : (idx >= 0 && stepIdx >= 0 && stepIdx < idx) ||
        (idx >= 0 && step.checkpoint === job.checkpoint && !isRouteStep && !current);
    return {
      id: step.id,
      key: step.key,
      label: step.label,
      done: complete ? true : done && !current,
      current: complete ? isRouteStep : current
    };
  });
}

export function defaultOrganizationName(email: string, businessName?: string | null): string {
  if (businessName && businessName.trim()) {
    return businessName.trim();
  }
  const local = email.split("@")[0] || "Customer";
  return `${local} Organization`;
}

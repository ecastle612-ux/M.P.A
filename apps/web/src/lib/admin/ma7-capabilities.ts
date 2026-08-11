/**
 * MA-7 — Master Admin capability dictionary + bootstrap resolver.
 *
 * No Production migration: fine-grained grants table is deferred.
 * Bootstrap rule (permissions-and-mutations.md): active platform operators
 * map to read-all + currently implemented mutations only.
 *
 * Client-supplied capability claims are never trusted.
 */

export const MA7_CAPABILITIES = {
  OVERVIEW_READ: "ma.overview.read",
  ORGS_READ: "ma.orgs.read",
  ORGS_SUSPEND: "ma.orgs.suspend",
  ORGS_REACTIVATE: "ma.orgs.reactivate",
  USERS_READ: "ma.users.read",
  USERS_SUPPORT: "ma.users.support",
  USERS_MEMBERSHIP_MUTATE: "ma.users.membership.mutate",
  SUBSCRIPTIONS_READ: "ma.subscriptions.read",
  SUBSCRIPTIONS_CANCEL: "ma.subscriptions.cancel",
  SUBSCRIPTIONS_REACTIVATE: "ma.subscriptions.reactivate",
  SUBSCRIPTIONS_ASSIGN: "ma.subscriptions.assign",
  CAPACITY_READ: "ma.capacity.read",
  CAPACITY_MUTATE: "ma.capacity.mutate",
  PROVISIONING_READ: "ma.provisioning.read",
  PROVISIONING_RETRY: "ma.provisioning.retry",
  WEBHOOKS_READ: "ma.webhooks.read",
  ERRORS_READ: "ma.errors.read",
  OPERATIONS_READ: "ma.operations.read",
  AUDIT_READ: "ma.audit.read",
  SYSTEM_READ: "ma.system.read",
  IMPERSONATION_USE: "ma.impersonation.use"
} as const;

export type Ma7Capability = (typeof MA7_CAPABILITIES)[keyof typeof MA7_CAPABILITIES];

/** Capabilities that are intentionally NOT granted under bootstrap (blocked / deferred). */
export const MA7_BLOCKED_CAPABILITIES: readonly Ma7Capability[] = [
  MA7_CAPABILITIES.ORGS_SUSPEND,
  MA7_CAPABILITIES.ORGS_REACTIVATE,
  MA7_CAPABILITIES.CAPACITY_MUTATE,
  MA7_CAPABILITIES.SUBSCRIPTIONS_ASSIGN
];

const READ_CAPABILITIES: readonly Ma7Capability[] = [
  MA7_CAPABILITIES.OVERVIEW_READ,
  MA7_CAPABILITIES.ORGS_READ,
  MA7_CAPABILITIES.USERS_READ,
  MA7_CAPABILITIES.USERS_SUPPORT,
  MA7_CAPABILITIES.SUBSCRIPTIONS_READ,
  MA7_CAPABILITIES.CAPACITY_READ,
  MA7_CAPABILITIES.PROVISIONING_READ,
  MA7_CAPABILITIES.PROVISIONING_RETRY,
  MA7_CAPABILITIES.WEBHOOKS_READ,
  MA7_CAPABILITIES.ERRORS_READ,
  MA7_CAPABILITIES.OPERATIONS_READ,
  MA7_CAPABILITIES.AUDIT_READ,
  MA7_CAPABILITIES.SYSTEM_READ,
  MA7_CAPABILITIES.IMPERSONATION_USE
];

/** Implemented MA-7 mutate capabilities under bootstrap (no new DB grants table). */
const BOOTSTRAP_MUTATE_CAPABILITIES: readonly Ma7Capability[] = [
  MA7_CAPABILITIES.USERS_MEMBERSHIP_MUTATE,
  MA7_CAPABILITIES.SUBSCRIPTIONS_CANCEL,
  MA7_CAPABILITIES.SUBSCRIPTIONS_REACTIVATE
];

export function bootstrapOperatorCapabilities(isActiveOperator: boolean): ReadonlySet<Ma7Capability> {
  if (!isActiveOperator) return new Set();
  return new Set<Ma7Capability>([...READ_CAPABILITIES, ...BOOTSTRAP_MUTATE_CAPABILITIES]);
}

export function operatorHasCapability(
  capabilities: ReadonlySet<Ma7Capability>,
  required: Ma7Capability
): boolean {
  return capabilities.has(required);
}

/**
 * Ignore any client-supplied capability list. Capabilities come only from
 * server-side operator resolution.
 */
export function resolveTrustedCapabilities(input: {
  isActiveOperator: boolean;
  clientClaimedCapabilities?: unknown;
}): ReadonlySet<Ma7Capability> {
  void input.clientClaimedCapabilities;
  return bootstrapOperatorCapabilities(input.isActiveOperator);
}

export function isBlockedCapability(capability: Ma7Capability): boolean {
  return (MA7_BLOCKED_CAPABILITIES as readonly string[]).includes(capability);
}

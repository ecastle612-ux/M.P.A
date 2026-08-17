import {
  complimentaryClaimLocksSku,
  complimentaryGrantIsDue,
  complimentaryGrantNeedsExpiryNotice,
  defaultOrganizationName,
  evaluateComplimentaryUnitLimit,
  normalizeComplimentaryEmail,
  parseComplimentarySendAccessInput,
  resolveComplimentaryExpiresAt,
  type ComplimentaryDurationId,
  type ComplimentaryGrant,
  type ComplimentaryGrantEvent,
  type ComplimentaryGrantStatus,
  type ComplimentaryGrantType,
  type ComplimentaryLimitMode,
  type ProductSku
} from "@mpa/shared";
import { getComplimentaryGrantStore, type ComplimentaryGrantStore } from "./store";
import { complimentaryClaimTokenValid, hashComplimentaryClaimToken, issueComplimentaryClaimToken } from "./tokens";
import { sendComplimentaryExpiryEmail, sendComplimentaryWelcomeEmail } from "./emails";

export type ComplimentaryAuthUser = { id: string; email: string };

export type ComplimentaryServiceDeps = {
  store?: ComplimentaryGrantStore;
  now?: () => Date;
  sendWelcome?: typeof sendComplimentaryWelcomeEmail;
  sendExpiry?: typeof sendComplimentaryExpiryEmail;
  findAuthUserByEmail?: (email: string) => Promise<ComplimentaryAuthUser | null>;
  createOrUpdateAuthUser?: (input: {
    email: string;
    password?: string;
    existing?: ComplimentaryAuthUser | null;
  }) => Promise<ComplimentaryAuthUser>;
  createOrganization?: (input: {
    name: string;
    ownerUserId: string;
    email: string;
    sku: ProductSku;
  }) => Promise<{ organizationId: string; organizationName: string }>;
  assignSku?: (input: {
    organizationId: string;
    sku: ProductSku;
    assignedBy: string;
  }) => Promise<{ error: string | null }>;
  hasPaidSubscription?: (organizationId: string) => Promise<{
    stripeSubscriptionId: string | null;
    status: string | null;
    sku: ProductSku | null;
  }>;
  countUnits?: (organizationId: string) => Promise<number>;
  deleteOrganization?: (organizationId: string) => Promise<void>;
};

function newId(_prefix?: string): string {
  return crypto.randomUUID();
}

function depsStore(deps?: ComplimentaryServiceDeps): ComplimentaryGrantStore {
  return deps?.store ?? getComplimentaryGrantStore();
}

function nowIso(deps?: ComplimentaryServiceDeps): string {
  return (deps?.now ?? (() => new Date()))().toISOString();
}

function nowDate(deps?: ComplimentaryServiceDeps): Date {
  return deps?.now ? deps.now() : new Date();
}

function recordEvent(
  store: ComplimentaryGrantStore,
  grantId: string,
  action: string,
  actorUserId: string | null,
  payload: Record<string, unknown> = {}
): void {
  store.appendEvent({
    id: newId("cge"),
    grantId,
    action,
    actorUserId,
    payload,
    createdAt: new Date().toISOString()
  });
}

export function toPublicComplimentaryGrant(grant: ComplimentaryGrant): Omit<
  ComplimentaryGrant,
  "claimTokenHash"
> & { claimTokenHash?: never } {
  const { claimTokenHash: _hash, ...rest } = grant;
  return rest;
}

export async function sendComplimentaryAccess(
  input: unknown,
  actorUserId: string,
  deps: ComplimentaryServiceDeps = {}
): Promise<
  | { ok: true; grant: ComplimentaryGrant; claimToken: string; resent: boolean }
  | { ok: false; error: string }
> {
  const parsed = parseComplimentarySendAccessInput(input);
  if ("error" in parsed) {
    return { ok: false, error: parsed.error };
  }
  const store = depsStore(deps);
  const existing = store.findOpenByEmail(parsed.email);
  const issued = issueComplimentaryClaimToken();
  const timestamp = nowIso(deps);

  if (existing?.status === "active") {
    const resent = await (deps.sendWelcome ?? sendComplimentaryWelcomeEmail)({
      grant: existing,
      claimToken: issued.token
    });
    if (!resent.ok) {
      return { ok: false, error: resent.error ?? "welcome_email_failed" };
    }
    const updated = store.save({
      ...existing,
      claimTokenHash: issued.hash,
      claimExpiresAt: issued.expiresAt,
      updatedAt: timestamp
    });
    recordEvent(store, updated.id, "resend", actorUserId, { reason: "already_active" });
    return { ok: true, grant: updated, claimToken: issued.token, resent: true };
  }

  const expiresAt = resolveComplimentaryExpiresAt(parsed.durationId, nowDate(deps));
  const grant: ComplimentaryGrant = existing
    ? {
        ...existing,
        grantType: parsed.grantType,
        productSku: parsed.productSku,
        expiresAt,
        limitMode: parsed.limitMode,
        customUnitLimit: parsed.customUnitLimit ?? null,
        claimTokenHash: issued.hash,
        claimExpiresAt: issued.expiresAt,
        grantedBy: actorUserId,
        updatedAt: timestamp
      }
    : {
        id: newId(),
        recipientEmail: parsed.email,
        grantType: parsed.grantType,
        productSku: parsed.productSku,
        status: "invited",
        expiresAt,
        limitMode: parsed.limitMode,
        customUnitLimit: parsed.customUnitLimit ?? null,
        organizationId: null,
        organizationName: null,
        userId: null,
        claimTokenHash: issued.hash,
        claimExpiresAt: issued.expiresAt,
        grantedBy: actorUserId,
        convertedAt: null,
        expiryNoticeSentAt: null,
        createdAt: timestamp,
        updatedAt: timestamp
      };

  const saved = store.save(grant);
  const sent = await (deps.sendWelcome ?? sendComplimentaryWelcomeEmail)({
    grant: saved,
    claimToken: issued.token
  });
  if (!sent.ok) {
    return { ok: false, error: sent.error ?? "welcome_email_failed" };
  }
  recordEvent(store, saved.id, existing ? "resend" : "send_access", actorUserId, {
    grantType: saved.grantType,
    productSku: saved.productSku,
    durationId: parsed.durationId,
    limitMode: saved.limitMode
  });
  return { ok: true, grant: saved, claimToken: issued.token, resent: Boolean(existing) };
}

export async function resendComplimentaryAccess(
  grantId: string,
  actorUserId: string,
  deps: ComplimentaryServiceDeps = {}
): Promise<{ ok: true; grant: ComplimentaryGrant; claimToken: string } | { ok: false; error: string }> {
  const store = depsStore(deps);
  const grant = store.get(grantId);
  if (!grant) {
    return { ok: false, error: "grant_not_found" };
  }
  if (grant.status === "revoked") {
    return { ok: false, error: "grant_revoked" };
  }
  const issued = issueComplimentaryClaimToken();
  const updated = store.save({
    ...grant,
    claimTokenHash: issued.hash,
    claimExpiresAt: issued.expiresAt,
    updatedAt: nowIso(deps)
  });
  const sent = await (deps.sendWelcome ?? sendComplimentaryWelcomeEmail)({
    grant: updated,
    claimToken: issued.token
  });
  if (!sent.ok) {
    return { ok: false, error: sent.error ?? "welcome_email_failed" };
  }
  recordEvent(store, updated.id, "resend", actorUserId, {});
  return { ok: true, grant: updated, claimToken: issued.token };
}

export function mutateComplimentaryGrant(
  grantId: string,
  actorUserId: string,
  action:
    | { type: "extend"; durationId: ComplimentaryDurationId }
    | { type: "change_limit"; limitMode: ComplimentaryLimitMode; customUnitLimit?: number | null }
    | { type: "remove_expiration" }
    | { type: "revoke" }
    | { type: "convert_to_gift" },
  deps: ComplimentaryServiceDeps = {}
): { ok: true; grant: ComplimentaryGrant } | { ok: false; error: string } {
  const store = depsStore(deps);
  const grant = store.get(grantId);
  if (!grant) {
    return { ok: false, error: "grant_not_found" };
  }
  if (grant.status === "revoked" && action.type !== "revoke") {
    return { ok: false, error: "grant_revoked" };
  }

  let next: ComplimentaryGrant = { ...grant, updatedAt: nowIso(deps) };
  if (action.type === "extend") {
    next.expiresAt = resolveComplimentaryExpiresAt(action.durationId, nowDate(deps));
    if (next.status === "expired") {
      next.status = next.organizationId ? "active" : "invited";
    }
    next.expiryNoticeSentAt = null;
  } else if (action.type === "change_limit") {
    next.limitMode = action.limitMode;
    next.customUnitLimit = action.limitMode === "custom" ? action.customUnitLimit ?? null : null;
    if (action.limitMode === "custom" && (!next.customUnitLimit || next.customUnitLimit < 1)) {
      return { ok: false, error: "invalid_custom_limit" };
    }
  } else if (action.type === "remove_expiration") {
    next.expiresAt = null;
    next.expiryNoticeSentAt = null;
    if (next.status === "expired") {
      next.status = next.organizationId ? "active" : "invited";
    }
  } else if (action.type === "revoke") {
    next.status = "revoked";
  } else if (action.type === "convert_to_gift") {
    next.grantType = "gift";
  }

  const saved = store.save(next);
  recordEvent(store, saved.id, action.type, actorUserId, action as unknown as Record<string, unknown>);
  return { ok: true, grant: saved };
}

export async function claimComplimentaryAccess(
  input: { token: string; password?: string; requestedSku?: unknown; actorEmail?: string | null },
  deps: ComplimentaryServiceDeps = {}
): Promise<
  | {
      ok: true;
      grant: ComplimentaryGrant;
      userId: string;
      organizationId: string;
      reusedUser: boolean;
      reusedOrganization: boolean;
    }
  | { ok: false; error: string }
> {
  const token = input.token.trim();
  if (!token) {
    return { ok: false, error: "bind_token_required" };
  }
  const store = depsStore(deps);
  const hashed = hashComplimentaryClaimToken(token);
  const grant = store.getByTokenHash(hashed);
  if (!grant || !complimentaryClaimTokenValid(grant, token)) {
    return { ok: false, error: "invalid_or_expired_claim_token" };
  }
  if (grant.status === "revoked") {
    return { ok: false, error: "grant_revoked" };
  }
  if (grant.status === "expired" || complimentaryGrantIsDue(grant, nowDate(deps))) {
    return { ok: false, error: "grant_expired" };
  }
  const skuLock = complimentaryClaimLocksSku(grant.productSku, input.requestedSku);
  if (!skuLock.ok) {
    return { ok: false, error: skuLock.error };
  }
  if (input.actorEmail && normalizeComplimentaryEmail(input.actorEmail) !== grant.recipientEmail) {
    return { ok: false, error: "email_mismatch" };
  }

  const findUser = deps.findAuthUserByEmail ?? (async () => null);
  const existingUser = await findUser(grant.recipientEmail);
  const upsertUser =
    deps.createOrUpdateAuthUser ??
    (async ({ email, existing }) => existing ?? { id: `user_${email}`, email });
  const user = await upsertUser({
    email: grant.recipientEmail,
    existing: existingUser,
    ...(input.password ? { password: input.password } : {})
  });

  let organizationId = grant.organizationId;
  let organizationName = grant.organizationName;
  let reusedOrganization = Boolean(organizationId);
  if (!organizationId) {
    const createOrg =
      deps.createOrganization ??
      (async ({ name }) => ({ organizationId: `org_${grant.id}`, organizationName: name }));
    const org = await createOrg({
      name: defaultOrganizationName(grant.recipientEmail),
      ownerUserId: user.id,
      email: grant.recipientEmail,
      sku: grant.productSku
    });
    organizationId = org.organizationId;
    organizationName = org.organizationName;
    reusedOrganization = false;
    const assign =
      deps.assignSku ??
      (async () => ({ error: null }));
    const assigned = await assign({
      organizationId,
      sku: grant.productSku,
      assignedBy: user.id
    });
    if (assigned.error) {
      return { ok: false, error: assigned.error };
    }
  }

  const updated = store.save({
    ...grant,
    status: "active",
    userId: user.id,
    organizationId,
    organizationName,
    claimTokenHash: grant.claimTokenHash,
    updatedAt: nowIso(deps)
  });
  recordEvent(store, updated.id, "claim", user.id, {
    reusedUser: Boolean(existingUser),
    reusedOrganization,
    productSku: updated.productSku
  });
  return {
    ok: true,
    grant: updated,
    userId: user.id,
    organizationId: organizationId!,
    reusedUser: Boolean(existingUser),
    reusedOrganization
  };
}

export function expireDueComplimentaryGrants(
  deps: ComplimentaryServiceDeps = {}
): { expired: ComplimentaryGrant[]; deletedOrganizations: string[] } {
  const store = depsStore(deps);
  const now = nowDate(deps);
  const expired: ComplimentaryGrant[] = [];
  for (const grant of store.list()) {
    if (!complimentaryGrantIsDue(grant, now)) {
      continue;
    }
    if (grant.convertedAt) {
      continue;
    }
    const next = store.save({
      ...grant,
      status: "expired",
      updatedAt: now.toISOString()
    });
    recordEvent(store, next.id, "expire", null, { expiresAt: next.expiresAt });
    expired.push(next);
  }
  return { expired, deletedOrganizations: [] };
}

export async function notifyUpcomingComplimentaryExpirations(
  deps: ComplimentaryServiceDeps = {}
): Promise<{ notified: string[] }> {
  const store = depsStore(deps);
  const now = nowDate(deps);
  const notified: string[] = [];
  for (const grant of store.list()) {
    if (!complimentaryGrantNeedsExpiryNotice(grant, now) || !grant.expiresAt) {
      continue;
    }
    const sent = await (deps.sendExpiry ?? sendComplimentaryExpiryEmail)({ grant });
    if (!sent.ok) {
      continue;
    }
    store.save({
      ...grant,
      expiryNoticeSentAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
    recordEvent(store, grant.id, "expiry_notice", null, { expiresAt: grant.expiresAt });
    notified.push(grant.id);
  }
  return { notified };
}

async function hydrateStoreIfNeeded(store: ComplimentaryGrantStore): Promise<void> {
  if (store.list().length > 0 || process.env["VITEST"]) {
    return;
  }
  try {
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      return;
    }
    const { createServiceRoleClient } = await import("../supabase/service-role");
    const { loadComplimentaryStoreFromDb } = await import("./durable");
    const loaded = await loadComplimentaryStoreFromDb(createServiceRoleClient());
    for (const grant of loaded.list()) {
      store.save(grant);
    }
  } catch {
    // Missing table / service role — keep the current store.
  }
}

export async function markComplimentaryConverted(input: {
  email: string;
  organizationId: string;
  paidSku: ProductSku;
  stripeSubscriptionId: string;
}, deps: ComplimentaryServiceDeps = {}): Promise<ComplimentaryGrant | null> {
  const store = depsStore(deps);
  await hydrateStoreIfNeeded(store);
  const email = normalizeComplimentaryEmail(input.email);
  const grant =
    store.findOpenByEmail(email) ??
    store.findByOrganizationId(input.organizationId) ??
    store.findByEmail(email)[0] ??
    null;
  if (!grant) {
    return null;
  }
  const updated = store.save({
    ...grant,
    organizationId: grant.organizationId ?? input.organizationId,
    convertedAt: nowIso(deps),
    updatedAt: nowIso(deps)
  });
  recordEvent(store, updated.id, "converted_to_paid", null, {
    paidSku: input.paidSku,
    stripeSubscriptionId: input.stripeSubscriptionId,
    organizationId: input.organizationId,
    reusedOrganization: grant.organizationId === input.organizationId
  });
  return updated;
}

export function findComplimentaryOrganizationForEmail(
  email: string,
  deps: ComplimentaryServiceDeps = {}
): { organizationId: string; productSku: ProductSku; grantId: string } | null {
  const store = depsStore(deps);
  const matches = store.findByEmail(normalizeComplimentaryEmail(email));
  const withOrg = matches.find((grant) => grant.organizationId && grant.status !== "revoked");
  if (!withOrg?.organizationId) {
    return null;
  }
  return {
    organizationId: withOrg.organizationId,
    productSku: withOrg.productSku,
    grantId: withOrg.id
  };
}

export async function attachComplimentaryOrganization(input: {
  email: string;
  organizationId: string;
  organizationName?: string | null;
  sku?: ProductSku;
}, deps: ComplimentaryServiceDeps = {}): Promise<ComplimentaryGrant | null> {
  const store = depsStore(deps);
  await hydrateStoreIfNeeded(store);
  const grant = store.findOpenByEmail(normalizeComplimentaryEmail(input.email));
  if (!grant) {
    return null;
  }
  if (input.sku && input.sku !== grant.productSku) {
    return grant;
  }
  const updated = store.save({
    ...grant,
    organizationId: grant.organizationId ?? input.organizationId,
    organizationName: grant.organizationName ?? input.organizationName ?? null,
    updatedAt: nowIso(deps)
  });
  recordEvent(store, updated.id, "attach_organization", null, {
    organizationId: input.organizationId,
    reusedOrganization: Boolean(grant.organizationId)
  });
  return updated;
}

export function findComplimentaryGrantForOrganization(
  organizationId: string,
  deps: ComplimentaryServiceDeps = {}
): ComplimentaryGrant | null {
  return depsStore(deps).findByOrganizationId(organizationId);
}

export function listComplimentaryGrants(deps: ComplimentaryServiceDeps = {}): ComplimentaryGrant[] {
  expireDueComplimentaryGrants(deps);
  return depsStore(deps).list();
}

export function listComplimentaryGrantEvents(
  grantId: string,
  deps: ComplimentaryServiceDeps = {}
): ComplimentaryGrantEvent[] {
  return depsStore(deps).listEvents(grantId);
}

export async function assertComplimentaryUnitLimit(input: {
  organizationId: string;
  actualUnits: number;
  additionalUnits: number;
  stripeSubscriptionId?: string | null;
  paidStatus?: string | null;
}, deps: ComplimentaryServiceDeps = {}): Promise<{
  allowed: boolean;
  authorizedCapacity: number | null;
  wouldDelete: false;
}> {
  const store = depsStore(deps);
  await hydrateStoreIfNeeded(store);
  const grant = findComplimentaryGrantForOrganization(input.organizationId, { ...deps, store });
  return evaluateComplimentaryUnitLimit({
    grant,
    actualUnits: input.actualUnits,
    additionalUnits: input.additionalUnits,
    ...(input.stripeSubscriptionId !== undefined
      ? { stripeSubscriptionId: input.stripeSubscriptionId }
      : {}),
    ...(input.paidStatus !== undefined ? { paidStatus: input.paidStatus } : {})
  });
}

export function complimentaryPreviewFromToken(
  token: string,
  deps: ComplimentaryServiceDeps = {}
): {
  email: string;
  productSku: ProductSku;
  grantType: ComplimentaryGrantType;
  expiresAt: string | null;
  status: ComplimentaryGrantStatus;
} | null {
  const grant = depsStore(deps).getByTokenHash(hashComplimentaryClaimToken(token));
  if (!grant || !complimentaryClaimTokenValid(grant, token)) {
    return null;
  }
  return {
    email: grant.recipientEmail,
    productSku: grant.productSku,
    grantType: grant.grantType,
    expiresAt: grant.expiresAt,
    status: grant.status
  };
}

export function resolvePaidProvisioningOrganizationId(input: {
  ownerEmail: string;
  complimentaryOrganizationId?: string | null;
}): string | null {
  if (input.complimentaryOrganizationId) {
    return input.complimentaryOrganizationId;
  }
  return findComplimentaryOrganizationForEmail(input.ownerEmail)?.organizationId ?? null;
}

export { complimentaryGrantIsOpen, paidSubscriptionTakesPrecedence } from "@mpa/shared";

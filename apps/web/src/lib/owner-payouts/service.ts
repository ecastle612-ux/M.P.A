/**
 * OwnerPayoutService — FIN-003 Phase A/B onboarding + Phase C transfer webhook bridge.
 * Phase D read projections live in projections.ts (history / remittance / run summaries).
 * Never call ConnectProvider from UI. Schedules / Phase E remain out of scope.
 */
import { applyTransferWebhookEvents } from "./transfers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import {
  eligibilityLabel,
  getConnectProvider,
  isFin003PhaseAEnabled,
  remediationGuidance,
  resolveDefaultConnectProviderId,
  type ConnectAccountPurpose,
  type ConnectAccountStatus
} from "../integrations/connect";
import { notify } from "../notifications/service";

// Tables may not yet be in generated Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConnectClient = any;

export type ConnectStatusView = {
  phaseAEnabled: boolean;
  purpose: ConnectAccountPurpose;
  status: ConnectAccountStatus;
  statusLabel: string;
  externalAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
  /** Honesty: never invents pending/paid money amounts */
  pendingPayoutAvailable: false;
  pendingPayoutMessage: string;
  canStartOnboarding: boolean;
  /** Phase B — clear remediation / next step copy */
  nextStepMessage: string;
  remediationRequired: boolean;
  lastSyncedAt: string | null;
};

export type OwnerConnectRosterRow = {
  ownerUserId: string;
  displayName: string;
  email: string | null;
  status: ConnectAccountStatus;
  statusLabel: string;
  remediationRequired: boolean;
  nextStepMessage: string;
  externalAccountId: string | null;
  lastSyncedAt: string | null;
};

export type OnboardingLinkResult = {
  url: string;
  expiresAt: string | null;
  externalAccountId: string;
  status: ConnectAccountStatus;
};

const PENDING_MESSAGE =
  "Connect eligibility is not a paid payout. When transfers complete, paid and failed history appears on Owner Financials from recorded TransferIntents.";

const ALLOWED_RETURN_PREFIXES = [
  "/portal/owner",
  "/portal/owner/financials",
  "/portal/owner/settings",
  "/settings/organization",
  "/settings/payouts",
  "/settings/integrations"
];

async function resolveClient(client?: SupabaseClient<Database>): Promise<ConnectClient> {
  return client ?? (await createAuthServerComponentClient());
}

async function adminClient(): Promise<ConnectClient> {
  return createServiceRoleServerClient() as ConnectClient;
}

function appOrigin(): string {
  return (process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000").replace(/\/$/, "");
}

export function assertSafeReturnPath(path: string): string {
  const trimmed = path.trim() || "/portal/owner/financials";
  const pathname = trimmed.startsWith("http")
    ? (() => {
        try {
          return new URL(trimmed).pathname;
        } catch {
          return "/portal/owner/financials";
        }
      })()
    : trimmed.startsWith("/")
      ? trimmed
      : `/${trimmed}`;

  const allowed = ALLOWED_RETURN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!allowed) {
    throw new Error("Return URL path is not allowed");
  }
  return pathname;
}

function toAbsoluteUrl(path: string): string {
  const safe = assertSafeReturnPath(path);
  return `${appOrigin()}${safe}`;
}

async function writeAudit(
  organizationId: string,
  entityType: string,
  entityId: string | null,
  eventType: string,
  summary: string,
  actorUserId: string | null,
  payload: Record<string, unknown>,
  client: ConnectClient
) {
  await client.from("connect_audit_events").insert({
    organization_id: organizationId,
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    summary,
    actor_user_id: actorUserId,
    payload: payload as Json
  });
}

type ConnectAccountRow = {
  id: string;
  organization_id: string;
  purpose: ConnectAccountPurpose;
  owner_user_id: string | null;
  provider: string;
  external_account_id: string;
  status: ConnectAccountStatus;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  currently_due: unknown;
  past_due: unknown;
  disabled_reason: string | null;
  last_synced_at?: string | null;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function emptyStatus(purpose: ConnectAccountPurpose, canStart: boolean): ConnectStatusView {
  const guidance = remediationGuidance({
    status: "not_started",
    currentlyDue: [],
    pastDue: [],
    disabledReason: null,
    purpose
  });
  return {
    phaseAEnabled: isFin003PhaseAEnabled(),
    purpose,
    status: "not_started",
    statusLabel: eligibilityLabel("not_started"),
    externalAccountId: null,
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    currentlyDue: [],
    pastDue: [],
    disabledReason: null,
    pendingPayoutAvailable: false,
    pendingPayoutMessage: PENDING_MESSAGE,
    canStartOnboarding: canStart && isFin003PhaseAEnabled(),
    nextStepMessage: guidance.nextStepMessage,
    remediationRequired: guidance.remediationRequired,
    lastSyncedAt: null
  };
}

function rowToStatus(row: ConnectAccountRow, canStart: boolean): ConnectStatusView {
  const currentlyDue = asStringArray(row.currently_due);
  const pastDue = asStringArray(row.past_due);
  const guidance = remediationGuidance({
    status: row.status,
    currentlyDue,
    pastDue,
    disabledReason: row.disabled_reason,
    purpose: row.purpose
  });
  return {
    phaseAEnabled: isFin003PhaseAEnabled(),
    purpose: row.purpose,
    status: row.status,
    statusLabel: eligibilityLabel(row.status),
    externalAccountId: row.external_account_id,
    chargesEnabled: row.charges_enabled,
    payoutsEnabled: row.payouts_enabled,
    detailsSubmitted: row.details_submitted,
    currentlyDue,
    pastDue,
    disabledReason: row.disabled_reason,
    pendingPayoutAvailable: false,
    pendingPayoutMessage: PENDING_MESSAGE,
    canStartOnboarding:
      canStart &&
      isFin003PhaseAEnabled() &&
      row.status !== "eligible" &&
      row.status !== "disabled",
    nextStepMessage: guidance.nextStepMessage,
    remediationRequired: guidance.remediationRequired,
    lastSyncedAt: row.last_synced_at ?? null
  };
}

async function loadAccountRow(
  organizationId: string,
  purpose: ConnectAccountPurpose,
  ownerUserId: string | null,
  client: ConnectClient
): Promise<ConnectAccountRow | null> {
  let query = client
    .from("connect_accounts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("purpose", purpose);

  if (purpose === "owner") {
    query = query.eq("owner_user_id", ownerUserId);
  } else {
    query = query.is("owner_user_id", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ConnectAccountRow | null) ?? null;
}

async function persistSnapshot(
  row: ConnectAccountRow,
  snapshot: {
    status: ConnectAccountStatus;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    currentlyDue: string[];
    pastDue: string[];
    disabledReason: string | null;
    rawRequirements?: Record<string, unknown> | null;
  },
  client: ConnectClient
): Promise<ConnectAccountRow> {
  const { data, error } = await client
    .from("connect_accounts")
    .update({
      status: snapshot.status,
      charges_enabled: snapshot.chargesEnabled,
      payouts_enabled: snapshot.payoutsEnabled,
      details_submitted: snapshot.detailsSubmitted,
      currently_due: snapshot.currentlyDue,
      past_due: snapshot.pastDue,
      disabled_reason: snapshot.disabledReason,
      requirements: (snapshot.rawRequirements ?? {}) as Json,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", row.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ConnectAccountRow;
}

export async function getOwnerConnectStatus(input: {
  organizationId: string;
  ownerUserId: string;
  canOnboard: boolean;
  client?: SupabaseClient<Database>;
}): Promise<ConnectStatusView> {
  if (!isFin003PhaseAEnabled()) {
    return emptyStatus("owner", false);
  }
  const client = await resolveClient(input.client);
  const row = await loadAccountRow(input.organizationId, "owner", input.ownerUserId, client);
  if (!row) return emptyStatus("owner", input.canOnboard);
  return rowToStatus(row, input.canOnboard);
}

export async function getOrgSettlementConnectStatus(input: {
  organizationId: string;
  canManage: boolean;
  client?: SupabaseClient<Database>;
}): Promise<ConnectStatusView> {
  if (!isFin003PhaseAEnabled()) {
    return emptyStatus("org_settlement", false);
  }
  const client = await resolveClient(input.client);
  const row = await loadAccountRow(input.organizationId, "org_settlement", null, client);
  if (!row) return emptyStatus("org_settlement", input.canManage);
  return rowToStatus(row, input.canManage);
}

export async function createOwnerOnboardingLink(input: {
  organizationId: string;
  ownerUserId: string;
  email?: string | null;
  returnPath?: string;
  refreshPath?: string;
  actorUserId: string;
  client?: SupabaseClient<Database>;
}): Promise<OnboardingLinkResult> {
  if (!isFin003PhaseAEnabled()) {
    throw new Error("FIN-003 Phase A is disabled");
  }

  const client = await resolveClient(input.client);
  const admin = await adminClient();
  const provider = getConnectProvider();
  const providerId = resolveDefaultConnectProviderId();
  const returnPath = assertSafeReturnPath(input.returnPath ?? "/portal/owner/financials");
  const refreshPath = assertSafeReturnPath(input.refreshPath ?? returnPath);

  let row = await loadAccountRow(input.organizationId, "owner", input.ownerUserId, client);
  if (!row) {
    const created = await provider.createExpressAccount({
      organizationId: input.organizationId,
      purpose: "owner",
      ownerUserId: input.ownerUserId,
      email: input.email ?? null
    });
    const { data, error } = await admin
      .from("connect_accounts")
      .insert({
        organization_id: input.organizationId,
        purpose: "owner",
        owner_user_id: input.ownerUserId,
        provider: providerId === "noop" ? "noop" : "stripe",
        external_account_id: created.externalAccountId,
        status: "onboarding"
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    row = data as ConnectAccountRow;
  }

  const link = await provider.createAccountLink({
    externalAccountId: row.external_account_id,
    returnUrl: toAbsoluteUrl(returnPath),
    refreshUrl: toAbsoluteUrl(refreshPath),
    linkType: row.details_submitted ? "account_update" : "account_onboarding"
  });

  await writeAudit(
    input.organizationId,
    "connect_account",
    row.id,
    "connect.onboarding_link.created",
    "Owner Connect onboarding link created",
    input.actorUserId,
    {
      purpose: "owner",
      externalAccountId: row.external_account_id,
      provider: row.provider
    },
    admin
  );

  return {
    url: link.url,
    expiresAt: link.expiresAt,
    externalAccountId: row.external_account_id,
    status: row.status
  };
}

export async function createOrgSettlementOnboardingLink(input: {
  organizationId: string;
  email?: string | null;
  returnPath?: string;
  refreshPath?: string;
  actorUserId: string;
  client?: SupabaseClient<Database>;
}): Promise<OnboardingLinkResult> {
  if (!isFin003PhaseAEnabled()) {
    throw new Error("FIN-003 Phase A is disabled");
  }

  const client = await resolveClient(input.client);
  const admin = await adminClient();
  const provider = getConnectProvider();
  const providerId = resolveDefaultConnectProviderId();
  const returnPath = assertSafeReturnPath(input.returnPath ?? "/settings/payouts");
  const refreshPath = assertSafeReturnPath(input.refreshPath ?? returnPath);

  let row = await loadAccountRow(input.organizationId, "org_settlement", null, client);
  if (!row) {
    const created = await provider.createExpressAccount({
      organizationId: input.organizationId,
      purpose: "org_settlement",
      email: input.email ?? null
    });
    const { data, error } = await admin
      .from("connect_accounts")
      .insert({
        organization_id: input.organizationId,
        purpose: "org_settlement",
        owner_user_id: null,
        provider: providerId === "noop" ? "noop" : "stripe",
        external_account_id: created.externalAccountId,
        status: "onboarding"
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    row = data as ConnectAccountRow;
  }

  const link = await provider.createAccountLink({
    externalAccountId: row.external_account_id,
    returnUrl: toAbsoluteUrl(returnPath),
    refreshUrl: toAbsoluteUrl(refreshPath),
    linkType: row.details_submitted ? "account_update" : "account_onboarding"
  });

  await writeAudit(
    input.organizationId,
    "connect_account",
    row.id,
    "connect.onboarding_link.created",
    "Org settlement Connect onboarding link created",
    input.actorUserId,
    {
      purpose: "org_settlement",
      externalAccountId: row.external_account_id,
      provider: row.provider
    },
    admin
  );

  return {
    url: link.url,
    expiresAt: link.expiresAt,
    externalAccountId: row.external_account_id,
    status: row.status
  };
}

/** Refresh mirrored status from provider (e.g. after Account Link return). */
export async function refreshConnectAccountStatus(input: {
  organizationId: string;
  purpose: ConnectAccountPurpose;
  ownerUserId?: string | null;
  actorUserId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<ConnectStatusView> {
  if (!isFin003PhaseAEnabled()) {
    return emptyStatus(input.purpose, false);
  }

  const client = await resolveClient(input.client);
  const admin = await adminClient();
  const row = await loadAccountRow(
    input.organizationId,
    input.purpose,
    input.purpose === "owner" ? (input.ownerUserId ?? null) : null,
    client
  );
  if (!row) {
    return emptyStatus(input.purpose, true);
  }

  const provider = getConnectProvider(row.provider === "noop" ? "noop" : undefined);
  const snapshot = await provider.getAccount(row.external_account_id);
  const updated = await persistSnapshot(row, snapshot, admin);

  await writeAudit(
    input.organizationId,
    "connect_account",
    row.id,
    "connect.status.synced",
    `Connect status synced to ${snapshot.status}`,
    input.actorUserId ?? null,
    { status: snapshot.status, externalAccountId: row.external_account_id },
    admin
  );

  return rowToStatus(updated, true);
}

export async function applyConnectProviderWebhook(
  providerId: string,
  payload: unknown,
  headers: Record<string, string>
): Promise<{ processed: number; ignored: number; duplicate: boolean }> {
  if (!isFin003PhaseAEnabled()) {
    return { processed: 0, ignored: 0, duplicate: false };
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const typeRaw = String(body["type"] ?? "");
  if (typeRaw.startsWith("transfer.")) {
    return applyTransferWebhookEvents(providerId, payload, headers);
  }

  const provider = getConnectProvider(providerId);
  const events = await provider.parseAccountWebhook(payload, headers);
  const admin = await adminClient();
  let processed = 0;
  let ignored = 0;
  let duplicate = false;

  for (const event of events) {
    const { data: existing } = await admin
      .from("connect_webhook_events")
      .select("id, status")
      .eq("provider", provider.id)
      .eq("external_event_id", event.externalEventId)
      .maybeSingle();

    if (existing) {
      duplicate = true;
      continue;
    }

    const insertPayload = {
      provider: provider.id,
      external_event_id: event.externalEventId,
      event_type: event.type,
      payload: (payload ?? {}) as Json,
      status: event.ignored || event.type === "ignored" ? "ignored" : "received"
    };

    const { data: stored, error: storeError } = await admin
      .from("connect_webhook_events")
      .insert(insertPayload)
      .select("id")
      .single();
    if (storeError) throw new Error(storeError.message);

    if (event.ignored || event.type === "ignored" || !event.externalAccountId) {
      ignored += 1;
      await admin
        .from("connect_webhook_events")
        .update({ status: "ignored", processed_at: new Date().toISOString() })
        .eq("id", stored.id);
      continue;
    }

    const { data: account } = await admin
      .from("connect_accounts")
      .select("*")
      .eq("external_account_id", event.externalAccountId)
      .maybeSingle();

    if (!account) {
      ignored += 1;
      await admin
        .from("connect_webhook_events")
        .update({ status: "ignored", processed_at: new Date().toISOString() })
        .eq("id", stored.id);
      continue;
    }

    const row = account as ConnectAccountRow;
    if (event.type === "account_deauthorized") {
      await persistSnapshot(
        row,
        {
          status: "disabled",
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: row.details_submitted,
          currentlyDue: [],
          pastDue: [],
          disabledReason: "application_deauthorized"
        },
        admin
      );
    } else {
      const snapshot = await provider.getAccount(event.externalAccountId);
      await persistSnapshot(row, snapshot, admin);
    }

    await admin
      .from("connect_webhook_events")
      .update({
        status: "processed",
        organization_id: row.organization_id,
        connect_account_id: row.id,
        processed_at: new Date().toISOString()
      })
      .eq("id", stored.id);

    await writeAudit(
      row.organization_id,
      "connect_account",
      row.id,
      "connect.webhook.account_updated",
      `Connect webhook applied: ${event.type}`,
      null,
      { externalEventId: event.externalEventId, type: event.type },
      admin
    );

    processed += 1;
  }

  return { processed, ignored, duplicate };
}

/**
 * Phase B — PM read-only roster of owner Connect eligibility (no KYC documents, no transfers).
 */
export async function listOwnerConnectStatusesForOrg(input: {
  organizationId: string;
  client?: SupabaseClient<Database>;
}): Promise<OwnerConnectRosterRow[]> {
  if (!isFin003PhaseAEnabled()) return [];

  const client = await resolveClient(input.client);
  const admin = await adminClient();

  const { data: memberships, error: membershipError } = await admin
    .from("organization_memberships")
    .select("user_id, roles, status")
    .eq("organization_id", input.organizationId)
    .eq("status", "active");
  if (membershipError) throw new Error(membershipError.message);

  const ownerUserIds: string[] = (memberships ?? [])
    .filter((row: { roles?: string[] }) => Array.isArray(row.roles) && row.roles.includes("property_owner"))
    .map((row: { user_id: string }) => String(row.user_id));

  if (ownerUserIds.length === 0) return [];

  const { data: accounts, error: accountsError } = await client
    .from("connect_accounts")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("purpose", "owner")
    .in("owner_user_id", ownerUserIds);
  if (accountsError) throw new Error(accountsError.message);

  const accountByOwner = new Map<string, ConnectAccountRow>();
  for (const row of (accounts ?? []) as ConnectAccountRow[]) {
    if (row.owner_user_id) accountByOwner.set(row.owner_user_id, row);
  }

  const { data: profiles } = await admin
    .from("user_profiles")
    .select("user_id, display_name, contact_email")
    .in("user_id", ownerUserIds);

  const profileByUser = new Map<
    string,
    { display_name?: string | null; contact_email?: string | null }
  >();
  for (const profile of profiles ?? []) {
    profileByUser.set(String((profile as { user_id: string }).user_id), profile as {
      display_name?: string | null;
      contact_email?: string | null;
    });
  }

  return ownerUserIds.map((ownerUserId: string) => {
    const account = accountByOwner.get(ownerUserId);
    const profile = profileByUser.get(ownerUserId);
    if (!account) {
      const guidance = remediationGuidance({
        status: "not_started",
        currentlyDue: [],
        pastDue: [],
        disabledReason: null,
        purpose: "owner"
      });
      return {
        ownerUserId,
        displayName: profile?.display_name?.trim() || "Owner",
        email: profile?.contact_email ?? null,
        status: "not_started" as const,
        statusLabel: eligibilityLabel("not_started"),
        remediationRequired: guidance.remediationRequired,
        nextStepMessage: guidance.nextStepMessage,
        externalAccountId: null,
        lastSyncedAt: null
      };
    }
    const view = rowToStatus(account, false);
    return {
      ownerUserId,
      displayName: profile?.display_name?.trim() || "Owner",
      email: profile?.contact_email ?? null,
      status: view.status,
      statusLabel: view.statusLabel,
      remediationRequired: view.remediationRequired,
      nextStepMessage: view.nextStepMessage,
      externalAccountId: view.externalAccountId,
      lastSyncedAt: view.lastSyncedAt
    };
  });
}

/**
 * Phase B — optional PM nudge via Notification Service. Never claims a payout was sent.
 */
export async function sendOwnerOnboardingNudge(input: {
  organizationId: string;
  ownerUserId: string;
  actorUserId: string;
  client?: SupabaseClient<Database>;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!isFin003PhaseAEnabled()) {
    throw new Error("FIN-003 Phase A is disabled");
  }

  const client = await resolveClient(input.client);
  const admin = await adminClient();
  const status = await getOwnerConnectStatus({
    organizationId: input.organizationId,
    ownerUserId: input.ownerUserId,
    canOnboard: true,
    client
  });

  if (status.status === "eligible") {
    return { sent: false, reason: "Owner is already eligible — nudge not needed." };
  }
  if (status.status === "disabled") {
    return { sent: false, reason: "Owner Connect account is disabled." };
  }

  // Day-bucketed idempotency so PM cannot spam.
  const dayKey = new Date().toISOString().slice(0, 10);
  await notify(
    {
      organizationId: input.organizationId,
      category: "system",
      priority: "normal",
      title: "Finish payout connection",
      body: "Your property manager asked you to finish Stripe Connect verification for owner payouts. This does not send money — it only completes eligibility setup.",
      eventKey: `connect.onboarding_nudge:${input.ownerUserId}:${dayKey}`,
      recipientUserIds: [input.ownerUserId],
      href: "/portal/owner/financials",
      sourceEntityType: "connect_account",
      sourceEntityId: status.externalAccountId,
      actorUserId: input.actorUserId,
      channels: { inApp: true, push: false, email: false },
      metadata: {
        purpose: "owner_onboarding_nudge",
        status: status.status
      }
    },
    client
  );

  await writeAudit(
    input.organizationId,
    "connect_account",
    null,
    "connect.onboarding_nudge.sent",
    "PM sent owner Connect onboarding nudge",
    input.actorUserId,
    {
      ownerUserId: input.ownerUserId,
      status: status.status,
      dayKey
    },
    admin
  );

  return { sent: true };
}

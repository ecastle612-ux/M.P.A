import {
  isComplimentaryGrantStatus,
  isComplimentaryGrantType,
  isComplimentaryLimitMode,
  isProductSku,
  type ComplimentaryGrant,
  type ComplimentaryGrantEvent
} from "@mpa/shared";
import { createMemoryComplimentaryGrantStore, type ComplimentaryGrantStore } from "./store";

type GrantRow = {
  id: string;
  recipient_email: string;
  grant_type: string;
  product_sku: string;
  status: string;
  expires_at: string | null;
  limit_mode: string;
  custom_unit_limit: number | null;
  organization_id: string | null;
  organization_name: string | null;
  user_id: string | null;
  claim_token_hash: string | null;
  claim_expires_at: string | null;
  granted_by: string | null;
  converted_at: string | null;
  expiry_notice_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  grant_id: string;
  action: string;
  actor_user_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

function fromRow(row: GrantRow): ComplimentaryGrant | null {
  if (!isComplimentaryGrantType(row.grant_type) || !isProductSku(row.product_sku)) {
    return null;
  }
  if (!isComplimentaryGrantStatus(row.status) || !isComplimentaryLimitMode(row.limit_mode)) {
    return null;
  }
  return {
    id: row.id,
    recipientEmail: row.recipient_email,
    grantType: row.grant_type,
    productSku: row.product_sku,
    status: row.status,
    expiresAt: row.expires_at,
    limitMode: row.limit_mode,
    customUnitLimit: row.custom_unit_limit,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    userId: row.user_id,
    claimTokenHash: row.claim_token_hash,
    claimExpiresAt: row.claim_expires_at,
    grantedBy: row.granted_by ?? "unknown",
    convertedAt: row.converted_at,
    expiryNoticeSentAt: row.expiry_notice_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toRow(grant: ComplimentaryGrant): Record<string, unknown> {
  return {
    id: grant.id,
    recipient_email: grant.recipientEmail,
    grant_type: grant.grantType,
    product_sku: grant.productSku,
    status: grant.status,
    expires_at: grant.expiresAt,
    limit_mode: grant.limitMode,
    custom_unit_limit: grant.customUnitLimit,
    organization_id: grant.organizationId,
    organization_name: grant.organizationName,
    user_id: grant.userId,
    claim_token_hash: grant.claimTokenHash,
    claim_expires_at: grant.claimExpiresAt,
    granted_by: grant.grantedBy,
    converted_at: grant.convertedAt,
    expiry_notice_sent_at: grant.expiryNoticeSentAt,
    created_at: grant.createdAt,
    updated_at: grant.updatedAt
  };
}

type DbClient = {
  // Supabase query builders are thenables, not Promise instances; keep this
  // adapter loose so Production next build can persist grants.
  from: (table: string) => any;
};

export async function loadComplimentaryStoreFromDb(client: DbClient): Promise<ComplimentaryGrantStore> {
  const store = createMemoryComplimentaryGrantStore();
  try {
    const grantsQuery = client.from("complimentary_access_grants").select("*");
    const { data } = grantsQuery.order
      ? await grantsQuery.order("created_at", { ascending: false })
      : { data: [] };
    for (const row of (data as GrantRow[] | null) ?? []) {
      const grant = fromRow(row);
      if (grant) {
        store.save(grant);
      }
    }
    const eventsQuery = client.from("complimentary_access_events").select("*");
    const { data: eventRows } = eventsQuery.order
      ? await eventsQuery.order("created_at", { ascending: true })
      : { data: [] };
    for (const row of (eventRows as EventRow[] | null) ?? []) {
      store.appendEvent({
        id: row.id,
        grantId: row.grant_id,
        action: row.action,
        actorUserId: row.actor_user_id,
        payload: row.payload ?? {},
        createdAt: row.created_at
      });
    }
  } catch {
    // Tests and missing-table environments keep the empty memory store.
  }
  return store;
}

export async function persistComplimentaryGrant(
  client: DbClient,
  grant: ComplimentaryGrant
): Promise<{ id: string; error: string | null }> {
  const { error } = await client.from("complimentary_access_grants").upsert(toRow(grant), {
    onConflict: "id"
  });
  return { id: grant.id, error: error?.message ?? null };
}

export async function persistComplimentaryEvent(
  client: DbClient,
  event: ComplimentaryGrantEvent
): Promise<void> {
  await client.from("complimentary_access_events").upsert(
    {
      id: event.id,
      grant_id: event.grantId,
      action: event.action,
      actor_user_id: event.actorUserId,
      payload: event.payload,
      created_at: event.createdAt
    },
    { onConflict: "id" }
  );
}

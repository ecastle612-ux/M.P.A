/**
 * CORE-004 Phase 1 — Property Lifecycle transitions (server).
 * Enforces documented edges, gates, audit, ops events, activation automation.
 */

import type { Database, Json } from "@mpa/supabase";
import { createAuthServerComponentClient } from "../auth/server";
import { emitOpsDomainEvent } from "../ops/emit";
import type { OpsDbClient } from "../ops/types";
import { notify } from "../notifications/service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedDb = { from: (table: string) => any };
import {
  canTransitionLifecycle,
  evaluateAdvanceGates,
  isPropertyLifecycleStage,
  lifecycleStageToLegacyStatus,
  PROPERTY_LIFECYCLE_DEFINITIONS,
  PROPERTY_LIFECYCLE_STAGES,
  type PropertyLifecycleStage
} from "./lifecycle";
import type { PropertyListItem, PropertyRecord } from "./contracts";
import { legacyStatusToLifecycleStage } from "./lifecycle";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export const PROPERTY_LIFECYCLE_SELECT =
  "id, organization_id, name, code, property_type, status, lifecycle_stage, description, address_line_1, address_line_2, city, state_region, postal_code, country_code, timezone, latitude, longitude, ownership_entity_name, owner_contact_name, owner_contact_email, owner_contact_phone, cover_image_url, metadata, created_at, updated_at, archived_at, deleted_at";

type PropertyRow = {
  id: string;
  organization_id: string;
  name: string;
  code: string | null;
  property_type: PropertyRecord["propertyType"];
  status: PropertyRecord["status"];
  lifecycle_stage?: string | null;
  description: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state_region: string;
  postal_code: string;
  country_code: string;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  ownership_entity_name: string | null;
  owner_contact_name: string | null;
  owner_contact_email: string | null;
  owner_contact_phone: string | null;
  cover_image_url: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

function toPropertyRecord(row: PropertyRow): PropertyRecord {
  const stage = isPropertyLifecycleStage(row.lifecycle_stage)
    ? row.lifecycle_stage
    : legacyStatusToLifecycleStage(row.status);
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    code: row.code,
    propertyType: row.property_type,
    status: row.status,
    lifecycleStage: stage,
    description: row.description,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    stateRegion: row.state_region,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    timezone: row.timezone,
    latitude: row.latitude,
    longitude: row.longitude,
    ownershipEntityName: row.ownership_entity_name,
    ownerContactName: row.owner_contact_name,
    ownerContactEmail: row.owner_contact_email,
    ownerContactPhone: row.owner_contact_phone,
    coverImageUrl: row.cover_image_url,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

async function loadProperty(
  organizationId: string,
  propertyId: string,
  supabase: SupabaseClientType
): Promise<PropertyRecord | null> {
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_LIFECYCLE_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", propertyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPropertyRecord(data as PropertyRow) : null;
}

export type TransitionLifecycleInput = {
  organizationId: string;
  propertyId: string;
  actorUserId: string;
  toStage: PropertyLifecycleStage;
  reason?: string | null;
  /** When true, skip owner/unit gates (restore / system only). */
  force?: boolean;
};

export type TransitionLifecycleResult = {
  property: PropertyRecord;
  fromStage: PropertyLifecycleStage;
  toStage: PropertyLifecycleStage;
  automation: Record<string, unknown>;
};

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

async function countUnits(
  organizationId: string,
  propertyId: string,
  supabase: SupabaseClientType
): Promise<number> {
  const { count, error } = await supabase
    .from("units")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function buildActivationAutomation(nowIso: string): Record<string, unknown> {
  return {
    defaultFolders: ["leases", "maintenance", "financial", "inspections", "communications"],
    dashboardsInitialized: true,
    assistantEnabled: true,
    operationalTimelineStartedAt: nowIso,
    notificationsInitialized: true,
    onboardingChecklist: [
      { id: "units", label: "Units configured", done: true },
      { id: "address", label: "Address verified", done: true },
      { id: "activated", label: "Property activated", done: true }
    ]
  };
}

function buildTurnoverAutomation(): Record<string, unknown> {
  return {
    turnoverChecklist: [
      { id: "inspect", label: "Unit inspection", done: false },
      { id: "repairs", label: "Repairs complete", done: false },
      { id: "clean", label: "Clean / make-ready", done: false },
      { id: "photos", label: "Photos updated", done: false },
      { id: "list", label: "Ready to lease", done: false }
    ]
  };
}

export async function transitionPropertyLifecycle(
  input: TransitionLifecycleInput,
  client?: SupabaseClientType
): Promise<TransitionLifecycleResult> {
  const supabase = await resolveClient(client);
  const property = await loadProperty(input.organizationId, input.propertyId, supabase);
  if (!property) {
    throw new Error("Property not found.");
  }

  const fromStage = property.lifecycleStage;
  const toStage = input.toStage;

  if (fromStage === toStage) {
    return { property, fromStage, toStage, automation: {} };
  }

  if (!canTransitionLifecycle(fromStage, toStage)) {
    throw new Error(
      `Transition ${fromStage} → ${toStage} is not allowed. No undocumented transitions.`
    );
  }

  const unitCount = await countUnits(input.organizationId, input.propertyId, supabase);
  const gate = input.force
    ? ({ ok: true } as const)
    : evaluateAdvanceGates(toStage, {
        unitCount,
        hasOwnerContact: Boolean(
          property.ownershipEntityName ||
            property.ownerContactName ||
            property.ownerContactEmail
        ),
        addressComplete: Boolean(
          property.addressLine1 && property.city && property.stateRegion && property.postalCode
        )
      });
  if (!gate.ok) {
    throw new Error(gate.message);
  }

  const nowIso = new Date().toISOString();
  const definition = PROPERTY_LIFECYCLE_DEFINITIONS[toStage];
  let automation: Record<string, unknown> = {};
  const nextMetadata: Record<string, unknown> = { ...property.metadata };
  const priorLifecycle =
    typeof nextMetadata["lifecycle"] === "object" && nextMetadata["lifecycle"]
      ? (nextMetadata["lifecycle"] as Record<string, unknown>)
      : {};

  if (toStage === "operational" && fromStage === "activation") {
    automation = buildActivationAutomation(nowIso);
    nextMetadata["lifecycle"] = { ...priorLifecycle, ...automation };
  }
  if (toStage === "turnover") {
    automation = buildTurnoverAutomation();
    nextMetadata["lifecycle"] = { ...priorLifecycle, ...automation };
  }
  if (toStage === "onboarding") {
    automation = {
      onboardingChecklist: [
        { id: "profile", label: "Property profile complete", done: false },
        { id: "owner", label: "Owner contact verified", done: false },
        { id: "units", label: "Units planned", done: false }
      ]
    };
    nextMetadata["lifecycle"] = { ...priorLifecycle, ...automation };
  }

  const legacyStatus =
    toStage === "operational" || toStage === "occupancy" || toStage === "turnover"
      ? "active"
      : lifecycleStageToLegacyStatus(toStage);

  const patch: Database["public"]["Tables"]["properties"]["Update"] = {
    lifecycle_stage: toStage,
    status: legacyStatus,
    metadata: nextMetadata as Json,
    updated_by: input.actorUserId,
    updated_at: nowIso
  };

  if (toStage === "archived") {
    patch.archived_at = nowIso;
    patch.archived_by = input.actorUserId;
    patch.status = "archived";
  }
  if (fromStage === "archived" && toStage === "operational") {
    patch.archived_at = null;
    patch.archived_by = null;
    patch.status = "active";
  }
  if (toStage === "disposition") {
    patch.status = "inactive";
  }

  const { data, error } = await supabase
    .from("properties")
    .update(patch)
    .eq("organization_id", input.organizationId)
    .eq("id", input.propertyId)
    .is("deleted_at", null)
    .select(PROPERTY_LIFECYCLE_SELECT)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Lifecycle transition failed.");
  }

  const { error: auditError } = await (supabase as unknown as UntypedDb)
    .from("property_lifecycle_events")
    .insert({
      organization_id: input.organizationId,
      property_id: input.propertyId,
      from_stage: fromStage,
      to_stage: toStage,
      actor_user_id: input.actorUserId,
      reason: input.reason ?? null,
      automation: automation as Json,
      payload: {
        definition: definition.label,
        legacyStatus
      } as Json
    });
  if (auditError) {
    throw new Error(auditError.message ?? "Lifecycle audit insert failed.");
  }

  // Domain bus — timeline + search of ops activity
  try {
    await emitOpsDomainEvent(supabase as unknown as OpsDbClient, {
      eventType: "property.lifecycle.transitioned",
      organizationId: input.organizationId,
      actor: { actor_type: "user", principal_id: input.actorUserId },
      subject: { type: "property", id: input.propertyId },
      propertyId: input.propertyId,
      href: `/properties/${input.propertyId}`,
      summary: `${property.name}: ${fromStage} → ${toStage}`,
      payload: {
        fromStage,
        toStage,
        propertyName: property.name,
        reason: input.reason ?? null,
        notifyCategory: "residents"
      },
      visibility: "ops",
      sensitivity: "normal"
    });
  } catch {
    // Bus may be unavailable in local/unit contexts — lifecycle audit row is source of truth.
  }

  if (toStage === "operational" && fromStage === "activation") {
    try {
      await emitOpsDomainEvent(supabase as unknown as OpsDbClient, {
        eventType: "property.activated",
        organizationId: input.organizationId,
        actor: { actor_type: "user", principal_id: input.actorUserId },
        subject: { type: "property", id: input.propertyId },
        propertyId: input.propertyId,
        href: `/properties/${input.propertyId}`,
        summary: `${property.name} activated`,
        payload: {
          propertyName: property.name,
          automation
        },
        visibility: "ops",
        sensitivity: "normal"
      });
    } catch {
      /* optional bus */
    }
  }

  if (toStage === "archived") {
    try {
      await emitOpsDomainEvent(supabase as unknown as OpsDbClient, {
        eventType: "property.archived",
        organizationId: input.organizationId,
        actor: { actor_type: "user", principal_id: input.actorUserId },
        subject: { type: "property", id: input.propertyId },
        propertyId: input.propertyId,
        href: `/properties/${input.propertyId}`,
        summary: `${property.name} archived`,
        payload: {
          propertyName: property.name
        },
        visibility: "ops",
        sensitivity: "normal"
      });
    } catch {
      /* optional bus */
    }
  }

  // In-app notification for material transitions
  const notifyStages: PropertyLifecycleStage[] = [
    "activation",
    "operational",
    "turnover",
    "disposition",
    "archived"
  ];
  if (notifyStages.includes(toStage)) {
    try {
      await notify({
        organizationId: input.organizationId,
        recipientUserIds: [input.actorUserId],
        category: "residents",
        priority: toStage === "disposition" || toStage === "archived" ? "high" : "normal",
        title: `${property.name}: ${definition.label}`,
        body: `Lifecycle moved from ${PROPERTY_LIFECYCLE_DEFINITIONS[fromStage].label} to ${definition.label}.`,
        eventKey: `property.lifecycle.${toStage}.${input.propertyId}.${nowIso}`,
        propertyId: input.propertyId,
        href: `/properties/${input.propertyId}`,
        sourceEntityType: "property",
        sourceEntityId: input.propertyId,
        actorUserId: input.actorUserId,
        channels: { inApp: true }
      });
    } catch {
      /* notification optional in constrained envs */
    }
  }

  const updated = await loadProperty(input.organizationId, input.propertyId, supabase);
  if (!updated) {
    throw new Error("Property missing after transition.");
  }

  return { property: updated, fromStage, toStage, automation };
}

export async function listPropertyLifecycleEvents(
  organizationId: string,
  propertyId: string,
  client?: SupabaseClientType
): Promise<
  Array<{
    id: string;
    fromStage: PropertyLifecycleStage | null;
    toStage: PropertyLifecycleStage;
    actorUserId: string | null;
    reason: string | null;
    createdAt: string;
  }>
> {
  const supabase = await resolveClient(client);
  const { data, error } = await (supabase as unknown as UntypedDb)
    .from("property_lifecycle_events")
    .select("id, from_stage, to_stage, actor_user_id, reason, created_at")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row["id"]),
    fromStage: isPropertyLifecycleStage(row["from_stage"]) ? row["from_stage"] : null,
    toStage: isPropertyLifecycleStage(row["to_stage"]) ? row["to_stage"] : "prospect",
    actorUserId: (row["actor_user_id"] as string | null) ?? null,
    reason: (row["reason"] as string | null) ?? null,
    createdAt: String(row["created_at"])
  }));
}

export function summarizePortfolioLifecycle(
  items: Array<Pick<PropertyListItem, "lifecycleStage">>
): Record<PropertyLifecycleStage, number> {
  const counts = Object.fromEntries(PROPERTY_LIFECYCLE_STAGES.map((stage) => [stage, 0])) as Record<
    PropertyLifecycleStage,
    number
  >;
  for (const item of items) {
    counts[item.lifecycleStage] = (counts[item.lifecycleStage] ?? 0) + 1;
  }
  return counts;
}

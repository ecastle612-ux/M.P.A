import type { SupabaseClient } from "@supabase/supabase-js";
import {
  suggestNextUnitLabel,
  unitArchiveBlockReason,
  unitStatusEditBlockReason,
  type CreatePropertyUnitInput,
  type UpdatePropertyUnitInput
} from "@mpa/shared";
import { emitPropertyEvent, writePropertyAudit } from "./events-audit";
import { getPortfolioProperty } from "./property-catalog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type PropertyUnitRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_label: string;
  status: string;
  created_at?: string;
};

async function loadUnitRelationships(
  supabase: Db,
  organizationId: string,
  unitId: string
): Promise<{ hasResident: boolean; hasActiveLease: boolean; openMaintenanceCount: number }> {
  const [{ count: residentCount }, { count: leaseCount }, { count: openMaintenanceCount }] =
    await Promise.all([
      supabase
        .from("pm_residents")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("unit_id", unitId),
      supabase
        .from("lease_agreements")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("unit_id", unitId)
        .eq("status", "active"),
      supabase
        .from("maintenance_work_orders")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("unit_id", unitId)
        .in("status", ["open", "triaged", "assigned", "in_progress"])
    ]);

  return {
    hasResident: (residentCount ?? 0) > 0,
    hasActiveLease: (leaseCount ?? 0) > 0,
    openMaintenanceCount: openMaintenanceCount ?? 0
  };
}

async function getUnitInOrg(
  supabase: Db,
  organizationId: string,
  propertyId: string,
  unitId: string
): Promise<PropertyUnitRow | null> {
  const { data, error } = await supabase
    .from("property_units")
    .select("id, organization_id, property_id, unit_label, status, created_at")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .eq("id", unitId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as PropertyUnitRow | null) ?? null;
}

export async function suggestUnitLabelForProperty(
  supabase: Db,
  organizationId: string,
  propertyId: string
): Promise<string> {
  const property = await getPortfolioProperty(supabase, organizationId, propertyId);
  if (!property) {
    throw new Error("Property not found");
  }
  const labels = (property.property_units ?? []).map((unit) => unit.unit_label);
  return suggestNextUnitLabel(labels);
}

export async function createPropertyUnit(
  supabase: Db,
  organizationId: string,
  actorId: string,
  propertyId: string,
  input: CreatePropertyUnitInput
): Promise<PropertyUnitRow> {
  const property = await getPortfolioProperty(supabase, organizationId, propertyId);
  if (!property) {
    throw new Error("Property not found");
  }

  const label = input.unitLabel.trim();
  const { data: unit, error } = await supabase
    .from("property_units")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      unit_label: label,
      status: "available"
    })
    .select("id, organization_id, property_id, unit_label, status, created_at")
    .single();
  if (error) {
    if (error.message.toLowerCase().includes("duplicate") || error.code === "23505") {
      throw new Error(`Unit label "${label}" already exists on this property.`);
    }
    throw new Error(error.message);
  }

  const payload = {
    propertyId,
    unitId: unit.id,
    unitLabel: unit.unit_label,
    status: unit.status,
    source: "pm.properties.units"
  };

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "unit.created",
    aggregateType: "property_properties",
    aggregateId: propertyId,
    payload
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "unit.created",
    entityType: "property_units",
    entityId: unit.id,
    payload
  });

  return unit as PropertyUnitRow;
}

export async function updatePropertyUnit(
  supabase: Db,
  organizationId: string,
  actorId: string,
  propertyId: string,
  unitId: string,
  input: UpdatePropertyUnitInput
): Promise<PropertyUnitRow> {
  const existing = await getUnitInOrg(supabase, organizationId, propertyId, unitId);
  if (!existing) {
    throw new Error("Unit not found");
  }

  const relationships = await loadUnitRelationships(supabase, organizationId, unitId);
  if (input.status) {
    const blocked = unitStatusEditBlockReason(existing.status, input.status, relationships);
    if (blocked) {
      throw new Error(blocked);
    }
  }

  const nextLabel = input.unitLabel?.trim();
  const patch: { unit_label?: string; status?: string } = {};
  if (nextLabel && nextLabel !== existing.unit_label) {
    patch.unit_label = nextLabel;
  }
  if (input.status && input.status !== existing.status) {
    patch.status = input.status;
  }
  if (Object.keys(patch).length === 0) {
    return existing;
  }

  const { data: unit, error } = await supabase
    .from("property_units")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .eq("id", unitId)
    .select("id, organization_id, property_id, unit_label, status, created_at")
    .single();
  if (error) {
    if (error.message.toLowerCase().includes("duplicate") || error.code === "23505") {
      throw new Error(`Unit label "${nextLabel}" already exists on this property.`);
    }
    throw new Error(error.message);
  }

  const payload = {
    propertyId,
    unitId,
    before: { unitLabel: existing.unit_label, status: existing.status },
    after: { unitLabel: unit.unit_label, status: unit.status },
    relationships,
    source: "pm.properties.units"
  };

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "unit.updated",
    aggregateType: "property_properties",
    aggregateId: propertyId,
    payload
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "unit.updated",
    entityType: "property_units",
    entityId: unitId,
    payload
  });

  return unit as PropertyUnitRow;
}

/**
 * Archive = set status offline (existing CHECK). Does not hard-delete (resident RESTRICT).
 * Offline units remain in plan capacity counts.
 */
export async function archivePropertyUnit(
  supabase: Db,
  organizationId: string,
  actorId: string,
  propertyId: string,
  unitId: string
): Promise<PropertyUnitRow> {
  const existing = await getUnitInOrg(supabase, organizationId, propertyId, unitId);
  if (!existing) {
    throw new Error("Unit not found");
  }

  const relationships = await loadUnitRelationships(supabase, organizationId, unitId);
  const blocked = unitArchiveBlockReason({
    status: existing.status,
    hasResident: relationships.hasResident,
    hasActiveLease: relationships.hasActiveLease,
    openMaintenanceCount: relationships.openMaintenanceCount
  });
  if (blocked) {
    throw new Error(blocked);
  }

  const { data: unit, error } = await supabase
    .from("property_units")
    .update({ status: "offline" })
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .eq("id", unitId)
    .select("id, organization_id, property_id, unit_label, status, created_at")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const payload = {
    propertyId,
    unitId,
    unitLabel: unit.unit_label,
    status: "offline",
    openMaintenanceCount: relationships.openMaintenanceCount,
    source: "pm.properties.units"
  };

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "unit.archived",
    aggregateType: "property_properties",
    aggregateId: propertyId,
    payload
  });
  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "unit.archived",
    entityType: "property_units",
    entityId: unitId,
    payload
  });

  return unit as PropertyUnitRow;
}

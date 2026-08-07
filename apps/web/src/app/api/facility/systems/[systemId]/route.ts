import { NextResponse } from "next/server";
import { updateFacilitySystemInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import {
  buildSystemAssistantRecommendation,
  getFacilitySystem,
  listFacilitySystemTimeline,
  updateFacilitySystem
} from "../../../../../lib/facility/system-service";

type Params = { params: Promise<{ systemId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.systems:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { systemId } = await context.params;
  try {
    const system = await getFacilitySystem(authz.supabase, authz.organizationId, systemId);
    if (!system) {
      return NextResponse.json({ error: "Building system not found" }, { status: 404 });
    }
    const timeline = await listFacilitySystemTimeline(
      authz.supabase,
      authz.organizationId,
      systemId
    );
    const propertyId = system.facility_sites?.property_id ?? null;
    return NextResponse.json({
      system,
      timeline: timeline.map((event) => ({
        id: event.id as string,
        title: String(event.event_type),
        detail:
          typeof (event.payload as { name?: string } | null)?.name === "string"
            ? `${(event.payload as { name: string }).name}`
            : "System lifecycle event",
        occurredAt: event.created_at as string,
        kind: event.event_type as string
      })),
      assistantRecommendation: buildSystemAssistantRecommendation(system),
      siteLink: {
        href: `/facility/sites/${system.site_id}`,
        label: system.facility_sites?.name ?? "Facility site"
      },
      propertyLink: propertyId
        ? {
            href: `/pm/properties/${propertyId}`,
            label: system.facility_sites?.property_properties?.name ?? "Property record"
          }
        : null,
      documentsHref: "/shared/documents"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load building system" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.systems:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { systemId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = updateFacilitySystemInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const system = await updateFacilitySystem(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      systemId,
      parsed.data
    );
    return NextResponse.json({ system });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update building system" },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { updateFacilitySiteInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../../lib/facility/authz";
import {
  archiveFacilitySite,
  getFacilitySite,
  listFacilitySiteTimeline,
  updateFacilitySite
} from "../../../../../lib/facility/site-service";

type Params = { params: Promise<{ siteId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.sites:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { siteId } = await context.params;
  try {
    const site = await getFacilitySite(authz.supabase, authz.organizationId, siteId);
    if (!site) {
      return NextResponse.json({ error: "Facility site not found" }, { status: 404 });
    }
    const timeline = await listFacilitySiteTimeline(authz.supabase, authz.organizationId, siteId);
    return NextResponse.json({
      site,
      timeline: timeline.map((event) => ({
        id: event.id as string,
        title: String(event.event_type),
        detail:
          typeof (event.payload as { name?: string } | null)?.name === "string"
            ? `${(event.payload as { name: string }).name}`
            : "Facility site event",
        occurredAt: event.created_at as string,
        kind: event.event_type as string
      })),
      assistantRecommendation:
        site.status === "active"
          ? "Your facility site is ready. Review Facility Overview."
          : site.status === "draft"
            ? "Activate your facility site."
            : "This site is archived.",
      propertyLink: site.property_id
        ? { href: `/pm/properties/${site.property_id}`, label: site.property_properties?.name ?? "Property record" }
        : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load facility site" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.sites:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { siteId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = updateFacilitySiteInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const site = await updateFacilitySite(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      siteId,
      parsed.data
    );
    return NextResponse.json({ site });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update facility site" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: Params) {
  const authz = await requireFacilityPermission("facility.sites:write");
  if ("error" in authz) {
    return authz.error;
  }

  const { siteId } = await context.params;
  try {
    const site = await archiveFacilitySite(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      siteId
    );
    return NextResponse.json({ site });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to archive facility site" },
      { status: 400 }
    );
  }
}

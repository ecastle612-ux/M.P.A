import { NextResponse } from "next/server";
import {
  PARTNER_OPPORTUNITY_NO_GUARANTEE_COPY,
  PARTNER_OPPORTUNITY_NO_MATCH_COPY,
  PARTNER_OPPORTUNITY_SELECT_COPY,
  PARTNER_SERVICE_CATEGORY_LABELS,
  PARTNER_TYPE_LABELS
} from "@mpa/shared";
import {
  closeOrCancelOpportunity,
  createAndRouteOpportunity,
  createWorkOrderFromOpportunity,
  getOrganizationOpportunity,
  getPartnerOpportunity,
  listAdminOpportunityOversight,
  listOrganizationOpportunities,
  listPartnerOpportunities,
  respondToOpportunity,
  rerouteOpportunity,
  selectInterestedPartner
} from "./opportunity-service";
import { loadOpportunityDeps, requireServiceNetworkRead, requireServiceNetworkWrite } from "./opportunity-deps";
import { requirePartnerServicesRead, requirePartnerServicesWrite } from "./authz";
import { loadPartnerDeps } from "./runtime";

function rejectClientOverride(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  for (const key of [
    "organization_id",
    "organizationId",
    "selected_partner_id",
    "selectedPartnerId",
    "routed_partner_ids",
    "routedPartnerIds",
    "work_order_id",
    "property_id"
  ]) {
    if (key in record) return "Those fields are server-authoritative.";
  }
  return null;
}

export async function handleListCreateOpportunities(request: Request, surface: "residential" | "facility") {
  if (request.method === "GET") {
    const auth = await requireServiceNetworkRead(surface);
    if ("error" in auth) return auth.error;
    const deps = await loadOpportunityDeps();
    const properties = await deps.listProperties(auth.organizationId);
    const items = await listOrganizationOpportunities(auth.organizationId, deps);
    return NextResponse.json({
      surface,
      noMatchCopy: PARTNER_OPPORTUNITY_NO_MATCH_COPY,
      selectCopy: PARTNER_OPPORTUNITY_SELECT_COPY,
      noGuaranteeCopy: PARTNER_OPPORTUNITY_NO_GUARANTEE_COPY,
      properties: properties.map((property) => ({
        id: property.id,
        name: property.name,
        city: property.city,
        region: property.region
      })),
      opportunities: items.map((item) => ({
        ...item.opportunity,
        categoryLabel: PARTNER_SERVICE_CATEGORY_LABELS[item.opportunity.category],
        routes: item.routes.map((entry) => ({
          ...entry.route,
          partner: entry.partner
            ? {
                ...entry.partner,
                partnerTypeLabel: PARTNER_TYPE_LABELS[entry.partner.partnerType]
              }
            : null
        }))
      }))
    });
  }

  const auth = await requireServiceNetworkWrite(surface);
  if ("error" in auth) return auth.error;
  const payload = await request.json().catch(() => null);
  const override = rejectClientOverride(payload);
  if (override) return NextResponse.json({ error: override }, { status: 400 });
  const deps = await loadOpportunityDeps();
  try {
    const created = await createAndRouteOpportunity(
      {
        organizationId: auth.organizationId,
        actorUserId: auth.user.id,
        payload,
        defaultPropertyType: surface
      },
      deps
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create opportunity." },
      { status: 400 }
    );
  }
}

export async function handleOpportunityAction(
  request: Request,
  surface: "residential" | "facility",
  opportunityId: string
) {
  if (request.method === "GET") {
    const auth = await requireServiceNetworkRead(surface);
    if ("error" in auth) return auth.error;
    const deps = await loadOpportunityDeps();
    const detail = await getOrganizationOpportunity(auth.organizationId, opportunityId, deps);
    if (!detail) return NextResponse.json({ error: "Opportunity was not found." }, { status: 404 });
    return NextResponse.json(detail);
  }

  const auth = await requireServiceNetworkWrite(surface);
  if ("error" in auth) return auth.error;
  const payload = (await request.json().catch(() => null)) as { action?: string } | null;
  const deps = await loadOpportunityDeps();
  try {
    if (payload?.action === "reroute") {
      return NextResponse.json(
        await rerouteOpportunity(
          { organizationId: auth.organizationId, opportunityId, actorUserId: auth.user.id },
          deps
        )
      );
    }
    if (payload?.action === "cancel" || payload?.action === "close") {
      return NextResponse.json({
        opportunity: await closeOrCancelOpportunity(
          {
            organizationId: auth.organizationId,
            opportunityId,
            actorUserId: auth.user.id,
            action: payload.action
          },
          deps
        )
      });
    }
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update opportunity." },
      { status: 400 }
    );
  }
}

export async function handleSelectPartner(
  request: Request,
  surface: "residential" | "facility",
  opportunityId: string
) {
  const auth = await requireServiceNetworkWrite(surface);
  if ("error" in auth) return auth.error;
  const payload = (await request.json().catch(() => null)) as { partnerId?: string; selectedPartnerId?: string } | null;
  if (payload && "selectedPartnerId" in payload && !payload.partnerId) {
    return NextResponse.json({ error: "Those fields are server-authoritative." }, { status: 400 });
  }
  const partnerId = payload?.partnerId?.trim() ?? "";
  if (!partnerId) return NextResponse.json({ error: "Partner is required." }, { status: 400 });
  const deps = await loadOpportunityDeps();
  try {
    const opportunity = await selectInterestedPartner(
      { organizationId: auth.organizationId, opportunityId, actorUserId: auth.user.id, partnerId },
      deps
    );
    return NextResponse.json({
      opportunity,
      selectCopy: PARTNER_OPPORTUNITY_SELECT_COPY,
      noGuaranteeCopy: PARTNER_OPPORTUNITY_NO_GUARANTEE_COPY
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not select partner." },
      { status: 400 }
    );
  }
}

export async function handleCreateWorkOrderFromOpportunity(
  _request: Request,
  surface: "residential" | "facility",
  opportunityId: string
) {
  const auth = await requireServiceNetworkWrite(surface);
  if ("error" in auth) return auth.error;
  const deps = await loadOpportunityDeps();
  try {
    return NextResponse.json(
      await createWorkOrderFromOpportunity(
        { organizationId: auth.organizationId, opportunityId, actorUserId: auth.user.id },
        deps
      )
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create work order." },
      { status: 400 }
    );
  }
}

export async function handlePartnerOpportunityList(request: Request) {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;
  const url = new URL(request.url);
  if (url.searchParams.get("partnerId") || url.searchParams.get("partner_id")) {
    return NextResponse.json({ error: "partner_id is not an authorization parameter." }, { status: 400 });
  }
  const partners = await loadPartnerDeps();
  const partner = await partners.store.getPartnerByOrganization(authz.organizationId);
  if (!partner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const deps = await loadOpportunityDeps();
  return NextResponse.json(await listPartnerOpportunities(partner.id, deps));
}

export async function handlePartnerOpportunityDetail(request: Request, opportunityId: string) {
  const url = new URL(request.url);
  if (url.searchParams.get("partnerId") || url.searchParams.get("partner_id")) {
    return NextResponse.json({ error: "partner_id is not an authorization parameter." }, { status: 400 });
  }
  if (request.method === "GET") {
    const authz = await requirePartnerServicesRead();
    if ("error" in authz) return authz.error;
    const partners = await loadPartnerDeps();
    const partner = await partners.store.getPartnerByOrganization(authz.organizationId);
    if (!partner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const deps = await loadOpportunityDeps();
    const detail = await getPartnerOpportunity(partner.id, opportunityId, deps);
    if (!detail) return NextResponse.json({ error: "Opportunity was not found." }, { status: 404 });
    return NextResponse.json(detail);
  }

  const authz = await requirePartnerServicesWrite();
  if ("error" in authz) return authz.error;
  const partners = await loadPartnerDeps();
  const partner = await partners.store.getPartnerByOrganization(authz.organizationId);
  if (!partner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = (await request.json().catch(() => null)) as {
    response?: string;
    declineReason?: string;
    partnerId?: string;
  } | null;
  if (payload?.partnerId && payload.partnerId !== partner.id) {
    return NextResponse.json({ error: "Those fields are server-authoritative." }, { status: 400 });
  }
  if (payload?.response !== "interested" && payload?.response !== "declined") {
    return NextResponse.json({ error: "Response is required." }, { status: 400 });
  }
  const deps = await loadOpportunityDeps();
  try {
    return NextResponse.json(
      await respondToOpportunity(
        {
          partnerId: partner.id,
          opportunityId,
          actorUserId: authz.user.id,
          response: payload.response,
          declineReason: payload.declineReason
        },
        deps
      )
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record response." },
      { status: 400 }
    );
  }
}

export async function handleAdminOpportunityOversight() {
  const deps = await loadOpportunityDeps();
  return NextResponse.json(await listAdminOpportunityOversight(deps));
}

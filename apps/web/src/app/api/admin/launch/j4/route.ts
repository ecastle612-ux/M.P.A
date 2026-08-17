import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { isSignWellConfigured } from "../../../../../lib/signwell/client";

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const [
    { data: leasesData },
    { data: residentsData },
    { data: schedulesData },
    { data: eventsData },
    { data: auditsData },
    { data: unitsData },
    { data: membershipsData }
  ] = await Promise.all([
    supabase
      .from("lease_agreements")
      .select(
        "id, status, signing_channel, signwell_document_id, signwell_status, signed_at, activated_at, resident_id, unit_id, rent_amount, document_name, created_at"
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("pm_residents")
      .select("id, display_name, status, portal_status, lease_id, user_id, email")
      .eq("organization_id", organizationId),
    supabase
      .from("financial_charge_schedules")
      .select("id, lease_id, charge_type, active, next_run_on")
      .eq("organization_id", organizationId)
      .eq("charge_type", "rent")
      .eq("active", true),
    supabase
      .from("event_domain_events")
      .select("id, event_type, created_at")
      .eq("organization_id", organizationId)
      .in("event_type", [
        "lease.created",
        "lease.document_generated",
        "lease.sent_for_signature",
        "lease.signed",
        "lease.activated",
        "lease.signature_failed",
        "resident.portal_access_provisioned"
      ])
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("audit_events")
      .select("id, action, created_at")
      .eq("organization_id", organizationId)
      .in("action", [
        "lease.created",
        "lease.document_generated",
        "lease.sent_for_signature",
        "lease.signed",
        "lease.activated",
        "lease.signature_failed",
        "resident.portal_access_provisioned"
      ])
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("property_units")
      .select("id, status")
      .eq("organization_id", organizationId),
    supabase
      .from("organization_memberships")
      .select("user_id, roles, status")
      .eq("organization_id", organizationId)
      .eq("status", "active")
  ]);

  type AnyRow = Record<string, unknown>;
  const leases = (leasesData ?? []) as AnyRow[];
  const residents = (residentsData ?? []) as AnyRow[];
  const schedules = (schedulesData ?? []) as AnyRow[];
  const events = (eventsData ?? []) as AnyRow[];
  const audits = (auditsData ?? []) as AnyRow[];
  const units = (unitsData ?? []) as AnyRow[];
  const memberships = (membershipsData ?? []) as AnyRow[];

  const activeLease = leases.find((row) => row["status"] === "active") ?? null;
  const leaseReady = leases.some((row) => row["status"] === "signed" || row["status"] === "active");
  const activatedResident = residents.some(
    (row) => row["status"] === "active" && row["portal_status"] === "active" && row["lease_id"]
  );
  const tenantMembershipUserIds = new Set(
    memberships
      .filter((row) => Array.isArray(row["roles"]) && (row["roles"] as string[]).includes("tenant"))
      .map((row) => row["user_id"] as string)
  );
  const portalAccessProvisioned = residents.some(
    (row) =>
      row["portal_status"] === "active" &&
      Boolean(row["user_id"]) &&
      tenantMembershipUserIds.has(row["user_id"] as string)
  );

  return NextResponse.json({
    organizationId,
    leases,
    residents,
    schedules,
    timelineEvents: events,
    auditEvents: audits,
    signWellConfigured: isSignWellConfigured(),
    checks: {
      leaseCreated: leases.length > 0,
      documentGenerated: leases.some((row) => Boolean(row["document_name"])),
      signWellSent:
        leases.some(
          (row) => row["signing_channel"] === "signwell" && Boolean(row["signwell_document_id"])
        ) || events.some((event) => event["event_type"] === "lease.sent_for_signature"),
      leaseSigned: leases.some(
        (row) =>
          Boolean(row["signed_at"]) || row["status"] === "signed" || row["status"] === "active"
      ),
      leaseActivated:
        Boolean(activeLease?.["activated_at"]) || leases.some((row) => row["status"] === "active"),
      residentActivated: activatedResident,
      portalActivated: residents.some((row) => row["portal_status"] === "active"),
      portalAccessProvisioned,
      portalAccessEvidence:
        events.some((event) => event["event_type"] === "resident.portal_access_provisioned") ||
        audits.some((event) => event["action"] === "resident.portal_access_provisioned"),
      recurringRentScheduled: schedules.length > 0,
      occupancyUpdated: units.some((unit) => unit["status"] === "occupied"),
      timelineEvent: events.some(
        (event) =>
          event["event_type"] === "lease.activated" || event["event_type"] === "lease.created"
      ),
      auditEvent: audits.length > 0,
      leaseReady,
      assistantNextIsCollectRent: leaseReady,
      offlineHonestyAvailable: true
    },
    assistantRecommendation: leaseReady ? "Record your first payment." : "Create your first lease.",
    signWellNote:
      "Pass on signWellSent requires SIGNWELL_API_KEY. Offline signed path remains valid launch honesty when SignWell is not provisioned. portalAccessProvisioned requires linked pm_residents.user_id + tenant membership."
  });
}

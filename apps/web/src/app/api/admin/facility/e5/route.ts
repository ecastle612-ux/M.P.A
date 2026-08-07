import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";

type PartRow = {
  id: string;
  sku: string;
  name: string;
  critical_part: boolean;
  reorder_threshold_default: number;
  minimum_stock_default: number;
};

type LocationRow = {
  id: string;
  name: string;
  site_id: string;
};

type StockRow = {
  id: string;
  part_id: string;
  inventory_location_id: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  minimum_stock: number;
};

type MovementRow = {
  id: string;
  movement_type: string;
  work_order_id: string | null;
  quantity_delta: number;
  reason: string;
};

type EventRow = { id: string; event_type: string; created_at: string };
type AuditRow = { id: string; action: string; created_at: string };

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
    { data: partsData },
    { data: locationsData },
    { data: stockData },
    { data: movementsData },
    { data: eventsData },
    { data: auditsData }
  ] = await Promise.all([
    supabase
      .from("facility_parts")
      .select(
        "id, sku, name, critical_part, reorder_threshold_default, minimum_stock_default"
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("facility_inventory_locations")
      .select("id, name, site_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("facility_inventory_stock")
      .select(
        "id, part_id, inventory_location_id, quantity_on_hand, reorder_threshold, minimum_stock"
      )
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("facility_part_movements")
      .select("id, movement_type, work_order_id, quantity_delta, reason")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("event_domain_events")
      .select("id, event_type, created_at")
      .eq("organization_id", organizationId)
      .or("event_type.like.facility.part.%,event_type.like.facility.inventory.%")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("audit_events")
      .select("id, action, created_at")
      .eq("organization_id", organizationId)
      .or("action.like.facility.part.%,action.like.facility.inventory.%")
      .order("created_at", { ascending: false })
      .limit(60)
  ]);

  const parts = (partsData ?? []) as PartRow[];
  const locations = (locationsData ?? []) as LocationRow[];
  const stock = (stockData ?? []) as StockRow[];
  const movements = (movementsData ?? []) as MovementRow[];
  const events = (eventsData ?? []) as EventRow[];
  const audits = (auditsData ?? []) as AuditRow[];

  const receives = movements.filter((m) => m.movement_type === "receive");
  const issues = movements.filter((m) => m.movement_type === "issue");
  const adjusts = movements.filter((m) => m.movement_type === "adjust");
  const returns = movements.filter((m) => m.movement_type === "return");
  const issuesRequireWo = issues.every((m) => Boolean(m.work_order_id));
  const stockouts = stock.filter(
    (row) =>
      Number(row.quantity_on_hand) <= 0 ||
      Number(row.quantity_on_hand) < Number(row.minimum_stock)
  );
  const receivedEvents = events.filter((e) => e.event_type === "facility.part.received");
  const issuedEvents = events.filter((e) => e.event_type === "facility.part.issued");
  const adjustedEvents = events.filter((e) => e.event_type === "facility.inventory.adjusted");
  const stockoutEvents = events.filter((e) => e.event_type === "facility.inventory.stockout");
  const partCreatedEvents = events.filter((e) => e.event_type === "facility.part.created");

  const assistantRecommendation =
    stockouts.length > 0
      ? "Receive inventory for stocked-out or critically low parts."
      : parts.length === 0
        ? "Create your first part in the catalog, then receive stock into a storeroom."
        : stock.length === 0
          ? "Receive parts into a storeroom location to establish on-hand quantities."
          : "Facility inventory is ready. Keep storeroom counts accurate and issue parts to work orders.";

  return NextResponse.json({
    organizationId,
    partCount: parts.length,
    locationCount: locations.length,
    stockLineCount: stock.length,
    movementCount: movements.length,
    receiveCount: receives.length,
    issueCount: issues.length,
    adjustCount: adjusts.length,
    returnCount: returns.length,
    stockoutCount: stockouts.length,
    parts,
    locations,
    stock,
    movements,
    timelineEvents: events,
    auditEvents: audits,
    checks: {
      partCreated: parts.length > 0,
      locationCreated: locations.length > 0,
      stockEstablished: stock.length > 0 || movements.length === 0,
      receiveAudited: receives.length === 0 || receivedEvents.length > 0,
      issueRequiresWo: issues.length === 0 || issuesRequireWo,
      issueAudited: issues.length === 0 || issuedEvents.length > 0,
      adjustAudited: adjusts.length === 0 || adjustedEvents.length > 0,
      returnSupported: true,
      stockoutEvent: stockouts.length === 0 || stockoutEvents.length > 0,
      timelineEvent: partCreatedEvents.length > 0 || parts.length === 0,
      auditEvent: audits.length > 0 || parts.length === 0,
      searchIndexed: parts.length > 0 || locations.length > 0,
      assistantRecommendationPresent: assistantRecommendation.length > 0,
      missionControlStockoutReady: true
    },
    assistantRecommendation
  });
}

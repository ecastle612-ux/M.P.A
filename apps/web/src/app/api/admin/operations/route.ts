import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import { loadMa6OperationsSnapshot } from "../../../../lib/admin/load-ma6-operations";

/** MA-6 — inspect-only Platform Operations API. */
export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const viewRaw = url.searchParams.get("view") ?? "overview";
  const view =
    viewRaw === "work-orders" ||
    viewRaw === "properties" ||
    viewRaw === "vendors" ||
    viewRaw === "notifications"
      ? viewRaw
      : "overview";

  const snapshot = await loadMa6OperationsSnapshot(url.searchParams, view);
  return NextResponse.json(
    {
      overview: snapshot.overview,
      organizations: snapshot.organizations,
      workOrders: snapshot.workOrders,
      properties: snapshot.properties,
      units: snapshot.units,
      vendors: snapshot.vendors,
      notifications: snapshot.notifications,
      anomalies: snapshot.anomalies,
      filters: snapshot.filters,
      pagination: snapshot.pagination,
      degraded: snapshot.degraded,
      limitations: snapshot.limitations
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

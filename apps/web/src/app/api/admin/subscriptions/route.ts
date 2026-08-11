import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import { loadMa4SubscriptionsDirectory } from "../../../../lib/admin/load-ma4-subscriptions";

/** MA-4 — inspect-only Subscriptions directory API. */
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
  const directory = await loadMa4SubscriptionsDirectory(url.searchParams);
  return NextResponse.json(
    {
      rows: directory.rows,
      filters: directory.filters,
      pagination: directory.pagination,
      totals: directory.totals,
      degraded: directory.degraded
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

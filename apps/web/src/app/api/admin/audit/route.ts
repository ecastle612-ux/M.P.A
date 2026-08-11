import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import { loadMa3AuditDirectory } from "../../../../lib/admin/load-ma3-audit";

/** MA-3 — inspect-only Audit Log API. */
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
  const directory = await loadMa3AuditDirectory(url.searchParams);
  return NextResponse.json(
    {
      events: directory.events,
      filters: directory.filters,
      degraded: directory.degraded,
      limitations: directory.limitations
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

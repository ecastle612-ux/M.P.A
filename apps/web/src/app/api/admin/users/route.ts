import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import { loadMa3UsersDirectory } from "../../../../lib/admin/load-ma3-users";

/** MA-3 — inspect-only Users directory API. */
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
  const directory = await loadMa3UsersDirectory(url.searchParams);
  return NextResponse.json(
    { users: directory.users, memberships: directory.memberships, totals: directory.totals, degraded: directory.degraded },
    { headers: { "Cache-Control": "no-store" } }
  );
}

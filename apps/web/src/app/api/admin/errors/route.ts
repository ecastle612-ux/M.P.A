import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import { loadPlatformErrorsList } from "../../../../lib/admin/load-platform-errors";

/**
 * MA-1 — inspect-only Critical Errors API.
 * Auth: authenticated platform operator. No mutations. No client org trust for authorization.
 */
export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const result = await loadPlatformErrorsList(url.searchParams);

  return NextResponse.json(
    {
      errors: result.errors,
      degraded: result.degraded,
      detail: result.detail ?? null,
      rangeLabel: result.rangeLabel,
      resolutionLimitation: result.resolutionLimitation,
      filters: result.filters
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    }
  );
}

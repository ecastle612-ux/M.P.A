import { NextResponse } from "next/server";
import { requireStaffSearch } from "../../../../lib/simplicity/staff-search-authz";
import { runStaffSearch } from "../../../../lib/simplicity/staff-search-service";

export async function GET(request: Request) {
  const authz = await requireStaffSearch();
  if ("error" in authz) {
    return authz.error;
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const started = Date.now();
    const payload = await runStaffSearch(authz, query);
    return NextResponse.json({
      ...payload,
      latencyMs: Date.now() - started
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 400 }
    );
  }
}

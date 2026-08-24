import { NextResponse } from "next/server";
import { consumeFacilityRequestRateLimit } from "../../../../../../lib/facility/request-form-rate-limit";
import { loadPublicRequestStatus } from "../../../../../../lib/facility/public-request-service";
import { createServiceRoleClient } from "../../../../../../lib/supabase/service-role";

type Params = { params: Promise<{ statusToken: string }> };

export async function GET(request: Request, context: Params) {
  const { statusToken } = await context.params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!consumeFacilityRequestRateLimit(`status:${statusToken}:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Request tracking is unavailable." }, { status: 503 });
  }
  try {
    const result = await loadPublicRequestStatus(supabase, statusToken);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.view);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load status" },
      { status: 400 }
    );
  }
}

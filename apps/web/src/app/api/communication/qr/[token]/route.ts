import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { resolveBuildingQrToken } from "../../../../../lib/communication/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const supabase = await createAuthServerClient();
    const resolved = await resolveBuildingQrToken(token, supabase);
    if (!resolved) return apiError(404, "NOT_FOUND", "QR code not found");
    return NextResponse.json({ qr: resolved }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

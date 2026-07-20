import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { getProgressByToken, markRecipientViewedByToken } from "../../../../../lib/signature/server";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const progress = await getProgressByToken(token);
    if (!progress) return apiError(404, "NOT_FOUND", "Signing link unavailable");
    return NextResponse.json(progress, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const progress = await markRecipientViewedByToken(token);
    if (!progress) return apiError(404, "NOT_FOUND", "Signing link unavailable");
    return NextResponse.json(progress);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Progress update failed";
    return apiError(400, "PROGRESS_FAILED", message);
  }
}

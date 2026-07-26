import { NextResponse } from "next/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";
import { declineVendorJob } from "../../../../../lib/vendor-jobs/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!token || token.length < 16) {
      return apiError(404, "NOT_FOUND", "Job link not found");
    }
    const parsedBody = await parseJsonBody(request);
    const payload = parsedBody.ok ? (parsedBody.payload as Record<string, unknown>) : {};
    const reason = typeof payload["reason"] === "string" ? payload["reason"] : null;
    const job = await declineVendorJob(token, { reason });
    return NextResponse.json({ job });
  } catch (error) {
    const status =
      typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : "Unable to decline job";
    if (status === 404 || status === 409 || status === 410) {
      return apiError(status, "DECLINE_FAILED", message);
    }
    return apiInternalError();
  }
}

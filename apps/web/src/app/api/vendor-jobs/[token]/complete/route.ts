import { NextResponse } from "next/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";
import { finishVendorJob } from "../../../../../lib/vendor-jobs/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!token || token.length < 16) {
      return apiError(404, "NOT_FOUND", "Job link not found");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const payload = parsedBody.payload as Record<string, unknown>;
    const notes = typeof payload["notes"] === "string" ? payload["notes"] : null;
    const photoPaths = Array.isArray(payload["photoPaths"])
      ? payload["photoPaths"].filter((path): path is string => typeof path === "string").slice(0, 8)
      : [];

    const card = await finishVendorJob(token, {
      notes,
      photoPaths,
      userAgent: request.headers.get("user-agent")
    });

    return NextResponse.json({ job: card });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : "Unable to finish job";
    if (status === 404 || status === 409 || status === 410) {
      return apiError(status, "COMPLETE_FAILED", message);
    }
    return apiInternalError();
  }
}

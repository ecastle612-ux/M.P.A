import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";
import { getVendorJobCard } from "../../../../lib/vendor-jobs/server";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!token || token.length < 16) {
      return apiError(404, "NOT_FOUND", "Job link not found");
    }

    const card = await getVendorJobCard(token);
    return NextResponse.json({ job: card });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : "Unable to load job";
    if (status === 404 || status === 410) {
      return apiError(status, status === 410 ? "LINK_UNAVAILABLE" : "NOT_FOUND", message);
    }
    return apiInternalError();
  }
}

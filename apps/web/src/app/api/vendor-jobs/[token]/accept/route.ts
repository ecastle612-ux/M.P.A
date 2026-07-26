import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { acceptVendorJob } from "../../../../../lib/vendor-jobs/server";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!token || token.length < 16) {
      return apiError(404, "NOT_FOUND", "Job link not found");
    }
    const job = await acceptVendorJob(token);
    return NextResponse.json({ job });
  } catch (error) {
    const status =
      typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : "Unable to accept job";
    if (status === 404 || status === 409 || status === 410) {
      return apiError(status, "ACCEPT_FAILED", message);
    }
    return apiInternalError();
  }
}

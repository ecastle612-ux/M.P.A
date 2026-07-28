import { NextResponse } from "next/server";
import { apiError } from "../../../../lib/api/http";
import { getAcquireProvisionStatus } from "../../../../lib/saas/public-checkout";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workEmail = url.searchParams.get("email") ?? "";
  const companyName = url.searchParams.get("company");
  if (!workEmail.includes("@")) {
    return apiError(400, "INVALID_INPUT", "Valid email query parameter is required.");
  }

  const status = await getAcquireProvisionStatus({
    workEmail,
    companyName
  });

  return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
}

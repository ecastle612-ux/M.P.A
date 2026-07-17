import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { enrollResidentViaQrToken } from "../../../../lib/communication/server";
import { apiError, parseJsonBody } from "../../../../lib/api/http";

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const payload = parsedBody.payload as Record<string, unknown>;
    const token = typeof payload["token"] === "string" ? payload["token"].trim() : "";
    if (!token) return apiError(400, "INVALID_PAYLOAD", "Missing QR token");

    const result = await enrollResidentViaQrToken(
      organizationId,
      user.id,
      user.email ?? "",
      token,
      supabase
    );
    return NextResponse.json({ enrollment: result }, { status: result.alreadyEnrolled ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enrollment failed";
    return apiError(400, "ENROLLMENT_FAILED", message);
  }
}

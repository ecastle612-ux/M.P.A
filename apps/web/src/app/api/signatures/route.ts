import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { createSignatureRequest } from "../../../lib/applicant/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../lib/api/http";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "signature:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const applicantId = url.searchParams.get("applicantId");

    let query = supabase
      .from("signature_requests")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (applicantId) query = query.eq("applicant_id", applicantId);

    const { data, error } = await query;
    if (error) return apiError(400, "SIGNATURE_LIST_FAILED", error.message);

    return NextResponse.json({ items: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "signature:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const payload = parsedBody.payload as Record<string, unknown>;
    const applicantId = typeof payload["applicantId"] === "string" ? payload["applicantId"] : null;
    if (!applicantId) return apiError(400, "INVALID_PAYLOAD", "applicantId is required");

    const provider = typeof payload["provider"] === "string" ? payload["provider"] : undefined;
    const requestType = typeof payload["requestType"] === "string" ? payload["requestType"] : undefined;
    const signatureInput: { provider?: string; requestType?: string } = {};
    if (provider) signatureInput.provider = provider;
    if (requestType) signatureInput.requestType = requestType;
    const signatureRequest = await createSignatureRequest(
      organizationId,
      applicantId,
      user.id,
      signatureInput,
      supabase
    );
    return NextResponse.json({ signatureRequest }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signature request creation failed";
    return apiError(400, "SIGNATURE_CREATE_FAILED", message);
  }
}

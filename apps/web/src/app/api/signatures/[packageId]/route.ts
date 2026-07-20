import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";
import {
  cancelSignaturePackage,
  getSignaturePackageDetail,
  regeneratePreview,
  remindSignatureRecipient,
  retryVaultSync,
  sendSignaturePackage,
  simulateSandboxCompletion
} from "../../../../lib/signature/server";

type RouteContext = { params: Promise<{ packageId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { packageId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "signature:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const detail = await getSignaturePackageDetail(organizationId, packageId, supabase);
    if (!detail) return apiError(404, "NOT_FOUND", "Signature package not found");

    const canReadFull = evaluatePermission(authorization, "signature:read_full");
    return NextResponse.json(
      {
        ...detail,
        canSend: evaluatePermission(authorization, "signature:send"),
        canCancel: evaluatePermission(authorization, "signature:cancel"),
        canReadFull,
        documents: detail.documents.map((doc: { id: string; title: string; isPreview: boolean; contentText: string; documentType: string; version: number; contentHash: string; sortOrder: number; vaultDocumentId: string | null; organizationId: string; signatureRequestId: string; templateId: string | null }) => ({
          ...doc,
          contentText: canReadFull || doc.isPreview ? doc.contentText : null
        }))
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { packageId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;
    const action = typeof payload["action"] === "string" ? payload["action"] : "";

    if (action === "preview") {
      if (!evaluatePermission(authorization, "signature:update") && !evaluatePermission(authorization, "signature:create")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const detail = await regeneratePreview(organizationId, packageId, user.id, supabase);
      return NextResponse.json({ detail });
    }

    if (action === "send") {
      if (!evaluatePermission(authorization, "signature:send")) return apiError(403, "FORBIDDEN", "Forbidden");
      const detail = await sendSignaturePackage(organizationId, packageId, user.id, supabase);
      return NextResponse.json({ detail });
    }

    if (action === "remind") {
      if (!evaluatePermission(authorization, "signature:send")) return apiError(403, "FORBIDDEN", "Forbidden");
      const recipientId = typeof payload["recipientId"] === "string" ? payload["recipientId"] : null;
      if (!recipientId) return apiError(400, "INVALID_PAYLOAD", "recipientId required");
      const detail = await remindSignatureRecipient(organizationId, packageId, recipientId, user.id, supabase);
      return NextResponse.json({ detail });
    }

    if (action === "cancel") {
      if (!evaluatePermission(authorization, "signature:cancel")) return apiError(403, "FORBIDDEN", "Forbidden");
      const detail = await cancelSignaturePackage(organizationId, packageId, user.id, supabase);
      return NextResponse.json({ detail });
    }

    if (action === "retry_vault") {
      if (!evaluatePermission(authorization, "signature:admin") && !evaluatePermission(authorization, "signature:send")) {
        return apiError(403, "FORBIDDEN", "Forbidden");
      }
      const detail = await retryVaultSync(organizationId, packageId, user.id, supabase);
      return NextResponse.json({ detail });
    }

    if (action === "simulate_complete") {
      if (!evaluatePermission(authorization, "signature:send")) return apiError(403, "FORBIDDEN", "Forbidden");
      if (process.env["NODE_ENV"] === "production" && process.env["DROPBOX_SIGN_ALLOW_SIMULATE"] !== "true") {
        return apiError(403, "FORBIDDEN", "Simulate disabled in production");
      }
      const detail = await simulateSandboxCompletion(organizationId, packageId, user.id, supabase);
      return NextResponse.json({ detail });
    }

    return apiError(400, "INVALID_ACTION", "Unknown action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signature action failed";
    return apiError(400, "SIGNATURE_ACTION_FAILED", message);
  }
}

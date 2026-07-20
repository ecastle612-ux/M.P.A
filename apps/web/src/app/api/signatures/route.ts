import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../lib/api/http";
import {
  createSignaturePackage,
  getSignatureOpsSnapshot,
  listSignaturePackages
} from "../../../lib/signature/server";
import type {
  CreateSignaturePackageInput,
  SignatureDocumentType,
  SignatureOrderMode,
  SignatureRecipientRole
} from "../../../lib/signature/contracts";

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
    if (url.searchParams.get("ops") === "1") {
      const ops = await getSignatureOpsSnapshot(organizationId, supabase);
      return NextResponse.json({ ops }, { headers: { "Cache-Control": "no-store" } });
    }

    const filters: { applicantId?: string; leaseId?: string; status?: string } = {};
    const applicantId = url.searchParams.get("applicantId");
    const leaseId = url.searchParams.get("leaseId");
    const status = url.searchParams.get("status");
    if (applicantId) filters.applicantId = applicantId;
    if (leaseId) filters.leaseId = leaseId;
    if (status) filters.status = status;

    const items = await listSignaturePackages(organizationId, filters, supabase);

    return NextResponse.json(
      {
        items: items.map((item) => ({
          id: item.id,
          requestNumber: item.packageNumber,
          request_number: item.packageNumber,
          applicantId: item.applicantId,
          applicant_id: item.applicantId,
          leaseId: item.leaseId,
          status: item.status,
          requestType: item.documentType,
          request_type: item.documentType,
          provider: item.provider,
          vaultStatus: item.vaultStatus,
          completedAt: item.completedAt
        }))
      },
      { headers: { "Cache-Control": "no-store" } }
    );
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

    const input: CreateSignaturePackageInput = {};
    if (typeof payload["leaseId"] === "string") input.leaseId = payload["leaseId"];
    if (typeof payload["applicantId"] === "string") input.applicantId = payload["applicantId"];
    if (typeof payload["screeningCaseId"] === "string") input.screeningCaseId = payload["screeningCaseId"];
    if (typeof payload["documentType"] === "string") {
      input.documentType = payload["documentType"] as SignatureDocumentType;
    } else if (typeof payload["requestType"] === "string") {
      input.documentType = payload["requestType"] as SignatureDocumentType;
    }
    if (typeof payload["orderMode"] === "string") input.orderMode = payload["orderMode"] as SignatureOrderMode;
    if (typeof payload["subject"] === "string") input.subject = payload["subject"];
    if (typeof payload["message"] === "string") input.message = payload["message"];
    if (typeof payload["provider"] === "string") input.provider = payload["provider"];

    if (Array.isArray(payload["recipients"])) {
      input.recipients = payload["recipients"]
        .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
        .map((row) => {
          const recipient: NonNullable<CreateSignaturePackageInput["recipients"]>[number] = {
            role: String(row["role"]) as SignatureRecipientRole,
            fullName: String(row["fullName"] ?? "")
          };
          if (typeof row["email"] === "string") recipient.email = row["email"];
          if (typeof row["signingOrder"] === "number") recipient.signingOrder = row["signingOrder"];
          if (typeof row["signingGroup"] === "number") recipient.signingGroup = row["signingGroup"];
          if (typeof row["isRequired"] === "boolean") recipient.isRequired = row["isRequired"];
          return recipient;
        })
        .filter((row) => row.fullName.trim().length > 0);
    }

    if (!input.leaseId && !input.applicantId) {
      return apiError(400, "INVALID_PAYLOAD", "leaseId or applicantId is required");
    }

    const signaturePackage = await createSignaturePackage(organizationId, user.id, input, supabase);
    return NextResponse.json(
      { package: signaturePackage, signatureRequest: signaturePackage },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signature package creation failed";
    return apiError(400, "SIGNATURE_CREATE_FAILED", message);
  }
}

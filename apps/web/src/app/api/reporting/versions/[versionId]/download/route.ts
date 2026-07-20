import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../../../lib/api/http";
import { ReportingService } from "../../../../../../lib/reporting/service";

type RouteContext = { params: Promise<{ versionId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "financial:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const propertyId = url.searchParams.get("propertyId")?.trim() ?? "";
    if (!propertyId) return apiError(400, "INVALID_PAYLOAD", "propertyId is required");

    const { versionId } = await context.params;
    const file = await ReportingService.downloadVersion({
      organizationId,
      propertyId,
      documentId: versionId
    });
    if (!file) return apiError(404, "VERSION_NOT_FOUND", "Report version not found");

    return new Response(Buffer.from(file.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return apiInternalError();
  }
}

import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { isMigrationEntityType } from "../../../../../../lib/migration/contracts";
import { uploadMigrationFile } from "../../../../../../lib/migration/server";
import { apiError } from "../../../../../../lib/api/http";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "migration:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      return apiError(400, "INVALID_PAYLOAD", "Missing file upload");
    }

    const entityTypeRaw = formData.get("entityType");
    const entityType = typeof entityTypeRaw === "string" && isMigrationEntityType(entityTypeRaw) ? entityTypeRaw : null;

    const importFile = await uploadMigrationFile(organizationId, jobId, user.id, fileEntry, entityType, supabase);
    return Response.json({ file: importFile }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "File upload failed";
    return apiError(400, "MIGRATION_UPLOAD_FAILED", message);
  }
}

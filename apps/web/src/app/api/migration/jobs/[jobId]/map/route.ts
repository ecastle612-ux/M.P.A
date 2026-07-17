import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { parseUpdateMigrationJobInput } from "../../../../../../lib/migration/contracts";
import { previewMigrationImport, updateMigrationJob } from "../../../../../../lib/migration/server";
import { apiError, parseJsonBody } from "../../../../../../lib/api/http";

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

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const payload = parsedBody.payload as Record<string, unknown>;
    const previewOnly = payload["preview"] === true;

    const updates = parseUpdateMigrationJobInput(parsedBody.payload);
    if (updates) {
      await updateMigrationJob(organizationId, jobId, user.id, updates, supabase);
    }

    if (previewOnly) {
      const previews = await previewMigrationImport(organizationId, jobId, supabase);
      return Response.json({ previews });
    }

    const previews = await previewMigrationImport(organizationId, jobId, supabase);
    return Response.json({ previews, saved: Boolean(updates) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mapping failed";
    return apiError(400, "MIGRATION_MAP_FAILED", message);
  }
}

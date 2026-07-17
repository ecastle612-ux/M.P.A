import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { rollbackMigrationJob } from "../../../../../../lib/migration/server";
import { apiError } from "../../../../../../lib/api/http";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(_request: Request, context: RouteContext) {
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
    if (!evaluatePermission(authorization, "migration:rollback")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const job = await rollbackMigrationJob(organizationId, jobId, user.id, supabase);
    return Response.json({ job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rollback failed";
    return apiError(400, "MIGRATION_ROLLBACK_FAILED", message);
  }
}

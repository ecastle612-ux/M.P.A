import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import { parseMigrationReviewAction, type MigrationReviewResolution } from "../../../../../../lib/migration/contracts";
import { getMigrationReviewItems, resolveMigrationReviewItem } from "../../../../../../lib/migration/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../../lib/api/http";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
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
    if (!evaluatePermission(authorization, "migration:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const items = await getMigrationReviewItems(organizationId, jobId, supabase);
    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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
    const reviewItemId = typeof payload["reviewItemId"] === "string" ? payload["reviewItemId"] : null;
    if (!reviewItemId) return apiError(400, "INVALID_PAYLOAD", "reviewItemId is required");

    const action = parseMigrationReviewAction(payload);
    if (!action) return apiError(400, "INVALID_PAYLOAD", "Invalid review action");

    const statusMap: Record<"merge" | "keep" | "replace" | "skip", MigrationReviewResolution> = {
      merge: "merged",
      keep: "kept",
      replace: "replaced",
      skip: "skipped"
    };

    const item = await resolveMigrationReviewItem(
      organizationId,
      jobId,
      reviewItemId,
      user.id,
      statusMap[action.action],
      action,
      supabase
    );
    if (!item) return apiError(404, "NOT_FOUND", "Review item not found");
    return Response.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review resolution failed";
    return apiError(400, "MIGRATION_REVIEW_FAILED", message);
  }
}

import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { parseUpdateMigrationJobInput } from "../../../../../lib/migration/contracts";
import {
  getMigrationActivityForJob,
  getMigrationImportFiles,
  getMigrationJobForOrganization,
  updateMigrationJob
} from "../../../../../lib/migration/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";

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

    const [job, files, activity] = await Promise.all([
      getMigrationJobForOrganization(organizationId, jobId, supabase),
      getMigrationImportFiles(organizationId, jobId, supabase),
      getMigrationActivityForJob(organizationId, jobId, supabase)
    ]);

    if (!job) return apiError(404, "NOT_FOUND", "Migration job not found");
    return NextResponse.json({ job, files, activity }, { headers: { "Cache-Control": "no-store" } });
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

    const updates = parseUpdateMigrationJobInput(parsedBody.payload);
    if (!updates) return apiError(400, "INVALID_PAYLOAD", "Invalid migration job update");

    const job = await updateMigrationJob(organizationId, jobId, user.id, updates, supabase);
    if (!job) return apiError(404, "NOT_FOUND", "Migration job not found");
    return NextResponse.json({ job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Migration job update failed";
    return apiError(400, "MIGRATION_UPDATE_FAILED", message);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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
    if (!evaluatePermission(authorization, "migration:delete")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const { error } = await supabase
      .from("migration_jobs")
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id, updated_by: user.id })
      .eq("organization_id", organizationId)
      .eq("id", jobId)
      .is("deleted_at", null);

    if (error) return apiError(400, "MIGRATION_DELETE_FAILED", error.message);
    return NextResponse.json({ ok: true });
  } catch {
    return apiInternalError();
  }
}

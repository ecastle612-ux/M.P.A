import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import {
  parseCreateWorkOrderMaterialInput,
  parseRecommendationsInput,
  parseUpdateWorkOrderMaterialInput
} from "../../../../../../lib/facility/materials-contracts";
import {
  addWorkOrderMaterial,
  deleteWorkOrderMaterial,
  getWorkOrderRecommendations,
  listWorkOrderMaterials,
  setWorkOrderRecommendations,
  updateWorkOrderMaterial
} from "../../../../../../lib/facility/materials-server";
import { getWorkOrderForOrganization } from "../../../../../../lib/maintenance/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../../lib/api/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  try {
    const { workOrderId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const workOrder = await getWorkOrderForOrganization(organizationId, workOrderId, supabase);
    if (!workOrder) return apiError(404, "NOT_FOUND", "Work order not found");

    const [materials, recommendationsNotes] = await Promise.all([
      listWorkOrderMaterials(organizationId, workOrderId, supabase),
      getWorkOrderRecommendations(organizationId, workOrderId, supabase)
    ]);

    return NextResponse.json(
      { materials, recommendationsNotes },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  try {
    const { workOrderId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const workOrder = await getWorkOrderForOrganization(organizationId, workOrderId, supabase);
    if (!workOrder) return apiError(404, "NOT_FOUND", "Work order not found");

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseCreateWorkOrderMaterialInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid material payload");

    const material = await addWorkOrderMaterial(
      organizationId,
      workOrderId,
      user.id,
      input,
      supabase
    );
    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add material";
    return apiError(400, "MATERIAL_CREATE_FAILED", message);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workOrderId: string }> }
) {
  try {
    const { workOrderId } = await params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const payload = parsedBody.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid payload");
    }
    const action = (payload as Record<string, unknown>)["action"];

    if (action === "recommendations") {
      const input = parseRecommendationsInput(payload);
      if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid recommendations");
      const recommendationsNotes = await setWorkOrderRecommendations(
        organizationId,
        workOrderId,
        user.id,
        input.recommendationsNotes,
        supabase
      );
      return NextResponse.json({ recommendationsNotes });
    }

    if (action === "update_material") {
      const materialId = (payload as Record<string, unknown>)["materialId"];
      if (typeof materialId !== "string") return apiError(400, "INVALID_PAYLOAD", "materialId required");
      const input = parseUpdateWorkOrderMaterialInput(payload);
      if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid material update");
      const material = await updateWorkOrderMaterial(
        organizationId,
        workOrderId,
        materialId,
        user.id,
        input,
        supabase
      );
      return NextResponse.json({ material });
    }

    if (action === "delete_material") {
      const materialId = (payload as Record<string, unknown>)["materialId"];
      if (typeof materialId !== "string") return apiError(400, "INVALID_PAYLOAD", "materialId required");
      await deleteWorkOrderMaterial(organizationId, workOrderId, materialId, supabase);
      return NextResponse.json({ ok: true });
    }

    return apiError(400, "INVALID_ACTION", "Unknown materials action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Materials update failed";
    return apiError(400, "MATERIAL_UPDATE_FAILED", message);
  }
}

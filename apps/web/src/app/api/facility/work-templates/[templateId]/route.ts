import { NextResponse } from "next/server";
import { FACILITY_MANAGER_ROLES, updateWorkTemplateInputSchema } from "@mpa/shared";
import { requireAuthorizedAction } from "../../../../../lib/auth/require-authorized-action";
import {
  getCurrentTemplateVersion,
  getWorkTemplate,
  updateWorkTemplate
} from "../../../../../lib/facility/work-template-service";

export const runtime = "nodejs";

type Params = { params: Promise<{ templateId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAuthorizedAction({
    capability: "pm.maintenance:read",
    entitlement: "facility.operations"
  });
  if ("error" in auth) return auth.error;

  const { templateId } = await params;
  try {
    const template = await getWorkTemplate(auth.supabase, auth.organizationId, templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    const version = await getCurrentTemplateVersion(auth.supabase, auth.organizationId, templateId);
    return NextResponse.json({ template, version });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load template" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuthorizedAction({
    capability: "pm.maintenance:write",
    entitlement: "facility.operations",
    allowedRoles: [...FACILITY_MANAGER_ROLES]
  });
  if ("error" in auth) return auth.error;

  const { templateId } = await params;
  try {
    const body = updateWorkTemplateInputSchema.parse({
      ...(await request.json()),
      templateId
    });
    const updated = await updateWorkTemplate(auth.supabase, auth.organizationId, body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update template" },
      { status: 400 }
    );
  }
}

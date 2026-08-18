import { NextResponse } from "next/server";
import { requireFacilityRequestFormsPermission } from "../../../../../lib/facility/authz";
import {
  deactivateRequestForm,
  loadFormVersion,
  publishRequestForm,
  saveRequestFormDraft
} from "../../../../../lib/facility/request-form-service";

type Params = { params: Promise<{ formId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFacilityRequestFormsPermission();
  if ("error" in authz) return authz.error;
  const { formId } = await context.params;
  try {
    const loaded = await loadFormVersion(authz.supabase, authz.organizationId, formId);
    if (!loaded) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(loaded);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load request form" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, context: Params) {
  const authz = await requireFacilityRequestFormsPermission();
  if ("error" in authz) return authz.error;
  const { formId } = await context.params;
  const payload = (await request.json().catch(() => null)) as {
    action?: string;
    name?: string;
    description?: string | null;
    instructions?: string | null;
    accessPolicy?: "contact_required" | "authenticated_only";
    fields?: never;
  } | null;
  try {
    if (payload?.action === "publish") {
      const form = await publishRequestForm(authz.supabase, authz.organizationId, formId);
      return NextResponse.json({ form });
    }
    if (payload?.action === "deactivate") {
      const form = await deactivateRequestForm(authz.supabase, authz.organizationId, formId);
      return NextResponse.json({ form });
    }
    const form = await saveRequestFormDraft(authz.supabase, authz.organizationId, formId, {
      ...(payload?.name ? { name: payload.name } : {}),
      ...(payload?.description !== undefined ? { description: payload.description } : {}),
      ...(payload?.instructions !== undefined ? { instructions: payload.instructions } : {}),
      ...(payload?.accessPolicy ? { accessPolicy: payload.accessPolicy } : {}),
      ...(payload?.fields ? { fields: payload.fields } : {})
    });
    return NextResponse.json({ form });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update request form" },
      { status: 400 }
    );
  }
}

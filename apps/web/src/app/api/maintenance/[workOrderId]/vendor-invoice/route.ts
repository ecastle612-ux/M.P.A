import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getInvoiceForWorkOrder } from "../../../../../lib/vendor-payments/server";

type Ctx = { params: Promise<{ workOrderId: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { workOrderId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "maintenance:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invoice = await getInvoiceForWorkOrder(organizationId, workOrderId, supabase);
  return NextResponse.json({ invoice });
}

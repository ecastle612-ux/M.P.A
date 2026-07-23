import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { reviewVendorInvoice } from "../../../../../lib/vendor-payments/server";

type Ctx = { params: Promise<{ invoiceId: string }> };

export async function POST(request: Request, context: Ctx) {
  const { invoiceId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "maintenance:update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    action?: "approve" | "reject" | "request_revision";
    reviewNotes?: string | null;
  };
  if (!body.action || !["approve", "reject", "request_revision"].includes(body.action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const invoice = await reviewVendorInvoice(
      organizationId,
      invoiceId,
      user.id,
      body.action,
      body.reviewNotes ?? null,
      supabase
    );
    return NextResponse.json({ invoice });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed" },
      { status: 400 }
    );
  }
}

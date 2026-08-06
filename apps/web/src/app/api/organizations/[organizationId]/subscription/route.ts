import { NextResponse } from "next/server";
import { isProductSku, toSkuLabel } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { assignOrganizationSubscription, getOrganizationCommercialState } from "../../../../../lib/commercial/server";

type RouteContext = {
  params: Promise<{ organizationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const state = await getOrganizationCommercialState(organizationId);
  return NextResponse.json({
    organizationId,
    productSku: state.sku,
    productLabel: state.skuLabel,
    subscriptionStatus: state.subscriptionStatus,
    entitlements: state.entitlements,
    productConfirmed: state.productConfirmed,
    setupComplete: state.setupComplete
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { productSku?: unknown } | null;
  if (!payload || !isProductSku(payload.productSku)) {
    return NextResponse.json({ error: "productSku is required" }, { status: 400 });
  }

  const result = await assignOrganizationSubscription({
    organizationId,
    sku: payload.productSku,
    assignedBy: user.id
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    organizationId,
    productSku: payload.productSku,
    productLabel: toSkuLabel(payload.productSku)
  });
}

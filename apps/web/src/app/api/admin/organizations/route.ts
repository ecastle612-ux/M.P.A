import { NextResponse } from "next/server";
import { isProductSku, toSkuLabel } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";

export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: organizations, error } = await supabase.from("organizations").select("id, name, slug, created_at").order("name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const ids = (organizations ?? []).map((organization) => organization.id);
  const { data: subscriptions } = ids.length
    ? await supabase.from("organization_subscriptions").select("organization_id, sku_code, status").in("organization_id", ids)
    : { data: [] };

  const subscriptionByOrg = new Map(
    (subscriptions ?? []).map((subscription) => [subscription.organization_id, subscription] as const)
  );

  return NextResponse.json({
    organizations: (organizations ?? []).map((organization) => {
      const subscription = subscriptionByOrg.get(organization.id);
      const sku = subscription && isProductSku(subscription.sku_code) ? subscription.sku_code : null;
      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        productSku: sku,
        productLabel: sku ? toSkuLabel(sku) : null,
        subscriptionStatus: subscription?.status ?? null
      };
    })
  });
}

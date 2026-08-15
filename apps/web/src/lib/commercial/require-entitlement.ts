import { evaluatePathEntitlement, type MemberOperatingScope, type ProductSku } from "@mpa/shared";
import { redirect } from "next/navigation";
import { getOrganizationCommercialState } from "./server";

export async function assertPathEntitled(input: {
  pathname: string;
  organizationId: string | null;
  roles?: readonly string[];
  storedScope?: MemberOperatingScope | null;
}): Promise<ProductSku | null> {
  const state = input.organizationId
    ? await getOrganizationCommercialState(input.organizationId)
    : {
        sku: null,
        skuLabel: null,
        subscriptionStatus: null,
        entitlements: ["platform.org", "platform.guided_setup", "platform.billing_self", "platform.launcher"] as const,
        productConfirmed: false,
        setupComplete: false
      };

  const decision = evaluatePathEntitlement({
    pathname: input.pathname,
    sku: state.sku,
    roles: input.roles,
    storedScope: input.storedScope
  });

  if (!decision.allowed) {
    if (!state.sku) {
      redirect("/setup");
    }
    redirect(`/unauthorized?reason=entitlement&required=${encodeURIComponent(decision.entitlement ?? "unknown")}`);
  }

  return state.sku;
}

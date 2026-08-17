import { isProductSku, type ProductSku } from "@mpa/shared";

export type CommerceOrgCreateContext =
  | { kind: "none" }
  | { kind: "unresolved" }
  | { kind: "resolved"; productSku: string; organizationId: string | null };

export type ManualOrgCreateDecision =
  | { ok: true; sku: ProductSku }
  | { ok: false; error: string };

/**
 * Guided Setup / POST /api/organizations SKU decision (docs/178 P1-05).
 * Commerce-backed sessions never silently fall back to Property Manager.
 */
export function decideManualOrganizationCreate(input: {
  isOperator: boolean;
  requestedSku: string | undefined;
  commerce: CommerceOrgCreateContext;
}): ManualOrgCreateDecision {
  if (input.commerce.kind === "unresolved") {
    return { ok: false, error: "commerce_state_unresolved" };
  }

  if (input.commerce.kind === "resolved") {
    if (input.commerce.organizationId) {
      return { ok: false, error: "organization_already_provisioned" };
    }
    if (!isProductSku(input.commerce.productSku)) {
      return { ok: false, error: "commerce_sku_unresolved" };
    }
    return { ok: true, sku: input.commerce.productSku };
  }

  if (input.isOperator && input.requestedSku && isProductSku(input.requestedSku)) {
    return { ok: true, sku: input.requestedSku };
  }

  return { ok: true, sku: "mpa_property_manager" };
}

export function mergeCommerceOrgCreateSignals(
  signals: Array<{ productSku?: string | null; organizationId?: string | null }>
): CommerceOrgCreateContext {
  if (signals.length === 0) {
    return { kind: "none" };
  }

  const skus = [
    ...new Set(signals.map((signal) => signal.productSku).filter((sku): sku is string => Boolean(sku)))
  ];
  const orgIds = [
    ...new Set(
      signals
        .map((signal) => signal.organizationId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  ];

  if (skus.length !== 1 || !isProductSku(skus[0])) {
    return { kind: "unresolved" };
  }

  return {
    kind: "resolved",
    productSku: skus[0],
    organizationId: orgIds[0] ?? null
  };
}

export function customerFacingOrgCreateError(error: string): string {
  switch (error) {
    case "commerce_state_unresolved":
    case "commerce_sku_unresolved":
      return "We could not confirm your purchased product. Check your email to finish setup — a new organization was not created.";
    case "organization_already_provisioned":
      return "Your organization is already being prepared from Checkout. Check your email to claim it.";
    default:
      return error;
  }
}

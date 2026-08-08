import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  acquisitionHref,
  parseAcquisitionSku,
  requiresEnterpriseMotion
} from "@mpa/shared";
import { CheckoutPage } from "../../../components/marketing/checkout-page";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Confirm Plan — My Property Assistant",
  description:
    "Confirm your Property Manager plan before creating your account. No payment on this step."
};

type Search = {
  intent?: string;
  plan?: string;
  cycle?: string;
};

export default async function CheckoutRoute({
  searchParams
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const sku = parseAcquisitionSku(params.intent);
  if (sku && requiresEnterpriseMotion(sku)) {
    redirect(acquisitionHref("enterprise", sku));
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <CheckoutPage
      isAuthenticated={Boolean(user)}
      selectedSkuRaw={params.intent ?? null}
      selectedPlanRaw={params.plan ?? null}
      selectedCycleRaw={params.cycle ?? null}
    />
  );
}

import { NextResponse } from "next/server";
import { loadPublicCatalogPrices } from "../../../../lib/saas-stripe/public-prices-server";

export const dynamic = "force-dynamic";

/** Public read of configured self-serve Stripe Price amounts (no secrets returned). */
export async function GET() {
  const catalog = await loadPublicCatalogPrices();
  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
    }
  });
}

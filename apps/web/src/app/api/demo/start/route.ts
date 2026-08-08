import { NextResponse } from "next/server";
import {
  COM_002_FLAGS,
  defaultDemoSurface,
  defaultPersonaForProduct,
  parseDemoProduct
} from "@mpa/shared";
import { applyDemoCookies } from "../../../../lib/demo/durable-state";
import { createDemoSessionRecord } from "../../../../lib/demo/session-store";

export async function GET(request: Request) {
  if (!COM_002_FLAGS.sliceB_demoPlatform) {
    return NextResponse.redirect(new URL("/modules", request.url));
  }
  const url = new URL(request.url);
  const product = parseDemoProduct(url.searchParams.get("product"));
  if (!product) {
    return NextResponse.redirect(new URL("/demo", request.url));
  }
  const persona = defaultPersonaForProduct(product);
  const surface = url.searchParams.get("surface") || defaultDemoSurface(product, persona);
  const row = createDemoSessionRecord({ product, persona });
  const response = NextResponse.redirect(new URL(`/demo/${product}/${surface}`, request.url));
  applyDemoCookies(response, row);
  return response;
}

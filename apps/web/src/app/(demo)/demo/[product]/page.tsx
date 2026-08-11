import { redirect } from "next/navigation";
import { parseDemoProduct } from "@mpa/shared";
import { isDemoRuntimeEnabled } from "../../../../lib/demo/demo-runtime";

/** Starts a demo session via API (sets httpOnly cookie), then lands on default surface. */
export default async function DemoProductEntryPage({
  params
}: {
  params: Promise<{ product: string }>;
}) {
  if (!isDemoRuntimeEnabled()) {
    redirect("/modules");
  }
  const { product: raw } = await params;
  const product = parseDemoProduct(raw);
  if (!product) {
    redirect("/demo");
  }
  redirect(`/api/demo/start?product=${encodeURIComponent(product)}`);
}

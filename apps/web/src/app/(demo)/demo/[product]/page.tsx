import { redirect } from "next/navigation";
import { COM_002_FLAGS, parseDemoProduct } from "@mpa/shared";

/** Starts a demo session via API (sets httpOnly cookie), then lands on default surface. */
export default async function DemoProductEntryPage({
  params
}: {
  params: Promise<{ product: string }>;
}) {
  if (!COM_002_FLAGS.sliceB_demoPlatform) {
    redirect("/modules");
  }
  const { product: raw } = await params;
  const product = parseDemoProduct(raw);
  if (!product) {
    redirect("/demo");
  }
  redirect(`/api/demo/start?product=${encodeURIComponent(product)}`);
}

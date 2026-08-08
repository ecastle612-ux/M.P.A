import { redirect } from "next/navigation";
import { COM_002_FLAGS, parseDemoProduct } from "@mpa/shared";
import { DemoChrome } from "../../../../../components/demo/demo-chrome";
import { DemoSurfaceView } from "../../../../../components/demo/demo-surfaces";
import { DEMO_SESSION_COOKIE } from "../../../../../lib/demo/cookie";
import { getDemoSessionRecord } from "../../../../../lib/demo/session-store";
import { cookies } from "next/headers";

export default async function DemoSurfacePage({
  params
}: {
  params: Promise<{ product: string; surface: string }>;
}) {
  if (!COM_002_FLAGS.sliceB_demoPlatform) {
    redirect("/modules");
  }
  const { product: raw, surface } = await params;
  const product = parseDemoProduct(raw);
  if (!product) {
    redirect("/demo");
  }

  const jar = await cookies();
  const existingId = jar.get(DEMO_SESSION_COOKIE)?.value;
  const row = existingId ? getDemoSessionRecord(existingId) : null;
  if (!row || row.session.product !== product) {
    redirect(
      `/api/demo/start?product=${encodeURIComponent(product)}&surface=${encodeURIComponent(surface)}`
    );
  }

  return (
    <DemoChrome session={row.session} surface={surface}>
      <DemoSurfaceView session={row.session} surface={surface} />
    </DemoChrome>
  );
}

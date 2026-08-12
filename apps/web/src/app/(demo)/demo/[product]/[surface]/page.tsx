import { redirect } from "next/navigation";
import { parseDemoProduct } from "@mpa/shared";
import { DemoChrome } from "../../../../../components/demo/demo-chrome";
import { DemoSessionBootstrap } from "../../../../../components/demo/demo-session-bootstrap";
import { DemoSurfaceView } from "../../../../../components/demo/demo-surfaces";
import { readDemoCookiePair } from "../../../../../lib/demo/cookie";
import { isDemoRuntimeEnabled } from "../../../../../lib/demo/demo-runtime";
import { resolveDemoSessionRecord } from "../../../../../lib/demo/session-store";

export default async function DemoSurfacePage({
  params
}: {
  params: Promise<{ product: string; surface: string }>;
}) {
  if (!isDemoRuntimeEnabled()) {
    redirect("/demo");
  }
  const { product: raw, surface } = await params;
  const product = parseDemoProduct(raw);
  if (!product) {
    redirect("/demo");
  }

  const cookies = await readDemoCookiePair();
  const row = resolveDemoSessionRecord({
    sessionId: cookies.sessionId,
    stateToken: cookies.stateToken
  });

  if (!row || row.session.product !== product) {
    // Never blank: client bootstrap → /api/demo/start (durable cookies) → surface.
    return <DemoSessionBootstrap product={product} surface={surface} />;
  }

  return (
    <DemoChrome session={row.session} surface={surface}>
      <DemoSurfaceView session={row.session} surface={surface} />
    </DemoChrome>
  );
}

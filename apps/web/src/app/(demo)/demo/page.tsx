import { redirect } from "next/navigation";
import { DemoProductPicker } from "../../../components/demo/demo-product-picker";
import { createAuthServerClient } from "../../../lib/auth/server";
import { isDemoRuntimeEnabled } from "../../../lib/demo/demo-runtime";
import { DEMO_ROUTE_METADATA } from "../../../lib/demo/meta";

export const metadata = DEMO_ROUTE_METADATA;

export default async function DemoIndexPage() {
  if (!isDemoRuntimeEnabled()) {
    redirect("/modules");
  }
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return <DemoProductPicker isAuthenticated={Boolean(user)} />;
}

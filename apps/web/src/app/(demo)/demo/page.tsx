import { DemoProductPicker } from "../../../components/demo/demo-product-picker";
import { DemoUnavailablePage } from "../../../components/demo/demo-unavailable-page";
import { createAuthServerClient } from "../../../lib/auth/server";
import { isDemoRuntimeEnabled } from "../../../lib/demo/demo-runtime";
import { DEMO_ROUTE_METADATA } from "../../../lib/demo/meta";

export const metadata = DEMO_ROUTE_METADATA;

export default async function DemoIndexPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  if (!isDemoRuntimeEnabled()) {
    return <DemoUnavailablePage isAuthenticated={isAuthenticated} />;
  }

  return <DemoProductPicker isAuthenticated={isAuthenticated} />;
}

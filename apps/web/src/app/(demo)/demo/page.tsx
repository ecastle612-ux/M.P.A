import { DemoProductPicker } from "../../../components/demo/demo-product-picker";
import { createAuthServerClient } from "../../../lib/auth/server";
import { isDemoRuntimeEnabled } from "../../../lib/demo/demo-runtime";
import { DEMO_ROUTE_METADATA } from "../../../lib/demo/meta";

export const metadata = DEMO_ROUTE_METADATA;

/**
 * Live Demo hub — never redirects to /modules (pricing/product catalog).
 * When runtime is disabled, still renders a dedicated demo page with Get Started.
 */
export default async function DemoIndexPage() {
  const demoEnabled = isDemoRuntimeEnabled();
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return (
    <DemoProductPicker isAuthenticated={Boolean(user)} demoEnabled={demoEnabled} />
  );
}

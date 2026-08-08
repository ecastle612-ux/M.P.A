import { redirect } from "next/navigation";
import { COM_002_FLAGS } from "@mpa/shared";
import { DemoProductPicker } from "../../../components/demo/demo-product-picker";
import { createAuthServerClient } from "../../../lib/auth/server";

export default async function DemoIndexPage() {
  if (!COM_002_FLAGS.sliceB_demoPlatform) {
    redirect("/modules");
  }
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return <DemoProductPicker isAuthenticated={Boolean(user)} />;
}

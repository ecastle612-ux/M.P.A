import { redirect } from "next/navigation";
import { createAuthServerClient } from "../lib/auth/server";

export default async function HomePage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/portal");
  }

  redirect("/login");
}

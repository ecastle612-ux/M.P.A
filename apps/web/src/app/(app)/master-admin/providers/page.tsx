import { redirect } from "next/navigation";

/** UX-012 A09 — Providers SoT is Settings → Providers (`/settings/integrations`). */
export default function MasterAdminProvidersRedirectPage() {
  redirect("/settings/integrations");
}

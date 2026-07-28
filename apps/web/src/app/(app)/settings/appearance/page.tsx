import { redirect } from "next/navigation";
import { SETTINGS_PREFERENCES_HREF } from "../../../../lib/settings/nav";

/** UX-012 A09 — Appearance merged into Preferences. */
export default function AppearanceSettingsRedirectPage() {
  redirect(SETTINGS_PREFERENCES_HREF);
}

import { redirect } from "next/navigation";
import { SETTINGS_PREFERENCES_HREF } from "../../../../lib/settings/nav";

/** UX-012 A09 — Notifications merged into Preferences. */
export default function NotificationSettingsRedirectPage() {
  redirect(SETTINGS_PREFERENCES_HREF);
}

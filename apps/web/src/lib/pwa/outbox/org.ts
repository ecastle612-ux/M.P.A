/** Active organization id from client storage (org switcher SoT). */
export function getClientOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("mpa_active_organization_id");
  } catch {
    return null;
  }
}

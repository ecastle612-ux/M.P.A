import type { UserRole } from "@mpa/shared";

export function toPortalPath(role: UserRole): string {
  switch (role) {
    case "property_manager":
      return "/portal";
    case "property_owner":
      return "/portal";
    case "tenant":
      return "/portal/tenant";
    case "vendor":
      return "/portal/vendor";
    default:
      return "/portal";
  }
}

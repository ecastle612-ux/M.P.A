export const USER_ROLES = ["property_manager", "tenant", "property_owner", "vendor"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function toRoleLabel(role: UserRole): string {
  switch (role) {
    case "property_manager":
      return "Property Manager";
    case "tenant":
      return "Tenant";
    case "property_owner":
      return "Property Owner";
    case "vendor":
      return "Vendor";
    default:
      return "Unknown";
  }
}

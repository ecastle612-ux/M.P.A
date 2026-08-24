import { requireAuthorizedAction } from "../auth/require-authorized-action";

export async function requirePartnerServicesRead() {
  return requireAuthorizedAction({
    capability: "pm.maintenance:read",
    entitlement: "platform.partner_services"
  });
}

export async function requirePartnerServicesWrite() {
  return requireAuthorizedAction({
    capability: "pm.maintenance:write",
    entitlement: "platform.partner_services"
  });
}

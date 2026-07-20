import type { User } from "@supabase/supabase-js";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";

export async function canWriteMedia(input: {
  user: User;
  plane: "user" | "organization";
  organizationId: string | null;
  ownerUserId: string;
}): Promise<boolean> {
  if (input.plane === "user") {
    return input.ownerUserId === input.user.id;
  }
  if (!input.organizationId) return false;
  const context = await resolveAuthorizationContext(input.user, input.organizationId);
  return evaluatePermission(context, "media:write");
}

export async function canReadMedia(input: {
  user: User;
  plane: "user" | "organization";
  organizationId: string | null;
  ownerUserId: string;
}): Promise<boolean> {
  if (input.ownerUserId === input.user.id) return true;
  if (input.plane === "organization" && input.organizationId) {
    const context = await resolveAuthorizationContext(input.user, input.organizationId);
    return evaluatePermission(context, "media:read");
  }
  return false;
}

export async function canDeleteMedia(input: {
  user: User;
  plane: "user" | "organization";
  organizationId: string | null;
  ownerUserId: string;
}): Promise<boolean> {
  if (input.plane === "user") {
    return input.ownerUserId === input.user.id;
  }
  if (!input.organizationId) return false;
  const context = await resolveAuthorizationContext(input.user, input.organizationId);
  return evaluatePermission(context, "media:delete");
}

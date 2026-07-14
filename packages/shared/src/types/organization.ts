import { z } from "zod";
import { USER_ROLES } from "./roles";

export const organizationRoleSchema = z.enum(USER_ROLES);
export type OrganizationRole = z.infer<typeof organizationRoleSchema>;

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1)
});

export type Organization = z.infer<typeof organizationSchema>;

export const organizationMembershipSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  roles: z.array(organizationRoleSchema),
  status: z.enum(["active", "inactive"])
});

export type OrganizationMembership = z.infer<typeof organizationMembershipSchema>;

export const organizationInvitationStatusSchema = z.enum(["pending", "accepted", "revoked", "expired"]);

export const organizationInvitationSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  roles: z.array(organizationRoleSchema),
  status: organizationInvitationStatusSchema,
  token: z.string().uuid(),
  expiresAt: z.string()
});

export type OrganizationInvitation = z.infer<typeof organizationInvitationSchema>;

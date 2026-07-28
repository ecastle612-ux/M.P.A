export type PrincipalStatus = "pending" | "active" | "locked" | "disabled" | "archived";

export type PasswordState = "temporary_issued" | "permanent_set" | "reset_required";

export type IdentityPrincipal = {
  principalId: string;
  username: string;
  authProviderSubject: string;
  status: PrincipalStatus;
  passwordState: PasswordState;
  mustAcceptTerms: boolean;
  mustVerifyContact?: boolean;
  temporaryPasswordExpiresAt?: string | null;
};

export type ResolvedLoginTarget = {
  principal: IdentityPrincipal | null;
  /** Internal provider email — never expose to UI as identity. */
  providerEmail: string;
  dualRunEmail: boolean;
};

export type AuthenticateResult = {
  userId: string;
  principal: IdentityPrincipal | null;
  requiresFirstLoginGate: boolean;
  isMasterAdmin: boolean;
};

export type ChangePasswordInput = {
  newPassword: string;
  acceptTerms?: boolean;
};

/** AUTH-001 Slice B/C — Org Admin / invitee principal provision. */
export type ProvisionOrgAdminInput = {
  contactEmail: string;
  displayName?: string | null;
  /** Seed for MPA-generated username (org / company name preferred). */
  usernameSeed: string;
};

export type ProvisionOrgAdminResult = {
  principal: IdentityPrincipal;
  authUserId: string;
  /** Provider email (implementation detail; not product identity). */
  providerEmail: string;
};

export type ProvisionInviteeInput = {
  contactEmail: string;
  displayName?: string | null;
  usernameSeed: string;
};

export type IssueTemporaryPasswordResult = {
  temporaryPassword: string;
  expiresAt: string;
  username: string;
};

/** Design default from AUTH-001 §10 — temporary password TTL. */
export const TEMPORARY_PASSWORD_TTL_HOURS = 72;

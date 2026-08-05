/**
 * AUTH-001 Slice A — Identity Adapter.
 * Product rules use username principals; Supabase Auth remains the provider behind this boundary.
 */
import { createAuthServerClient, createServiceRoleServerClient } from "../server";
import { randomBytes, randomUUID } from "crypto";
import type {
  AuthenticateResult,
  ChangePasswordInput,
  IdentityPrincipal,
  IssueTemporaryPasswordResult,
  PasswordState,
  ProvisionInviteeInput,
  ProvisionOrgAdminInput,
  ProvisionOrgAdminResult,
  ResolvedLoginTarget
} from "./types";
import { TEMPORARY_PASSWORD_TTL_HOURS } from "./types";

type ResolveRow = {
  principal_id: string | null;
  username: string | null;
  auth_provider_subject: string;
  password_state: PasswordState | null;
  status: string | null;
  must_accept_terms: boolean | null;
  provider_email: string;
  dual_run_email: boolean;
};

// Tables may lag generated Database types until regeneration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) {
    throw new Error("Identity Adapter requires SUPABASE_SERVICE_ROLE_KEY");
  }
  return client;
}

function toPrincipal(row: ResolveRow): IdentityPrincipal | null {
  if (!row.principal_id || !row.username) return null;
  return {
    principalId: row.principal_id,
    username: row.username,
    authProviderSubject: row.auth_provider_subject,
    status: (row.status ?? "active") as IdentityPrincipal["status"],
    passwordState: (row.password_state ?? "permanent_set") as PasswordState,
    mustAcceptTerms: Boolean(row.must_accept_terms)
  };
}

export function requiresFirstLoginGate(principal: IdentityPrincipal | null): boolean {
  if (!principal) return false;
  if (principal.status === "disabled" || principal.status === "locked" || principal.status === "archived") {
    return false;
  }
  if (principal.passwordState === "temporary_issued" || principal.passwordState === "reset_required") {
    return true;
  }
  return principal.mustAcceptTerms;
}

export function requiresContactVerificationGate(principal: IdentityPrincipal | null): boolean {
  if (!principal) return false;
  if (principal.status === "disabled" || principal.status === "locked" || principal.status === "archived") {
    return false;
  }
  // After password gate cleared, contact verification may still be required.
  if (requiresFirstLoginGate(principal)) return false;
  return Boolean(principal.mustVerifyContact);
}

function temporaryPasswordExpiryIso(from: Date = new Date()): string {
  return new Date(from.getTime() + TEMPORARY_PASSWORD_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

function isTemporaryPasswordExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

/**
 * Resolve username (preferred) or dual-run email identifier to provider credentials.
 * Provider email is an implementation detail and must not be shown as product identity.
 */
export async function resolvePrincipal(identifier: string): Promise<ResolvedLoginTarget | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const admin = serviceClient();
  const { data, error } = await admin.rpc("auth_resolve_login_identifier", {
    p_identifier: trimmed
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ResolveRow[];
  const row = rows[0];
  if (!row?.provider_email || !row.auth_provider_subject) return null;

  return {
    principal: toPrincipal(row),
    providerEmail: row.provider_email,
    dualRunEmail: Boolean(row.dual_run_email)
  };
}

/**
 * Authenticate with username + password (commercial path).
 * Dual-run: email identifiers still resolve during migration (Q10) but UI presents username.
 */
export async function authenticate(username: string, password: string): Promise<AuthenticateResult> {
  const target = await resolvePrincipal(username);
  if (!target) {
    throw new Error("Invalid username or password.");
  }

  // Prefer full principal row (TTL / verify flags) when resolve RPC omits them.
  const gatedPrincipal = target.principal
    ? ((await getPrincipalByAuthSubject(target.principal.authProviderSubject).catch(() => null)) ??
      target.principal)
    : null;

  if (gatedPrincipal) {
    if (
      gatedPrincipal.status === "disabled" ||
      gatedPrincipal.status === "locked" ||
      gatedPrincipal.status === "archived"
    ) {
      throw new Error("This account is not available for sign-in.");
    }

    // AUTH-001 Slice C — reject expired temporary credentials before provider auth.
    if (
      gatedPrincipal.passwordState === "temporary_issued" &&
      isTemporaryPasswordExpired(gatedPrincipal.temporaryPasswordExpiresAt)
    ) {
      throw new Error(
        "Temporary password expired. Ask your organization administrator to resend invitation credentials."
      );
    }
  }

  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: target.providerEmail,
    password
  });

  if (error || !data.user) {
    throw new Error("Invalid username or password.");
  }

  const principal =
    gatedPrincipal ?? (await getPrincipalByAuthSubject(data.user.id).catch(() => null));

  return {
    userId: data.user.id,
    principal,
    requiresFirstLoginGate: requiresFirstLoginGate(principal),
    isMasterAdmin: data.user.app_metadata?.["dev_master_admin"] === true // MAC-002: app_metadata only
  };
}

export async function getPrincipalByAuthSubject(authUserId: string): Promise<IdentityPrincipal | null> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("identity_principals")
    .select(
      "principal_id, username, auth_provider_subject, status, password_state, must_accept_terms, must_verify_contact, temporary_password_expires_at"
    )
    .eq("auth_provider_subject", authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    principalId: data.principal_id as string,
    username: data.username as string,
    authProviderSubject: data.auth_provider_subject as string,
    status: data.status as IdentityPrincipal["status"],
    passwordState: data.password_state as PasswordState,
    mustAcceptTerms: Boolean(data.must_accept_terms),
    mustVerifyContact: Boolean(data.must_verify_contact),
    temporaryPasswordExpiresAt: (data.temporary_password_expires_at as string | null) ?? null
  };
}

/**
 * Complete first-login / forced password change. Marks temp consumed; revokes other sessions.
 */
export async function completePasswordChange(
  authUserId: string,
  input: ChangePasswordInput
): Promise<void> {
  const password = input.newPassword;
  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || user.id !== authUserId) {
    throw new Error("Not authenticated.");
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    throw new Error(updateError.message);
  }

  const admin = serviceClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    password_state: "permanent_set",
    must_accept_terms: false,
    temporary_password_expires_at: null,
    updated_at: now
  };
  if (input.acceptTerms !== false) {
    patch["terms_accepted_at"] = now;
  }

  // Keep must_verify_contact until contact verification completes (Slice C).
  const { error: principalError } = await admin
    .from("identity_principals")
    .update(patch)
    .eq("auth_provider_subject", authUserId);

  if (principalError) {
    throw new Error(principalError.message);
  }

  await revokeOtherSessions(authUserId);
}

/** Revoke other sessions for the principal (password change). */
export async function revokeOtherSessions(authUserId: string): Promise<void> {
  const admin = serviceClient();
  try {
    await admin.auth.admin.signOut(authUserId, "others");
  } catch {
    // Best-effort; password change already succeeded.
  }
}

/** AUTH-001 Slice E — revoke all sessions (recovery / offboarding). */
export async function revokeAllSessions(authUserId: string): Promise<void> {
  const admin = serviceClient();
  try {
    await admin.auth.admin.signOut(authUserId, "global");
  } catch {
    // Best-effort; privileged action already succeeded.
  }
}

/** AUTH-001 Slice E — set principal lifecycle status (disable / archive / restore). */
export async function setPrincipalStatus(
  authUserId: string,
  status: IdentityPrincipal["status"]
): Promise<void> {
  const admin = serviceClient();
  const { error } = await admin
    .from("identity_principals")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("auth_provider_subject", authUserId);
  if (error) {
    throw new Error(error.message);
  }
}

/** Public signup is forbidden (AUTH-001 invitation-only). */
export function rejectPublicSignup(): never {
  throw new Error("Public registration is disabled. Accounts are invitation-only.");
}

function normalizeUsernameSeed(seed: string): string {
  let base = seed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (base.length < 6) {
    base = `${base}orguser`.slice(0, 6);
  }
  if (base.length > 24) {
    base = base.slice(0, 24);
  }
  if (["admin", "root", "support", "mpa", "system", "master", "null", "undefined"].includes(base)) {
    base = `org${base}`.slice(0, 24);
  }
  return base;
}

function generateTemporaryPassword(): string {
  // Plaintext exists only in the send pipeline / caller memory — never logged or evented.
  return `Tmp${randomBytes(18).toString("base64url")}`;
}

async function registerUniqueUsername(
  admin: AnyClient,
  principalId: string,
  usernameSeed: string,
  contactEmail: string
): Promise<string> {
  const base = normalizeUsernameSeed(usernameSeed || contactEmail.split("@")[0] || "orguser");
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}${String(suffix).padStart(2, "0")}`.slice(0, 32);
    try {
      const { data, error } = await admin.rpc("auth_register_username", {
        p_username: candidate,
        p_principal_id: principalId
      });
      if (error) {
        if (String(error.message).includes("unavailable") || String(error.message).includes("retired")) {
          continue;
        }
        throw new Error(error.message);
      }
      return typeof data === "string" ? data : candidate;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("unavailable") || message.includes("retired")) continue;
      throw err;
    }
  }
  throw new Error("Unable to issue a unique username.");
}

/**
 * AUTH-001 Slice C — issue (or re-issue) a temporary password with TTL.
 * Returns plaintext once for the secure email send pipeline only.
 */
export async function issueTemporaryPassword(authUserId: string): Promise<IssueTemporaryPasswordResult> {
  const admin = serviceClient();
  const principal = await getPrincipalByAuthSubject(authUserId);
  if (!principal) {
    throw new Error("Principal not found for temporary password issue.");
  }

  const temporaryPassword = generateTemporaryPassword();
  const expiresAt = temporaryPasswordExpiryIso();

  const { error: updateError } = await admin.auth.admin.updateUserById(authUserId, {
    password: temporaryPassword
  });
  if (updateError) {
    throw new Error(updateError.message ?? "Failed to set temporary password.");
  }

  const now = new Date().toISOString();
  const { error: principalError } = await admin
    .from("identity_principals")
    .update({
      password_state: "temporary_issued",
      temporary_password_expires_at: expiresAt,
      must_accept_terms: true,
      updated_at: now
    })
    .eq("auth_provider_subject", authUserId);

  if (principalError) {
    throw new Error(principalError.message);
  }

  return {
    temporaryPassword,
    expiresAt,
    username: principal.username
  };
}

async function provisionUsernamePrincipal(input: {
  contactEmail: string;
  displayName?: string | null;
  usernameSeed: string;
  provisionTag: string;
}): Promise<ProvisionOrgAdminResult> {
  const contactEmail = input.contactEmail.trim().toLowerCase();
  if (!contactEmail || !contactEmail.includes("@")) {
    throw new Error("Valid contact email is required.");
  }

  const admin = serviceClient();
  const temporaryPassword = generateTemporaryPassword();
  const principalId = randomUUID();
  const username = await registerUniqueUsername(admin, principalId, input.usernameSeed, contactEmail);
  const providerEmail = `${username}@users.mpa.local`;
  const expiresAt = temporaryPasswordExpiryIso();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: providerEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      display_name: input.displayName?.trim() || null,
      contact_email: contactEmail
    },
    app_metadata: {
      mpa_contact_email: contactEmail,
      mpa_provisioned: input.provisionTag
    }
  });

  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Failed to create auth user.");
  }

  const authUserId = created.user.id;
  const now = new Date().toISOString();

  const { error: principalError } = await admin.from("identity_principals").insert({
    principal_id: principalId,
    username,
    auth_provider_subject: authUserId,
    status: "active",
    password_state: "temporary_issued",
    must_accept_terms: true,
    must_verify_contact: true,
    temporary_password_expires_at: expiresAt,
    created_at: now,
    updated_at: now
  });

  if (principalError) {
    await admin.auth.admin.deleteUser(authUserId).catch(() => undefined);
    throw new Error(principalError.message);
  }

  try {
    await admin.from("user_profiles").upsert(
      {
        user_id: authUserId,
        display_name: input.displayName?.trim() || username,
        contact_email: contactEmail,
        contact_email_verified_at: null,
        updated_at: now
      },
      { onConflict: "user_id" }
    );
  } catch {
    // Profile upsert best-effort.
  }

  return {
    authUserId,
    providerEmail,
    principal: {
      principalId,
      username,
      authProviderSubject: authUserId,
      status: "active",
      passwordState: "temporary_issued",
      mustAcceptTerms: true,
      mustVerifyContact: true,
      temporaryPasswordExpiresAt: expiresAt
    }
  };
}

/**
 * AUTH-001 Slice B — provision Organization Administrator principal.
 * Creates auth user + username registry + identity_principals (temporary_issued).
 * Credential email delivery is Slice C (`deliverOrgAdminWelcome`).
 */
export async function provisionOrgAdminPrincipal(
  input: ProvisionOrgAdminInput
): Promise<ProvisionOrgAdminResult> {
  return provisionUsernamePrincipal({
    contactEmail: input.contactEmail,
    ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
    usernameSeed: input.usernameSeed,
    provisionTag: "auth001_slice_b"
  });
}

/**
 * AUTH-001 Slice C — provision invitee principal (MPA-generated username).
 */
export async function provisionInviteePrincipal(
  input: ProvisionInviteeInput
): Promise<ProvisionOrgAdminResult> {
  return provisionUsernamePrincipal({
    contactEmail: input.contactEmail,
    ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
    usernameSeed: input.usernameSeed,
    provisionTag: "auth001_slice_c"
  });
}

export async function clearMustVerifyContact(authUserId: string): Promise<void> {
  const admin = serviceClient();
  const { error } = await admin
    .from("identity_principals")
    .update({ must_verify_contact: false, updated_at: new Date().toISOString() })
    .eq("auth_provider_subject", authUserId);
  if (error) throw new Error(error.message);
}

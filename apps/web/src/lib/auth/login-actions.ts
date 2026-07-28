"use server";

import { redirect } from "next/navigation";
import {
  authenticate,
  rejectPublicSignup,
  completePasswordChange,
  clearMustVerifyContact,
  getPrincipalByAuthSubject
} from "./identity";
import { createAuthServerClient } from "./server";
import {
  issueContactVerification,
  resolveOrganizationIdForUser,
  isContactEmailVerified
} from "./contact-verification";
import { serverEnv } from "../env/server-env";

export type LoginActionState = {
  error?: string;
  notice?: string;
};

function readCredential(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function loginErrorRedirect(message: string): never {
  const params = new URLSearchParams();
  params.set("error", message);
  redirect(`/login?${params.toString()}`);
}

function safePostLoginPath(value: string): string | null {
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/login") || value.startsWith("/first-login")) return null;
  return value;
}

/**
 * AUTH-001 Slice A — username + password via Identity Adapter.
 */
export async function signInAction(formData: FormData): Promise<void> {
  const username = readCredential(formData, "username");
  const password = readCredential(formData, "password");
  const nextRaw = readCredential(formData, "next");
  const next = nextRaw ? safePostLoginPath(nextRaw) : null;

  if (!username || !password) {
    loginErrorRedirect("Username and password are required.");
  }

  try {
    const result = await authenticate(username, password);
    if (result.requiresFirstLoginGate) {
      redirect("/first-login");
    }
    if (next) {
      redirect(next);
    }
    redirect(result.isMasterAdmin ? "/master-admin" : "/dashboard");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign-in failed.";
    loginErrorRedirect(message);
  }
}

/**
 * AUTH-001 invitation-only: public signup is disabled.
 */
export async function signUpAction(_formData: FormData): Promise<void> {
  void _formData;
  try {
    rejectPublicSignup();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Public registration is disabled.";
    const params = new URLSearchParams({ error: message });
    redirect(`/login?${params.toString()}`);
  }
}

export async function firstLoginPasswordAction(formData: FormData): Promise<void> {
  const password = readCredential(formData, "password");
  const confirmPassword = readCredential(formData, "confirmPassword");
  const acceptTerms = formData.get("acceptTerms") === "on";

  if (!password || !confirmPassword) {
    redirect(`/first-login?error=${encodeURIComponent("Password and confirmation are required.")}`);
  }
  if (password !== confirmPassword) {
    redirect(`/first-login?error=${encodeURIComponent("Passwords do not match.")}`);
  }
  if (!acceptTerms) {
    redirect(`/first-login?error=${encodeURIComponent("You must accept the Terms of Service.")}`);
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  try {
    await completePasswordChange(user.id, { newPassword: password, acceptTerms: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to update password.";
    redirect(`/first-login?error=${encodeURIComponent(message)}`);
  }

  // AUTH-001 Slice C — contact verification after first-login password change.
  const principal = await getPrincipalByAuthSubject(user.id).catch(() => null);
  if (principal?.mustVerifyContact && !(await isContactEmailVerified(user.id))) {
    const organizationId = await resolveOrganizationIdForUser(user.id);
    if (organizationId) {
      await issueContactVerification({ authUserId: user.id, organizationId }).catch(() => undefined);
    }
    redirect("/verify-contact");
  }
  if (principal && !principal.mustVerifyContact) {
    await clearMustVerifyContact(user.id).catch(() => undefined);
  }

  const isMasterAdmin = user.app_metadata?.["dev_master_admin"] === true;
  redirect(isMasterAdmin ? "/master-admin" : "/dashboard");
}

/**
 * AUTH-001 Slice A — authenticated password change (recovery / forced reset path).
 * Updates provider password via Identity Adapter, marks permanent_set, revokes other sessions.
 */
export async function authenticatedPasswordChangeAction(
  _prev: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const password = readCredential(formData, "password");
  const confirmPassword = readCredential(formData, "confirmPassword");

  if (!password || !confirmPassword) {
    return { error: "Password and confirmation are required." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (password.length < 12) {
    return { error: "Password must be at least 12 characters." };
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Recovery session missing or expired. Request a new password reset email." };
  }

  try {
    await completePasswordChange(user.id, { newPassword: password, acceptTerms: false });
    await supabase.auth.signOut();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unable to update password." };
  }

  return { notice: "Password updated. You can sign in with your username." };
}

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  // AUTH-001 Slice E (SE-01 / R-01): Org Admin self-serve forgot-password is forbidden.
  // Contact-email reset remains only for non–Org-Admin dual-run accounts.
  const email = readCredential(formData, "email");
  if (!email) {
    redirect(`/forgot-password?error=${encodeURIComponent("Email is required.")}`);
  }

  const { isCommercialOrgAdminUser, resolveUserIdByContactOrUsername } = await import(
    "./recovery/membership-helpers"
  );
  const userId = await resolveUserIdByContactOrUsername(email);
  if (userId && (await isCommercialOrgAdminUser(userId))) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        "Organization Administrator recovery requires M.P.A. support verification. Self-serve reset is unavailable."
      )}`
    );
  }

  const supabase = await createAuthServerClient();
  const origin = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/forgot-password?notice=${encodeURIComponent("Password reset link sent. Check your inbox.")}`
  );
}

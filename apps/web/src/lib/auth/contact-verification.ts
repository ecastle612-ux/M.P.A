/**
 * AUTH-001 Slice C — contact email verification (not login identity).
 */
import { createHash, randomBytes } from "crypto";
import { createServiceRoleServerClient } from "./server";
import { clearMustVerifyContact } from "./identity";
import { sendWorkflowEmail } from "../integrations/email/delivery";
import { emitOpsDomainEvent } from "../ops/emit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const VERIFY_TTL_HOURS = 48;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Contact verification requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function isContactEmailVerified(authUserId: string): Promise<boolean> {
  const admin = serviceClient();
  const { data } = await admin
    .from("user_profiles")
    .select("contact_email_verified_at")
    .eq("user_id", authUserId)
    .maybeSingle();
  return Boolean(data?.contact_email_verified_at);
}

export async function issueContactVerification(input: {
  authUserId: string;
  organizationId: string;
}): Promise<{ sent: boolean; email: string | null }> {
  const admin = serviceClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("contact_email, contact_email_verified_at")
    .eq("user_id", input.authUserId)
    .maybeSingle();

  const email = String(profile?.contact_email ?? "")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) {
    return { sent: false, email: null };
  }
  if (profile?.contact_email_verified_at) {
    await clearMustVerifyContact(input.authUserId);
    return { sent: false, email };
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIFY_TTL_HOURS * 60 * 60 * 1000).toISOString();

  await admin.from("contact_email_verifications").insert({
    user_id: input.authUserId,
    email,
    token_hash: tokenHash,
    expires_at: expiresAt
  });

  const result = await sendWorkflowEmail({
    organizationId: input.organizationId,
    templateKey: "general_notification",
    idempotencyKey: `contact_verify:${input.authUserId}:${tokenHash.slice(0, 16)}`,
    to: { email },
    subject: "Verify your contact email — M.P.A.",
    title: "Verify your contact email",
    ctaLabel: "Verify email",
    body: [
      `Confirm this contact email for your M.P.A. account.`,
      `This does not change how you sign in — you still use your username.`,
      ``,
      `This link expires in ${VERIFY_TTL_HOURS} hours.`
    ].join("\n"),
    href: `/verify-contact/${token}`,
    correlation: {
      sourceEntityType: "contact_email_verification",
      sourceEntityId: input.authUserId
    },
    tags: { auth_slice: "c", purpose: "contact_verify" }
  });

  return { sent: result.status !== "failed", email };
}

export async function confirmContactVerification(token: string): Promise<{ userId: string }> {
  const admin = serviceClient();
  const tokenHash = hashToken(token.trim());
  const { data, error } = await admin
    .from("contact_email_verifications")
    .select("id, user_id, email, expires_at, consumed_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Verification link is invalid.");
  if (data.consumed_at) throw new Error("Verification link already used.");
  if (new Date(String(data.expires_at)).getTime() < Date.now()) {
    throw new Error("Verification link expired.");
  }

  const now = new Date().toISOString();
  const userId = String(data.user_id);
  const email = String(data.email).toLowerCase();

  await admin
    .from("contact_email_verifications")
    .update({ consumed_at: now })
    .eq("id", data.id);

  await admin.from("user_profiles").upsert(
    {
      user_id: userId,
      contact_email: email,
      contact_email_verified_at: now,
      updated_at: now
    },
    { onConflict: "user_id" }
  );

  await clearMustVerifyContact(userId);

  try {
    const { data: membership } = await admin
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (membership?.organization_id) {
      await emitOpsDomainEvent(
        admin,
        {
          eventType: "auth.contact_email.verified",
          organizationId: String(membership.organization_id),
          subject: { type: "user", id: userId },
          actor: { actor_type: "user", principal_id: userId, label: "User" },
          summary: "Contact email verified",
          payload: { userId },
          visibility: "staff_only",
          sensitivity: "normal"
        },
        { dispatchNow: true }
      );
    }
  } catch {
    // Best-effort.
  }

  return { userId };
}

/** Resolve a default org id for verification email correlation. */
export async function resolveOrganizationIdForUser(authUserId: string): Promise<string | null> {
  const admin = serviceClient();
  const { data } = await admin
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", authUserId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.organization_id ? String(data.organization_id) : null;
}

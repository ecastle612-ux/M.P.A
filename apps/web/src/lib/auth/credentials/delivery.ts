/**
 * AUTH-001 Slice C — welcome / invitation credential delivery via EML-001.
 * Plaintext temporary passwords exist only in this send pipeline.
 */
import { createServiceRoleServerClient } from "../server";
import { issueTemporaryPassword } from "../identity";
import { sendWorkflowEmail } from "../../integrations/email/delivery";
import { emitOpsDomainEvent } from "../../ops/emit";
import { TEMPORARY_PASSWORD_TTL_HOURS } from "../identity/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Credential delivery requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export type DeliveryResult = {
  status: "sent" | "failed" | "skipped";
  idempotentReplay: boolean;
  attemptCount: number;
};

async function emitDeliveryEvent(
  admin: AnyClient,
  input: {
    organizationId: string;
    userId: string;
    eventType: "auth.credentials.delivered" | "auth.credentials.delivery_failed";
    deliveryKind: string;
    invitationId?: string | null;
  }
): Promise<void> {
  try {
    await emitOpsDomainEvent(
      admin,
      {
        eventType: input.eventType,
        organizationId: input.organizationId,
        subject: { type: "user", id: input.userId },
        actor: { actor_type: "system", label: "AUTH-001 credentials" },
        summary:
          input.eventType === "auth.credentials.delivered"
            ? "Credentials delivered"
            : "Credential delivery failed",
        payload: {
          deliveryKind: input.deliveryKind,
          invitationId: input.invitationId ?? null
        },
        visibility: "staff_only",
        sensitivity: "normal"
      },
      { dispatchNow: true }
    );
  } catch {
    // Delivery outcome event is best-effort; never block send pipeline retries.
  }
}

/**
 * Deliver Org Admin welcome + temporary credentials after Slice B provision.
 * Idempotent on organizationId + userId welcome key (anti-spam).
 */
export async function deliverOrgAdminWelcome(input: {
  organizationId: string;
  orgAdminUserId: string;
  contactEmail: string;
  organizationName?: string | null;
  /** Force a new send (e.g. authorized resend after expiry). */
  forceResend?: boolean;
}): Promise<DeliveryResult> {
  const admin = serviceClient();
  const contactEmail = input.contactEmail.trim().toLowerCase();
  const idempotencyKey = `org_admin_welcome:${input.organizationId}:${input.orgAdminUserId}`;

  const { data: existing } = await admin
    .from("credential_deliveries")
    .select("id, status, attempt_count")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing?.status === "sent" && !input.forceResend) {
    return {
      status: "skipped",
      idempotentReplay: true,
      attemptCount: Number(existing.attempt_count ?? 0)
    };
  }

  const attemptCount = Number(existing?.attempt_count ?? 0) + 1;
  const now = new Date().toISOString();
  const ledgerKey = input.forceResend
    ? `${idempotencyKey}:resend:${Date.now()}`
    : idempotencyKey;

  await admin.from("credential_deliveries").upsert(
    {
      organization_id: input.organizationId,
      user_id: input.orgAdminUserId,
      delivery_kind: input.forceResend ? "temp_reissue" : "org_admin_welcome",
      idempotency_key: ledgerKey,
      status: "pending",
      attempt_count: attemptCount,
      last_error: null,
      updated_at: now
    },
    { onConflict: "idempotency_key" }
  );

  // Re-issue so send pipeline has a fresh TTL-bounded secret (never read from storage).
  let issued;
  try {
    issued = await issueTemporaryPassword(input.orgAdminUserId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to issue temporary password";
    await admin
      .from("credential_deliveries")
      .update({
        status: "failed",
        last_error: message.slice(0, 500),
        attempt_count: attemptCount,
        updated_at: new Date().toISOString()
      })
      .eq("idempotency_key", ledgerKey);
    await emitDeliveryEvent(admin, {
      organizationId: input.organizationId,
      userId: input.orgAdminUserId,
      eventType: "auth.credentials.delivery_failed",
      deliveryKind: "org_admin_welcome"
    });
    return { status: "failed", idempotentReplay: false, attemptCount };
  }

  const orgLabel = input.organizationName?.trim() || "your organization";
  const body = [
    `Welcome to My Property Assistant.`,
    ``,
    `Your organization (${orgLabel}) is ready.`,
    `Sign in with the username below and this temporary password. You will be required to change it on first login.`,
    ``,
    `Username: ${issued.username}`,
    `Temporary password: ${issued.temporaryPassword}`,
    `Expires in: ${TEMPORARY_PASSWORD_TTL_HOURS} hours`,
    ``,
    `This email is the only place the temporary password is shown.`
  ].join("\n");

  // Drop plaintext reference after building body.
  const usernameForEvent = issued.username;
  delete (issued as { temporaryPassword?: string }).temporaryPassword;

  const sendResult = await sendWorkflowEmail({
    organizationId: input.organizationId,
    templateKey: "welcome_email",
    idempotencyKey: ledgerKey,
    to: { email: contactEmail, name: usernameForEvent },
    subject: "Welcome to M.P.A. — your sign-in credentials",
    title: "Welcome to My Property Assistant",
    ctaLabel: "Sign in",
    body,
    href: "/login",
    correlation: {
      sourceEntityType: "credential_delivery",
      sourceEntityId: input.orgAdminUserId
    },
    tags: { auth_slice: "c", delivery_kind: "org_admin_welcome" }
  });

  if (sendResult.status === "failed") {
    await admin
      .from("credential_deliveries")
      .update({
        status: "failed",
        last_error: (sendResult.errorMessage ?? "send failed").slice(0, 500),
        attempt_count: attemptCount,
        updated_at: new Date().toISOString()
      })
      .eq("idempotency_key", ledgerKey);
    await emitDeliveryEvent(admin, {
      organizationId: input.organizationId,
      userId: input.orgAdminUserId,
      eventType: "auth.credentials.delivery_failed",
      deliveryKind: "org_admin_welcome"
    });
    return { status: "failed", idempotentReplay: false, attemptCount };
  }

  await admin
    .from("credential_deliveries")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      attempt_count: attemptCount,
      last_error: null,
      updated_at: new Date().toISOString()
    })
    .eq("idempotency_key", ledgerKey);

  await emitDeliveryEvent(admin, {
    organizationId: input.organizationId,
    userId: input.orgAdminUserId,
    eventType: "auth.credentials.delivered",
    deliveryKind: "org_admin_welcome"
  });

  return { status: "sent", idempotentReplay: false, attemptCount };
}

/**
 * Deliver invitation credentials (username + temporary password) using user_invitation template.
 */
export async function deliverInvitationCredentials(input: {
  organizationId: string;
  invitationId: string;
  userId: string;
  contactEmail: string;
  token: string;
  roles: string[];
  forceResend?: boolean;
}): Promise<DeliveryResult> {
  const admin = serviceClient();
  const contactEmail = input.contactEmail.trim().toLowerCase();
  const baseKey = `invitation_credentials:${input.invitationId}`;
  const idempotencyKey = input.forceResend ? `${baseKey}:resend:${Date.now()}` : baseKey;

  if (!input.forceResend) {
    const { data: existing } = await admin
      .from("credential_deliveries")
      .select("status, attempt_count")
      .eq("idempotency_key", baseKey)
      .maybeSingle();
    if (existing?.status === "sent") {
      return {
        status: "skipped",
        idempotentReplay: true,
        attemptCount: Number(existing.attempt_count ?? 0)
      };
    }
  }

  const attemptCount = 1;
  const now = new Date().toISOString();

  await admin.from("credential_deliveries").upsert(
    {
      organization_id: input.organizationId,
      user_id: input.userId,
      delivery_kind: input.forceResend ? "temp_reissue" : "invitation_credentials",
      idempotency_key: idempotencyKey,
      status: "pending",
      attempt_count: attemptCount,
      invitation_id: input.invitationId,
      last_error: null,
      updated_at: now
    },
    { onConflict: "idempotency_key" }
  );

  let issued;
  try {
    issued = await issueTemporaryPassword(input.userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to issue temporary password";
    await admin
      .from("credential_deliveries")
      .update({
        status: "failed",
        last_error: message.slice(0, 500),
        updated_at: new Date().toISOString()
      })
      .eq("idempotency_key", idempotencyKey);
    await admin
      .from("organization_invitations")
      .update({ delivery_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", input.invitationId);
    await emitDeliveryEvent(admin, {
      organizationId: input.organizationId,
      userId: input.userId,
      eventType: "auth.credentials.delivery_failed",
      deliveryKind: "invitation_credentials",
      invitationId: input.invitationId
    });
    return { status: "failed", idempotentReplay: false, attemptCount };
  }

  const roleLabel = input.roles.length ? input.roles.join(", ") : "member";
  const body = [
    `You have been invited to join an organization on My Property Assistant as ${roleLabel}.`,
    ``,
    `Sign in with the username and temporary password below, then accept your invitation.`,
    ``,
    `Username: ${issued.username}`,
    `Temporary password: ${issued.temporaryPassword}`,
    `Expires in: ${TEMPORARY_PASSWORD_TTL_HOURS} hours`,
    ``,
    `After signing in, open the accept link to activate your membership.`
  ].join("\n");

  delete (issued as { temporaryPassword?: string }).temporaryPassword;

  const sendResult = await sendWorkflowEmail({
    organizationId: input.organizationId,
    templateKey: "user_invitation",
    idempotencyKey,
    to: { email: contactEmail, name: issued.username },
    subject: "You're invited to M.P.A.",
    title: "You're invited to M.P.A.",
    ctaLabel: "Accept invitation",
    body,
    href: `/accept-invitation/${input.token}`,
    correlation: {
      sourceEntityType: "organization_invitation",
      sourceEntityId: input.invitationId
    },
    tags: { auth_slice: "c", delivery_kind: "invitation_credentials" }
  });

  if (sendResult.status === "failed") {
    await admin
      .from("credential_deliveries")
      .update({
        status: "failed",
        last_error: (sendResult.errorMessage ?? "send failed").slice(0, 500),
        updated_at: new Date().toISOString()
      })
      .eq("idempotency_key", idempotencyKey);
    await admin
      .from("organization_invitations")
      .update({ delivery_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", input.invitationId);
    await emitDeliveryEvent(admin, {
      organizationId: input.organizationId,
      userId: input.userId,
      eventType: "auth.credentials.delivery_failed",
      deliveryKind: "invitation_credentials",
      invitationId: input.invitationId
    });
    return { status: "failed", idempotentReplay: false, attemptCount };
  }

  await admin
    .from("credential_deliveries")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString()
    })
    .eq("idempotency_key", idempotencyKey);

  await admin
    .from("organization_invitations")
    .update({
      delivery_status: "sent",
      last_delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", input.invitationId);

  await emitDeliveryEvent(admin, {
    organizationId: input.organizationId,
    userId: input.userId,
    eventType: "auth.credentials.delivered",
    deliveryKind: "invitation_credentials",
    invitationId: input.invitationId
  });

  return { status: "sent", idempotentReplay: false, attemptCount };
}

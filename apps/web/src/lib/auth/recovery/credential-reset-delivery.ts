/**
 * AUTH-001 Slice E — deliver temporary credentials after recovery / subaccount reset.
 * Reuses Slice C issueTemporaryPassword + EML-001; plaintext only in send pipeline.
 */
import { issueTemporaryPassword, TEMPORARY_PASSWORD_TTL_HOURS } from "../identity";
import { sendWorkflowEmail } from "../../integrations/email/delivery";
import { createServiceRoleServerClient } from "../server";
import { emitOpsDomainEvent } from "../../ops/emit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Credential reset delivery requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export type CredentialResetDeliveryResult = {
  status: "sent" | "failed";
  attemptCount: number;
  username: string | null;
};

export async function deliverCredentialReset(input: {
  organizationId: string;
  userId: string;
  contactEmail: string;
  deliveryKind: "org_admin_recovery" | "subaccount_reset";
  reasonCode: string;
}): Promise<CredentialResetDeliveryResult> {
  const admin = serviceClient();
  const contactEmail = input.contactEmail.trim().toLowerCase();
  const idempotencyKey = `${input.deliveryKind}:${input.organizationId}:${input.userId}:${Date.now()}`;
  const now = new Date().toISOString();

  await admin.from("credential_deliveries").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    delivery_kind: "temp_reissue",
    idempotency_key: idempotencyKey,
    status: "pending",
    attempt_count: 1,
    last_error: null,
    updated_at: now
  });

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
    await emitOpsDomainEvent(
      admin,
      {
        eventType: "auth.credentials.delivery_failed",
        organizationId: input.organizationId,
        subject: { type: "user", id: input.userId },
        actor: { actor_type: "system", label: "AUTH-001 recovery credentials" },
        summary: "Credential delivery failed",
        payload: { deliveryKind: input.deliveryKind, reasonCode: input.reasonCode },
        visibility: "staff_only",
        sensitivity: "normal"
      },
      { dispatchNow: true }
    ).catch(() => undefined);
    return { status: "failed", attemptCount: 1, username: null };
  }

  const purpose =
    input.deliveryKind === "org_admin_recovery"
      ? "Your Organization Administrator credentials were recovered by M.P.A. support."
      : "Your Organization Administrator reset your sign-in credentials.";

  const body = [
    purpose,
    ``,
    `Sign in with the username and temporary password below. You must set a new password after signing in.`,
    ``,
    `Username: ${issued.username}`,
    `Temporary password: ${issued.temporaryPassword}`,
    `Expires in: ${TEMPORARY_PASSWORD_TTL_HOURS} hours`,
    ``,
    `This email is the only place the temporary password is shown.`
  ].join("\n");

  const username = issued.username;
  // Plaintext must not linger after body construction.
  Reflect.deleteProperty(issued as object, "temporaryPassword");

  const sendResult = await sendWorkflowEmail({
    organizationId: input.organizationId,
    templateKey: "welcome_email",
    idempotencyKey,
    to: { email: contactEmail, name: username },
    subject: "M.P.A. temporary sign-in credentials",
    title: "Temporary credentials issued",
    ctaLabel: "Sign in",
    body,
    href: "/login",
    correlation: {
      sourceEntityType: "credential_delivery",
      sourceEntityId: input.userId
    },
    tags: { auth_slice: "e", delivery_kind: input.deliveryKind, reason: input.reasonCode }
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
    await emitOpsDomainEvent(
      admin,
      {
        eventType: "auth.credentials.delivery_failed",
        organizationId: input.organizationId,
        subject: { type: "user", id: input.userId },
        actor: { actor_type: "system", label: "AUTH-001 recovery credentials" },
        summary: "Credential delivery failed",
        payload: { deliveryKind: input.deliveryKind, reasonCode: input.reasonCode },
        visibility: "staff_only",
        sensitivity: "normal"
      },
      { dispatchNow: true }
    ).catch(() => undefined);
    return { status: "failed", attemptCount: 1, username };
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

  await emitOpsDomainEvent(
    admin,
    {
      eventType: "auth.credentials.delivered",
      organizationId: input.organizationId,
      subject: { type: "user", id: input.userId },
      actor: { actor_type: "system", label: "AUTH-001 recovery credentials" },
      summary: "Credentials delivered",
      payload: { deliveryKind: input.deliveryKind, reasonCode: input.reasonCode },
      visibility: "staff_only",
      sensitivity: "normal"
    },
    { dispatchNow: true }
  ).catch(() => undefined);

  return { status: "sent", attemptCount: 1, username };
}

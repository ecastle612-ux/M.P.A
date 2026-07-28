/**
 * AUTH-001 Slice E — append-only privileged audit (A07).
 * Never store passwords, temporary credentials, or MFA secrets.
 */
import { createServiceRoleServerClient } from "../server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Privileged audit requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export type PrivilegedActorType =
  | "system"
  | "org_admin"
  | "subaccount"
  | "master_admin"
  | "support"
  | "implementation_specialist";

export type PrivilegedAuditInput = {
  actorUserId?: string | null | undefined;
  actorType: PrivilegedActorType;
  organizationId?: string | null | undefined;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string | null | undefined;
  ipAddress?: string | null | undefined;
  device?: string | null | undefined;
  beforeState?: Record<string, unknown> | null | undefined;
  afterState?: Record<string, unknown> | null | undefined;
  correlationId?: string | null | undefined;
  metadata?: Record<string, unknown> | undefined;
};

const FORBIDDEN_KEYS = [
  "password",
  "temporaryPassword",
  "temporary_password",
  "tempPassword",
  "temp_password",
  "secret",
  "mfa",
  "token",
  "verification_token"
];

function scrub(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(scrub);
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = scrub(nested);
  }
  return out;
}

export async function recordPrivilegedAudit(input: PrivilegedAuditInput): Promise<string> {
  const admin = serviceClient();
  const metadata = scrub(input.metadata ?? {}) as Record<string, unknown>;
  const beforeState = input.beforeState
    ? (scrub(input.beforeState) as Record<string, unknown>)
    : null;
  const afterState = input.afterState
    ? (scrub(input.afterState) as Record<string, unknown>)
    : null;

  const { data, error } = await admin
    .from("auth_privileged_audit")
    .insert({
      actor_user_id: input.actorUserId ?? null,
      actor_type: input.actorType,
      organization_id: input.organizationId ?? null,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason ?? null,
      ip_address: input.ipAddress ?? null,
      device: input.device ?? null,
      before_state: beforeState,
      after_state: afterState,
      correlation_id: input.correlationId ?? null,
      metadata
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to write privileged audit record.");
  }

  return String(data.id);
}

export async function listPrivilegedAuditForOrganization(
  organizationId: string,
  limit = 50
): Promise<
  Array<{
    id: string;
    occurredAt: string;
    action: string;
    actorType: string;
    actorUserId: string | null;
    targetType: string;
    targetId: string;
    reason: string | null;
  }>
> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("auth_privileged_audit")
    .select("id, occurred_at, action, actor_type, actor_user_id, target_type, target_id, reason")
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row["id"]),
    occurredAt: String(row["occurred_at"]),
    action: String(row["action"]),
    actorType: String(row["actor_type"]),
    actorUserId: row["actor_user_id"] ? String(row["actor_user_id"]) : null,
    targetType: String(row["target_type"]),
    targetId: String(row["target_id"]),
    reason: row["reason"] ? String(row["reason"]) : null
  }));
}

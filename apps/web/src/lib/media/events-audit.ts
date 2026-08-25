import type { SupabaseClient } from "@supabase/supabase-js";

type AuditArgs = {
  supabase: SupabaseClient;
  organizationId: string;
  actorId: string | null;
  action: "media.receipt.uploaded" | "media.receipt.removed";
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
};

export async function writeReceiptAudit(args: AuditArgs) {
  const payload = { ...(args.payload ?? {}) };
  delete payload["uploadUrl"];
  delete payload["url"];
  delete payload["signedUrl"];
  delete payload["storageReference"];
  delete payload["path"];
  const { error } = await args.supabase.from("audit_events").insert({
    organization_id: args.organizationId,
    actor_id: args.actorId,
    action: args.action,
    entity_type: args.entityType,
    entity_id: args.entityId ?? null,
    payload
  });
  if (error) {
    throw new Error(error.message);
  }
}

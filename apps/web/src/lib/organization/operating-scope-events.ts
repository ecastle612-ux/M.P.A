import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberOperatingScope } from "@mpa/shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export async function recordOperatingScopeEvent(input: {
  supabase: Db;
  organizationId: string;
  actorId: string | null;
  membershipId?: string | null;
  invitationId?: string | null;
  fromScope?: MemberOperatingScope | null;
  toScope?: MemberOperatingScope | null;
  reason: string;
}): Promise<void> {
  const { error } = await input.supabase.from("organization_operating_scope_events").insert({
    organization_id: input.organizationId,
    actor_id: input.actorId,
    membership_id: input.membershipId ?? null,
    invitation_id: input.invitationId ?? null,
    from_scope: input.fromScope ?? null,
    to_scope: input.toScope ?? null,
    reason: input.reason
  });
  if (error) {
    throw new Error(error.message);
  }
}

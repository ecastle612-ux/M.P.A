import { createServiceRoleClient } from "../supabase/service-role";
import type { PartnerNotificationKind } from "./service";

async function listOrgManagers(organizationId: string): Promise<Array<{ userId: string }>> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  const managers = (data ?? [])
    .filter((row) => {
      const roles = (row.roles as string[]) ?? [];
      return roles.includes("organization_admin") || roles.includes("property_manager");
    })
    .map((row) => String(row.user_id));
  return Array.from(new Set(managers)).map((userId) => ({ userId }));
}

export async function notifyPartnerStaff(input: {
  organizationId: string;
  partnerName: string;
  kind: PartnerNotificationKind;
  title: string;
  body: string;
  href: string;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  const managers = await listOrgManagers(input.organizationId);
  for (const manager of managers) {
    await supabase.from("comms_notifications").insert({
      organization_id: input.organizationId,
      user_id: manager.userId,
      notification_key: `partner.${input.kind}`,
      title: input.title,
      body: input.body,
      href: input.href
    });
  }
}

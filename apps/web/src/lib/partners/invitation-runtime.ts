import { createOrganizationSlugFromName } from "../organization/contracts";
import { sendOperationalNoticeEmail } from "../communications/email";
import { createServiceRoleClient } from "../supabase/service-role";
import type { PartnerInvitationServiceDeps } from "./invitation-service";
import { loadPartnerDeps } from "./runtime";
import { loadPartnerRequestDeps } from "./request-deps";

export async function createPartnerOrganization(input: {
  name: string;
  ownerUserId: string;
}): Promise<{ organizationId: string }> {
  const supabase = createServiceRoleClient();
  const slug = `${createOrganizationSlugFromName(input.name)}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name,
      slug,
      created_by: input.ownerUserId
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "partner_org_create_failed");
  }
  return { organizationId: String(data.id) };
}

export async function ensurePartnerMembership(input: {
  organizationId: string;
  userId: string;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: existing } = await supabase
    .from("organization_memberships")
    .select("id, roles, status")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (existing) {
    if (existing.status !== "active") {
      await supabase
        .from("organization_memberships")
        .update({ status: "active" })
        .eq("id", existing.id);
    }
    return;
  }
  const { error } = await supabase.from("organization_memberships").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    roles: ["organization_admin"],
    status: "active",
    operating_scope: null
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function sendPartnerInvitationEmail(input: {
  to: string;
  subject: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  idempotencyKey?: string;
}): Promise<void> {
  await sendOperationalNoticeEmail({
    to: input.to,
    subject: input.subject,
    body: input.body,
    audienceLabel: "M.P.A. Partners",
    ctaUrl: input.ctaUrl,
    ctaLabel: input.ctaLabel,
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {})
  });
}

export async function loadPartnerInvitationDeps(): Promise<PartnerInvitationServiceDeps> {
  const base = await loadPartnerDeps();
  const requestDeps = await loadPartnerRequestDeps();
  return {
    ...base,
    sendInvitationEmail: sendPartnerInvitationEmail,
    createPartnerOrganization,
    ensurePartnerMembership,
    listPropertyPortalCount: async (partnerId) => {
      if (!requestDeps.propertyPortals) return 0;
      const rows = await requestDeps.propertyPortals.listPortals(partnerId);
      return rows.length;
    }
  };
}

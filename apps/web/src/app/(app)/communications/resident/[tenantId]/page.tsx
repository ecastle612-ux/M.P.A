import { redirect } from "next/navigation";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getTenantForOrganization } from "../../../../../lib/tenant/server";
import { ensureResidentPmThread, getThreadBySourceEntity } from "../../../../../lib/messaging/server";

/**
 * DPX-002 — Message from resident context.
 * Ensures a resident_pm thread and redirects into it (no inbox hunt).
 */
export default async function ResidentMessageRedirectPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  const canRead = evaluatePermission(authorization, "message:read");
  const canCreate = evaluatePermission(authorization, "message:create");
  if (!canRead && !canCreate) redirect("/unauthorized");

  const tenant = await getTenantForOrganization(organizationId, tenantId, supabase);
  if (!tenant) redirect("/tenants");

  const displayName = tenant.preferredName || `${tenant.firstName} ${tenant.lastName}`;

  if (!canCreate) {
    const existing = await getThreadBySourceEntity(organizationId, "resident", tenantId, supabase);
    if (existing) redirect(`/communications/threads/${existing.id}`);
    redirect("/communications/inbox");
  }

  const thread = await ensureResidentPmThread(
    organizationId,
    user.id,
    {
      id: tenant.id,
      displayName,
      email: tenant.email,
      propertyId: tenant.propertyId,
      unitId: tenant.unitId
    },
    supabase
  );

  redirect(`/communications/threads/${thread.id}`);
}

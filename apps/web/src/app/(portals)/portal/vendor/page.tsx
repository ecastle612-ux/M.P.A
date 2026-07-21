import { redirect } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import { VendorPortalHome } from "../../../../components/portal/vendor-portal-home";
import { MasterAdminPortalDemoPanel } from "../../../../components/master-admin/master-admin-portal-demo-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getWorkOrdersForOrganization } from "../../../../lib/maintenance/server";
import { getCurrentVendorAssignment } from "../../../../lib/vendor/assignments";
import type { VendorAssignmentStatus } from "../../../../lib/vendor/contracts";
import {
  assertMasterAdminUser,
  getActiveMasterAdminSession
} from "../../../../lib/master-admin/session";

export default async function VendorPortalPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const session = await getActiveMasterAdminSession(user.id);
  const inPortalTest = session?.mode === "portal_test" && session.portal === "vendor";
  const isMasterAdmin = await assertMasterAdminUser(user, organizationId);

  const authorization = await resolveAuthorizationContext(user, organizationId);
  const canRead = evaluatePermission(authorization, "maintenance:read");
  if (!canRead && !(isMasterAdmin && inPortalTest)) redirect("/unauthorized");

  const email = user.email?.toLowerCase() ?? "";
  const { data: vendor } = email
    ? await supabase
        .from("vendors")
        .select("id, business_name")
        .eq("organization_id", organizationId)
        .ilike("email", email)
        .is("deleted_at", null)
        .maybeSingle()
    : { data: null };

  const allOrders =
    canRead || inPortalTest
      ? await getWorkOrdersForOrganization(organizationId, { limit: 100 }, supabase).catch(() => [])
      : [];
  const assigned = vendor
    ? allOrders.filter((order) => order.vendorId === (vendor.id as string))
    : [];

  const workOrders = await Promise.all(
    assigned.map(async (order) => {
      const assignment = await getCurrentVendorAssignment(organizationId, order.id, supabase);
      return {
        id: order.id,
        workOrderNumber: order.workOrderNumber,
        title: order.title,
        status: order.status,
        assignmentStatus: (assignment?.assignmentStatus as VendorAssignmentStatus | null) ?? null,
        propertyName: order.propertyName,
        unitNumber: order.unitNumber
      };
    })
  );

  return (
    <AppPage breadcrumbs={[{ label: "Vendor home" }]}>
      {inPortalTest && workOrders.length === 0 ? <MasterAdminPortalDemoPanel portal="vendor" /> : null}
      <VendorPortalHome
        vendorName={(vendor?.business_name as string | null | undefined) ?? null}
        workOrders={workOrders}
      />
    </AppPage>
  );
}

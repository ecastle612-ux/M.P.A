import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../../components/presentation/create-form-context-rail";
import { VendorForm } from "../../../../../components/vendor/vendor-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getVendorForOrganization } from "../../../../../lib/vendor/server";

export default async function EditVendorPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/dashboard");
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "vendor:update")) {
    redirect("/unauthorized");
  }

  const vendor = await getVendorForOrganization(organizationId, vendorId, supabase);
  if (!vendor) {
    redirect("/vendors");
  }

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/vendors", label: "Vendors" },
        { href: `/vendors/${vendor.id}`, label: vendor.businessName },
        { label: "Edit" }
      ]}
      form={<VendorForm mode="edit" vendor={vendor} />}
      contextRail={
        <CreateFormContextRail
          module="vendor"
          relatedLinks={[{ label: vendor.businessName, href: `/vendors/${vendor.id}` }]}
        />
      }
    />
  );
}

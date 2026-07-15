import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import {
  toVendorAssignmentStatusLabel,
  toVendorServiceLabel,
  toVendorStatusLabel
} from "../../../../lib/vendor/contracts";
import {
  getVendorAssignmentsForVendor,
  getVendorForOrganization,
  getVendorPerformanceSummary
} from "../../../../lib/vendor/server";

export default async function VendorDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ vendorId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { vendorId } = await params;
  const { from } = await searchParams;
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
  if (!evaluatePermission(authorization, "vendor:read")) {
    redirect("/unauthorized");
  }

  const [vendor, performance, assignments] = await Promise.all([
    getVendorForOrganization(organizationId, vendorId, supabase),
    getVendorPerformanceSummary(organizationId, vendorId, supabase),
    getVendorAssignmentsForVendor(organizationId, vendorId, supabase)
  ]);

  if (!vendor) {
    redirect("/vendors");
  }

  const canUpdate = evaluatePermission(authorization, "vendor:update");

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/vendors", label: "Vendors" },
          { label: vendor.businessName }
        ]}
      />

      {from === "vendor-created" ? (
        <Card className="border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface-muted)]">
          <p className="text-sm text-[var(--mpa-color-text-primary)]">
            Vendor saved. Assign this vendor to maintenance work orders from the work order detail view.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
                {vendor.businessName}
              </h1>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {vendor.primaryContactName ?? "No primary contact"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={vendor.status === "active" ? "success" : vendor.status === "archived" ? "warning" : "info"}
              >
                {toVendorStatusLabel(vendor.status)}
              </Badge>
              {vendor.preferredVendor ? <Badge variant="success">Preferred</Badge> : null}
            </div>
          </div>

          <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
            <p>Email: {vendor.email ?? "—"}</p>
            <p>Phone: {vendor.phone ?? "—"}</p>
            <p>Website: {vendor.website ?? "—"}</p>
            <p>Rating: {vendor.rating !== null ? `${vendor.rating.toFixed(1)} / 5` : "—"}</p>
            <p>License: {vendor.licenseNumber ?? "—"}</p>
            <p>Insurance expires: {vendor.insuranceExpiration ?? "—"}</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Services</h2>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {vendor.services.length > 0 ? vendor.services.map(toVendorServiceLabel).join(", ") : "No services listed."}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Address</h2>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {[vendor.addressLine1, vendor.addressLine2, vendor.city, vendor.stateRegion, vendor.postalCode]
                .filter(Boolean)
                .join(", ") || "No address on file."}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Internal notes</h2>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {vendor.internalNotes ?? "No internal notes."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canUpdate ? (
              <Link href={`/vendors/${vendor.id}/edit`}>
                <Button>Edit Vendor</Button>
              </Link>
            ) : null}
            <Link href="/vendors">
              <Button variant="ghost">Back to Vendors</Button>
            </Link>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Performance summary</h2>
            <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
              <p>Total assignments: {performance.totalAssignments}</p>
              <p>Completed: {performance.completedAssignments}</p>
              <p>Cancelled: {performance.cancelledAssignments}</p>
              <p>Completion rate: {performance.completionRate !== null ? `${performance.completionRate}%` : "—"}</p>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Contacts</h2>
            <div className="rounded-md border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">Contacts placeholder</p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Reserved for vendor contact records in a future phase.
              </p>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Service areas</h2>
            <div className="rounded-md border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">Service areas placeholder</p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Reserved for geographic coverage mapping in a future phase.
              </p>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Assignment history</h2>
            {assignments.length === 0 ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">No work order assignments yet.</p>
            ) : (
              <ul className="space-y-2">
                {assignments.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3 text-sm text-[var(--mpa-color-text-secondary)]"
                  >
                    <Link
                      href={`/maintenance/${entry.workOrderId}`}
                      className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
                    >
                      Work order
                    </Link>
                    <p>{toVendorAssignmentStatusLabel(entry.assignmentStatus)}</p>
                    <p className="text-xs">Assigned {new Date(entry.assignedAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>
    </main>
  );
}

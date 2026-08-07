import Link from "next/link";
import { formatMoney } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/resolve-active-organization";

type AnyRow = Record<string, unknown>;

export default async function TenantPortalPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const organizationId = user
    ? await resolveActiveOrganizationIdForUser(supabase, user.id)
    : null;

  let residentName = "Resident";
  let leaseSummary: {
    propertyName: string;
    unitLabel: string;
    rentAmount: number;
    currency: string;
    status: string;
    nextDue: string | null;
    openBalance: number;
  } | null = null;

  if (user && organizationId) {
    const { data: pmResidentRaw } = await supabase
      .from("pm_residents")
      .select("display_name, lease_id, property_id, unit_id")
      .eq("organization_id", organizationId)
      .or(`user_id.eq.${user.id},email.eq.${user.email ?? ""}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const pmResident = pmResidentRaw as AnyRow | null;

    if (pmResident) {
      residentName = String(pmResident["display_name"] ?? "Resident");
      const propertyId = String(pmResident["property_id"] ?? "");
      const unitId = String(pmResident["unit_id"] ?? "");
      const leaseId = (pmResident["lease_id"] as string | null) ?? null;

      const [{ data: propertyRaw }, { data: unitRaw }, { data: leaseRaw }] = await Promise.all([
        supabase.from("property_properties").select("name").eq("id", propertyId).maybeSingle(),
        supabase.from("property_units").select("unit_label").eq("id", unitId).maybeSingle(),
        leaseId
          ? supabase
              .from("lease_agreements")
              .select("id, status, rent_amount, currency")
              .eq("id", leaseId)
              .maybeSingle()
          : Promise.resolve({ data: null })
      ]);
      const property = propertyRaw as AnyRow | null;
      const unit = unitRaw as AnyRow | null;
      const lease = leaseRaw as AnyRow | null;

      let nextDue: string | null = null;
      let openBalance = 0;
      if (lease?.["id"]) {
        const [{ data: scheduleRaw }, { data: chargesRaw }] = await Promise.all([
          supabase
            .from("financial_charge_schedules")
            .select("next_run_on")
            .eq("lease_id", String(lease["id"]))
            .eq("active", true)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("financial_charges")
            .select("amount, amount_paid, status")
            .eq("lease_id", String(lease["id"]))
            .eq("status", "open")
        ]);
        const schedule = scheduleRaw as AnyRow | null;
        const charges = (chargesRaw as AnyRow[] | null) ?? [];
        nextDue = typeof schedule?.["next_run_on"] === "string" ? schedule["next_run_on"] : null;
        openBalance = charges.reduce(
          (sum, charge) => sum + (Number(charge["amount"]) - Number(charge["amount_paid"] ?? 0)),
          0
        );
      }

      leaseSummary = {
        propertyName: String(property?.["name"] ?? "Property"),
        unitLabel: String(unit?.["unit_label"] ?? "—"),
        rentAmount: Number(lease?.["rent_amount"] ?? 0),
        currency: String(lease?.["currency"] ?? "USD"),
        status: String(lease?.["status"] ?? "pending"),
        nextDue,
        openBalance
      };
    }
  }

  return (
    <div className="space-y-4">
      <section className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Welcome
        </p>
        <h2 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Welcome, {residentName}
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Your Resident Portal is ready. Review lease details, rent, maintenance, and documents
          below.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          <h3 className="text-base font-semibold">Lease information</h3>
          {leaseSummary ? (
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--mpa-color-text-secondary)]">Property</dt>
                <dd>{leaseSummary.propertyName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--mpa-color-text-secondary)]">Unit</dt>
                <dd>{leaseSummary.unitLabel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--mpa-color-text-secondary)]">Status</dt>
                <dd>{leaseSummary.status}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Lease details appear after your lease is activated.
            </p>
          )}
        </div>

        <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          <h3 className="text-base font-semibold">Rent summary</h3>
          {leaseSummary ? (
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--mpa-color-text-secondary)]">Monthly rent</dt>
                <dd>{formatMoney(leaseSummary.rentAmount, leaseSummary.currency)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--mpa-color-text-secondary)]">Payment due</dt>
                <dd>{formatMoney(leaseSummary.openBalance, leaseSummary.currency)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--mpa-color-text-secondary)]">Next rent date</dt>
                <dd>{leaseSummary.nextDue ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No rent schedule yet.</p>
          )}
          <Link
            href="/portal/tenant/billing"
            className="inline-flex h-9 items-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-white"
          >
            Go to Billing
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          <h3 className="text-base font-semibold">Maintenance request</h3>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Submit and track maintenance requests for your home from this portal.
          </p>
          <Link
            href="/portal/tenant/maintenance"
            className="text-sm text-[var(--mpa-color-brand-primary)] underline"
          >
            Open maintenance
          </Link>
        </div>
        <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          <h3 className="text-base font-semibold">Documents</h3>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Your signed lease and related documents are available here once activated.
          </p>
          <Link
            href="/portal/tenant/documents"
            className="text-sm text-[var(--mpa-color-brand-primary)] underline"
          >
            Open documents
          </Link>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { formatMoney } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/resolve-active-organization";
import { listResidentWorkOrders } from "../../../../lib/maintenance/maintenance-service";
import {
  ResidentDocumentsStrip,
  ResidentGlanceCard,
  ResidentPageIntro,
  ResidentQuickActions,
  ResidentSection
} from "../../../../components/shell/resident-workspace";

type AnyRow = Record<string, unknown>;

export default async function TenantPortalPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const organizationId = user
    ? await resolveActiveOrganizationIdForUser(supabase, user.id)
    : null;

  let residentName = "there";
  let leaseSummary: {
    propertyName: string;
    unitLabel: string;
    rentAmount: number;
    currency: string;
    status: string;
    nextDue: string | null;
    openBalance: number;
  } | null = null;
  let openMaintenance = 0;
  let needsConfirm = 0;

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
      residentName = String(pmResident["display_name"] ?? "there");
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
        propertyName: String(property?.["name"] ?? "Your home"),
        unitLabel: String(unit?.["unit_label"] ?? "—"),
        rentAmount: Number(lease?.["rent_amount"] ?? 0),
        currency: String(lease?.["currency"] ?? "USD"),
        status: String(lease?.["status"] ?? "pending"),
        nextDue,
        openBalance
      };
    }

    try {
      const workOrders = await listResidentWorkOrders(supabase, organizationId, user.id);
      openMaintenance = workOrders.filter(
        (wo) => !["closed", "cancelled", "completed"].includes(wo.status)
      ).length;
      needsConfirm = workOrders.filter((wo) => wo.status === "completed").length;
    } catch {
      openMaintenance = 0;
      needsConfirm = 0;
    }
  }

  const balance = leaseSummary?.openBalance ?? 0;
  const rentTone = balance > 0 ? "watch" : "ok";
  const rentValue =
    leaseSummary == null
      ? "—"
      : balance > 0
        ? formatMoney(balance, leaseSummary.currency)
        : "Paid up";
  const maintenanceTone = openMaintenance > 0 || needsConfirm > 0 ? "watch" : "ok";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ResidentPageIntro
        title={`Hi, ${residentName}`}
        description={
          leaseSummary
            ? `${leaseSummary.propertyName} · Unit ${leaseSummary.unitLabel}`
            : "Your home portal is ready when your lease is linked."
        }
      />

      <ResidentQuickActions
        actions={[
          { href: "/portal/tenant/maintenance", label: "Report an issue", primary: true },
          { href: "/portal/tenant/billing", label: balance > 0 ? "Pay rent" : "View payments" },
          { href: "/portal/tenant/documents", label: "Lease & documents" }
        ]}
      />

      <section aria-label="At a glance" className="grid gap-3 sm:grid-cols-2">
        <ResidentGlanceCard
          label="Rent status"
          value={rentValue}
          hint={
            leaseSummary?.nextDue
              ? `Next rent date ${leaseSummary.nextDue}`
              : leaseSummary
                ? "No upcoming date on file"
                : "Appears after lease activation"
          }
          href="/portal/tenant/billing"
          tone={rentTone}
        />
        <ResidentGlanceCard
          label="Maintenance"
          value={
            needsConfirm > 0
              ? `${needsConfirm} to confirm`
              : openMaintenance > 0
                ? `${openMaintenance} open`
                : "All clear"
          }
          hint={needsConfirm > 0 ? "A request was marked complete — please confirm." : "Track or report an issue"}
          href="/portal/tenant/maintenance"
          tone={maintenanceTone}
        />
        <ResidentGlanceCard
          label="Announcements"
          value="None yet"
          hint="Community notices from your property will show here."
          tone="neutral"
        />
      </section>

      <ResidentSection
        title="Important notices"
        description="Urgent property notes will land here. Nothing urgent right now."
      >
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          You’re all set — no urgent notices.
        </p>
      </ResidentSection>

      <ResidentSection
        title="Community"
        description="When your property shares announcements, events, or amenities, they will appear here."
      >
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          No community updates yet.
        </p>
      </ResidentSection>

      <ResidentDocumentsStrip />

      {leaseSummary ? (
        <ResidentSection title="Your lease" description="Status only — full document is in Documents.">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Status</dt>
              <dd className="font-medium capitalize">{leaseSummary.status}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Monthly rent</dt>
              <dd className="font-medium">
                {formatMoney(leaseSummary.rentAmount, leaseSummary.currency)}
              </dd>
            </div>
          </dl>
          <Link
            href="/portal/tenant/documents"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
          >
            View lease document
          </Link>
        </ResidentSection>
      ) : null}
    </div>
  );
}

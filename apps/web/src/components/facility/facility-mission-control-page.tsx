"use client";

import Link from "next/link";
import { useCommercialContext } from "../shell/commercial-context";
import {
  FoCapabilityCard,
  FoDocumentsStrip,
  FoGlanceCard,
  FoPageChrome,
  FoPriorityLegend,
  FoQuickActions,
  documentsHref
} from "../shell/fo-workspace";

const CAPABILITIES = [
  {
    title: "Assets",
    href: "/facility/assets",
    status: "planned" as const,
    summary: "Registry, health, warranty, and service history for equipment.",
    documentsHref: documentsHref(undefined, "manual warranty")
  },
  {
    title: "Preventive Maintenance",
    href: "/facility/preventive-maintenance",
    status: "planned" as const,
    summary: "Schedules and due windows so PM work surfaces before it becomes emergency.",
    documentsHref: documentsHref("maintenance")
  },
  {
    title: "Operations / Work Orders",
    href: "/facility/operations",
    status: "planned" as const,
    summary: "Corrective work with emergency vs scheduled vs waiting clarity.",
    documentsHref: documentsHref("maintenance")
  },
  {
    title: "Inspections",
    href: "/facility/inspections",
    status: "planned" as const,
    summary: "Building and equipment inspection programs with evidence attachments.",
    documentsHref: documentsHref(undefined, "inspection")
  },
  {
    title: "Compliance",
    href: "/facility/compliance",
    status: "planned" as const,
    summary: "Certificates and approaching deadlines stay visible to supervisors.",
    documentsHref: documentsHref(undefined, "certificate compliance")
  },
  {
    title: "Inventory & Parts",
    href: "/facility/inventory",
    status: "planned" as const,
    summary: "Stock and parts readiness for technicians without leaving the job.",
    documentsHref: documentsHref(undefined, "parts")
  },
  {
    title: "Safety",
    href: "/facility/safety",
    status: "planned" as const,
    summary: "Safety programs and incident documentation.",
    documentsHref: documentsHref(undefined, "safety")
  },
  {
    title: "Building Systems",
    href: "/facility/building-systems",
    status: "planned" as const,
    summary: "HVAC, electrical, and life-safety systems context for work.",
    documentsHref: documentsHref(undefined, "system")
  }
];

export function FacilityMissionControlPage() {
  const { productSku, canAccess } = useCommercialContext();
  const isComplete = productSku === "mpa_complete_platform";
  const hasPmMaintenance = canAccess("pm.maintenance") || isComplete;

  const quickActions = [
    { href: "/shared/documents", label: "Documents", primary: true },
    { href: "/shared/reports", label: "Reporting", primary: false },
    { href: "/shared/communications", label: "Communications" },
    { href: "/launcher", label: "Launcher" },
    ...(hasPmMaintenance
      ? [
          { href: "/pm/maintenance", label: "Live work orders (PM)" },
          { href: "/pm/vendors", label: "Vendors" }
        ]
      : []),
    ...(isComplete ? [{ href: "/pm/mission-control", label: "PM Mission Control" }] : []),
    { href: "/setup", label: "Guided Setup" }
  ];

  return (
    <FoPageChrome
      crumbs={[
        { href: "/launcher", label: "Launcher" },
        { label: "Facility Mission Control" }
      ]}
      eyebrow="Facility Operations · Attention home"
      title="Facility Mission Control"
      description="Know what needs attention, what is due, and what to do next. Facility module workflows ship next — this home already organizes priorities, documents, and today’s live paths."
    >
      <FoQuickActions actions={quickActions} />

      <section aria-label="At a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FoGlanceCard
          label="Immediate attention"
          value="Watch here"
          hint="Emergency and overdue FO queues will land on this strip."
          tone="critical"
        />
        <FoGlanceCard
          label="Preventive due"
          value="Scheduled"
          hint="Upcoming PM windows will surface before they become emergency."
          tone="watch"
        />
        <FoGlanceCard
          label="Waiting"
          value="Vendors · Techs"
          hint={
            hasPmMaintenance
              ? "Complete customers can triage live residential work orders in PM Maintenance today."
              : "Waiting-on-vendor and waiting-on-technician states will use the priority legend."
          }
          tone="watch"
        />
        <FoGlanceCard
          label="Compliance"
          value="Deadlines"
          hint="Certificates and inspection due dates will appear as compliance approaches."
          tone="neutral"
        />
      </section>

      <FoPriorityLegend />

      <section
        aria-label="What to do next"
        className="rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-white p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
          What to do next
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          Keep manuals, certificates, and vendor contracts in Documents now — then open the module
          that matches today’s work when FO workflows activate.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
          <li>Store equipment manuals, warranties, and inspection evidence in Documents.</li>
          <li>Use Communications for technician and vendor coordination already live on the platform.</li>
          {hasPmMaintenance ? (
            <li>
              Complete Platform: use{" "}
              <Link href="/pm/maintenance" className="text-[var(--mpa-color-brand-primary)] underline">
                Property Manager Maintenance
              </Link>{" "}
              for live work-order triage while FO Operations ships.
            </li>
          ) : (
            <li>Facility-only plans: Mission Control stays the attention home as FO modules unlock.</li>
          )}
        </ul>
      </section>

      <section aria-label="Facility capability map" className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Capability map
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Commercially included Facility Operations modules. Planned means included — not unfinished
            fake workflows.
          </p>
        </div>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <FoCapabilityCard
            title="Mission Control"
            href="/facility/mission-control"
            status="aligned"
            summary="This attention home — priorities, documents, and next actions."
            documentsHref={documentsHref()}
          />
          {CAPABILITIES.map((item) => (
            <FoCapabilityCard key={item.href} {...item} />
          ))}
        </ul>
      </section>

      <FoDocumentsStrip
        title="Facility document library"
        detail="Equipment manuals, maintenance records, inspection reports, vendor contracts, certificates, compliance files, photos, warranties, and purchase records — ready for Document Intelligence."
      />
    </FoPageChrome>
  );
}

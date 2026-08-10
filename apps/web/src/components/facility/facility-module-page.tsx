import Link from "next/link";
import { Badge } from "@mpa/ui";
import {
  FoDocumentsStrip,
  FoPageChrome,
  FoPriorityLegend,
  FoQuickActions,
  documentsHref
} from "../shell/fo-workspace";

export type FacilityModuleDomain =
  | "operations"
  | "assets"
  | "preventive"
  | "inspections"
  | "compliance"
  | "inventory"
  | "parts"
  | "safety"
  | "building_systems"
  | "capital";

const DOMAIN_COPY: Record<
  FacilityModuleDomain,
  {
    watchFor: string[];
    documentsTitle: string;
    documentsDetail: string;
    documentQuery?: string;
    documentEntityType?: string;
  }
> = {
  operations: {
    watchFor: [
      "Emergency vs high vs scheduled work",
      "Waiting on technicians vs waiting on vendors",
      "Completed confirmation and evidence"
    ],
    documentsTitle: "Work order attachments",
    documentsDetail: "Photos, permits, and vendor evidence attach in Documents.",
    documentEntityType: "maintenance"
  },
  assets: {
    watchFor: [
      "Asset health and warranty status",
      "Upcoming maintenance and open work",
      "Inspection status and related manuals"
    ],
    documentsTitle: "Equipment manuals & warranties",
    documentsDetail: "Manuals, warranty files, and service records live in Documents today.",
    documentQuery: "manual warranty asset"
  },
  preventive: {
    watchFor: ["Due and overdue windows", "Assigned technicians", "Procedure documents"],
    documentsTitle: "PM procedures",
    documentsDetail: "Checklists and procedure PDFs attach in Documents.",
    documentEntityType: "maintenance"
  },
  inspections: {
    watchFor: ["Due inspections", "Failed items needing corrective work", "Photo evidence"],
    documentsTitle: "Inspection reports",
    documentsDetail: "Reports and photos attach in Documents — ready for Document Intelligence.",
    documentQuery: "inspection"
  },
  compliance: {
    watchFor: ["Approaching certificate deadlines", "Expired compliance risks", "Audit evidence"],
    documentsTitle: "Certificates & compliance files",
    documentsDetail: "Certificates and compliance packets live in Documents.",
    documentQuery: "certificate compliance"
  },
  inventory: {
    watchFor: ["Low stock", "Parts reserved for open work", "Receiving records"],
    documentsTitle: "Inventory documents",
    documentsDetail: "Packing lists and purchase records attach in Documents.",
    documentQuery: "inventory purchase"
  },
  parts: {
    watchFor: ["Critical spare coverage", "Parts linked to assets", "Vendor lead times"],
    documentsTitle: "Parts & purchasing records",
    documentsDetail: "Invoices and purchase records attach in Documents.",
    documentQuery: "parts invoice"
  },
  safety: {
    watchFor: ["Open incidents", "Required training evidence", "Safety procedures"],
    documentsTitle: "Safety documents",
    documentsDetail: "Procedures and incident files attach in Documents.",
    documentQuery: "safety"
  },
  building_systems: {
    watchFor: ["System health", "Related assets", "Vendor contracts for systems"],
    documentsTitle: "System manuals & contracts",
    documentsDetail: "System manuals and vendor contracts attach in Documents.",
    documentQuery: "system"
  },
  capital: {
    watchFor: ["Project documentation", "Budget artifacts", "Portfolio visibility"],
    documentsTitle: "Project documents",
    documentsDetail: "Project files and invoices attach in Documents.",
    documentQuery: "project"
  }
};

export function FacilityModulePage({
  title,
  description,
  readiness,
  entitlement,
  includedIn,
  domain,
  requiresComplete
}: {
  title: string;
  description: string;
  readiness: "aligned" | "planned";
  entitlement: string;
  includedIn: string[];
  domain: FacilityModuleDomain;
  requiresComplete?: string;
}) {
  const copy = DOMAIN_COPY[domain];

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Facility Mission Control" },
        { label: title }
      ]}
      eyebrow="Facility Operations · Module"
      title={title}
      description={description}
      actions={
        <Badge variant={readiness === "aligned" ? "success" : "warning"}>
          {readiness === "aligned" ? "Aligned" : "Opens when live"}
        </Badge>
      }
    >
      <FoQuickActions
        actions={[
          { href: "/facility/mission-control", label: "Mission Control", primary: true },
          {
            href: documentsHref(copy.documentEntityType, copy.documentQuery),
            label: "Documents"
          },
          { href: "/shared/communications", label: "Communications" },
          { href: "/launcher", label: "Launcher" }
        ]}
      />

      <section
        aria-label="Operational intent"
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
      >
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          What this workspace will make obvious
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
          {copy.watchFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
          This module is not in the primary navigation yet. Use Facility Mission Control for live
          operations; this page is reserved until the workflow ships.
        </p>
      </section>

      <FoPriorityLegend />

      <dl className="grid max-w-3xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--mpa-color-text-secondary)]">Commercial readiness</dt>
          <dd className="text-right font-medium text-[var(--mpa-color-text-primary)]">
            {readiness === "planned"
              ? "Reserved — opens when this module goes live"
              : "Aligned — architectural home"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--mpa-color-text-secondary)]">Entitlement</dt>
          <dd className="font-mono text-xs text-[var(--mpa-color-text-primary)]">{entitlement}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--mpa-color-text-secondary)]">Included in</dt>
          <dd className="text-right text-[var(--mpa-color-text-primary)]">{includedIn.join(" · ")}</dd>
        </div>
        {requiresComplete ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--mpa-color-text-secondary)]">Requires Complete for</dt>
            <dd className="text-right text-[var(--mpa-color-text-primary)]">{requiresComplete}</dd>
          </div>
        ) : null}
      </dl>

      <FoDocumentsStrip
        title={copy.documentsTitle}
        detail={copy.documentsDetail}
        {...(copy.documentEntityType ? { entityType: copy.documentEntityType } : {})}
        {...(copy.documentQuery ? { query: copy.documentQuery } : {})}
      />

      <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
        Return to{" "}
        <Link href="/facility/mission-control" className="text-[var(--mpa-color-brand-primary)] underline">
          Facility Mission Control
        </Link>{" "}
        for priorities and the capability map.
      </p>
    </FoPageChrome>
  );
}

import type { ReactNode } from "react";
import {
  buildCompleteDemoShowcase,
  buildFoDemoShowcase,
  buildPmDemoShowcase,
  getDemoSnapshot,
  toDemoPersonaLabel,
  type DemoPersona,
  type DemoProductId,
  type DemoSession
} from "@mpa/shared";
import {
  CompleteMissionControlShowcase,
  FoMissionControlShowcase,
  PmMissionControlShowcase
} from "./demo-mission-control";

function Panel({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {description ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function CardList({
  items
}: {
  items: Array<{ id: string; title: string; meta: string; detail?: string }>;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-[var(--mpa-color-text-muted)]">{item.meta}</p>
          </div>
          {item.detail ? (
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function DemoSurfaceView({
  session,
  surface
}: {
  session: DemoSession;
  surface: string;
}) {
  const product = session.product as DemoProductId;
  const persona = session.persona as DemoPersona;
  const snapshot = getDemoSnapshot(product);
  const pm = snapshot.pm;
  const fo = snapshot.fo;

  if (surface.startsWith("portal-resident")) {
    const resident = pm?.residents[0];
    return (
      <Panel
        title="Resident Portal"
        description={`Signed in as demo resident ${resident?.name ?? ""} — synthetic lease-linked home.`}
      >
        <CardList
          items={[
            {
              id: "bal",
              title: "Current balance",
              meta: "Billing",
              detail: `$${resident?.balance ?? 0} · payments simulated only`
            },
            {
              id: "lease",
              title: `Unit ${resident?.unit ?? "—"}`,
              meta: "Lease",
              detail: "Active demo lease — no real account"
            },
            ...(surface.includes("maintenance")
              ? [
                  {
                    id: "wo",
                    title: pm?.workOrders[1]?.title ?? "Maintenance request",
                    meta: "Open",
                    detail: "Demo work order visible to resident"
                  }
                ]
              : [])
          ]}
        />
      </Panel>
    );
  }

  if (surface.startsWith("portal-owner")) {
    return (
      <Panel title="Owner Portal" description="Portfolio visibility for the demo owner persona.">
        <CardList
          items={(pm?.properties ?? []).map((property) => ({
            id: property.id,
            title: property.name,
            meta: `${property.occupancyPct}% occupied`,
            detail: `${property.units} units · ${property.openWorkOrders} open work orders`
          }))}
        />
      </Panel>
    );
  }

  if (surface.startsWith("portal-vendor")) {
    return (
      <Panel title="Vendor Portal" description="Assigned demo work for Summit Plumbing persona.">
        <CardList
          items={(pm?.workOrders ?? [])
            .filter((wo) => wo.assignee.toLowerCase().includes("summit") || wo.id === "wo_leak")
            .map((wo) => ({
              id: wo.id,
              title: wo.title,
              meta: wo.status,
              detail: `Priority ${wo.priority}`
            }))}
        />
      </Panel>
    );
  }

  if (surface.startsWith("fo-") || ["sites", "assets", "building-systems", "corrective", "preventive", "inventory", "parts", "inspections", "safety", "compliance"].includes(surface)) {
    if (!fo) {
      return <Panel title="Facility" description="Facility snapshot unavailable for this demo."><p /></Panel>;
    }
    if (surface === "fo-mission-control") {
      return (
        <FoMissionControlShowcase
          showcase={buildFoDemoShowcase(fo)}
          personaLabel={toDemoPersonaLabel(persona)}
          watermark={snapshot.watermark}
        />
      );
    }
    if (surface === "sites") {
      return (
        <Panel
          title="Sites & Locations"
          description={`${fo.organizationName} · viewing as ${toDemoPersonaLabel(persona)}`}
        >
          <CardList
            items={fo.sites.map((site) => ({
              id: site.id,
              title: site.name,
              meta: site.city,
              detail: `${site.locations} locations · ${site.assets} assets`
            }))}
          />
        </Panel>
      );
    }
    if (surface === "assets" || surface === "building-systems") {
      return (
        <Panel title={surface === "assets" ? "Assets" : "Building Systems"} description={fo.assistantBrief}>
          <CardList
            items={fo.assets.map((asset) => ({
              id: asset.id,
              title: asset.name,
              meta: asset.status,
              detail: `${asset.system} · site ${asset.siteId}`
            }))}
          />
        </Panel>
      );
    }
    if (surface === "corrective") {
      return (
        <Panel title="Corrective Work" description="Open facility corrective work (demo).">
          <CardList
            items={fo.correctiveWork.map((wo) => ({
              id: wo.id,
              title: wo.title,
              meta: wo.status,
              detail: `${wo.priority} · ${wo.assignee}`
            }))}
          />
        </Panel>
      );
    }
    if (surface === "preventive") {
      return (
        <Panel title="Preventive Maintenance" description="Scheduled PM tasks.">
          <CardList
            items={fo.preventiveTasks.map((task) => ({
              id: task.id,
              title: task.title,
              meta: task.due,
              detail: `Site ${task.siteId}`
            }))}
          />
        </Panel>
      );
    }
    if (surface === "inventory" || surface === "parts") {
      return (
        <Panel title={surface === "parts" ? "Parts" : "Inventory"} description="Stock positions (synthetic).">
          <CardList
            items={fo.inventory.map((row) => ({
              id: row.id,
              title: row.name,
              meta: `Qty ${row.qty}`,
              detail: `${row.sku} · ${row.location}`
            }))}
          />
        </Panel>
      );
    }
    if (surface === "inspections") {
      return (
        <Panel title="Inspections" description="Inspection schedule.">
          <CardList
            items={fo.inspections.map((row) => ({
              id: row.id,
              title: row.title,
              meta: row.status,
              detail: `Site ${row.siteId}`
            }))}
          />
        </Panel>
      );
    }
    if (surface === "safety") {
      return (
        <Panel title="Safety" description="Safety items.">
          <CardList
            items={fo.safetyItems.map((row) => ({
              id: row.id,
              title: row.title,
              meta: row.severity,
              detail: "Demo safety desk"
            }))}
          />
        </Panel>
      );
    }
    if (surface === "compliance") {
      return (
        <Panel title="Compliance" description="Compliance calendar.">
          <CardList
            items={fo.complianceItems.map((row) => ({
              id: row.id,
              title: row.title,
              meta: row.due,
              detail: "Demo compliance item"
            }))}
          />
        </Panel>
      );
    }
  }

  if (!pm) {
    return (
      <Panel title="Demo" description="Snapshot unavailable.">
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No PM data for this product.</p>
      </Panel>
    );
  }

  switch (surface) {
    case "properties":
      return (
        <Panel title="Properties" description={`${pm.organizationName} portfolio`}>
          <CardList
            items={pm.properties.map((property) => ({
              id: property.id,
              title: property.name,
              meta: `${property.occupancyPct}% occ.`,
              detail: `${property.address} · ${property.units} units · ${property.openWorkOrders} open WOs`
            }))}
          />
        </Panel>
      );
    case "residents":
      return (
        <Panel title="Residents" description="Lease-linked residents (synthetic).">
          <CardList
            items={pm.residents.map((resident) => ({
              id: resident.id,
              title: resident.name,
              meta: `Unit ${resident.unit}`,
              detail: `${resident.leaseStatus} · balance $${resident.balance}`
            }))}
          />
        </Panel>
      );
    case "leasing":
      return (
        <Panel title="Leasing" description="Active and pending demo leases.">
          <CardList
            items={pm.leases.map((lease) => ({
              id: lease.id,
              title: `Unit ${lease.unit}`,
              meta: `$${lease.rent}/mo`,
              detail: `${lease.startDate} → ${lease.endDate}`
            }))}
          />
        </Panel>
      );
    case "maintenance":
      return (
        <Panel title="Maintenance" description="Work orders across the demo portfolio.">
          <CardList
            items={pm.workOrders.map((wo) => ({
              id: wo.id,
              title: wo.title,
              meta: wo.status,
              detail: `${wo.priority} · ${wo.assignee}`
            }))}
          />
        </Panel>
      );
    case "financial":
      return (
        <Panel
          title="Financial Operations"
          description="Operational money desks — payments are simulated; no live Stripe charges."
        >
          <CardList
            items={pm.invoices.map((invoice) => ({
              id: invoice.id,
              title: invoice.vendor,
              meta: `$${invoice.amount}`,
              detail: invoice.status.replaceAll("_", " ")
            }))}
          />
        </Panel>
      );
    case "documents":
      return (
        <Panel title="Documents" description="Exports disabled in Live Demo.">
          <CardList
            items={pm.documents.map((doc) => ({
              id: doc.id,
              title: doc.name,
              meta: doc.category,
              detail: `Updated ${doc.updatedAt} · download blocked`
            }))}
          />
        </Panel>
      );
    case "reports": {
      const showcase = buildPmDemoShowcase(pm);
      return (
        <Panel
          title="Reporting & Analytics"
          description="Live Demo sample insights derived from the demo snapshot only — not live tenant analytics. Exports disabled."
        >
          <div className="space-y-4">
            <p className="text-sm font-medium">What should I pay attention to today?</p>
            <CardList
              items={[
                {
                  id: "occ",
                  title: `Occupancy averages ${showcase.kpis.find((k) => k.id === "occupancy")?.value ?? "—"}`,
                  meta: "Property Operations",
                  detail: "Decision: prioritize leasing where occupancy is soft."
                },
                {
                  id: "maint",
                  title: `${showcase.maintenance.open} open work orders · ${showcase.maintenance.urgent} urgent`,
                  meta: "Maintenance",
                  detail: "Decision: clear urgent backlog before new PM work."
                },
                {
                  id: "fin",
                  title: `Outstanding balance ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(showcase.financial.outstandingBalance)}`,
                  meta: "Financial",
                  detail: "Decision: review collections for past-due residents."
                }
              ]}
            />
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Demo metrics come from snapshot fields only. No fabricated satisfaction scores.
            </p>
          </div>
        </Panel>
      );
    }
    case "communications":
      return (
        <Panel title="Communications" description="Outbound email/SMS stubbed — nothing leaves the demo.">
          <CardList
            items={pm.messages.map((msg) => ({
              id: msg.id,
              title: msg.subject,
              meta: msg.from,
              detail: msg.preview
            }))}
          />
        </Panel>
      );
    case "assistant":
      return (
        <Panel title="M.P.A. Assistant" description="Next-action guidance from demo signals.">
          <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            {pm.assistantBrief}
            {fo ? (
              <>
                <hr className="my-4 border-[var(--mpa-color-border-subtle)]" />
                {fo.assistantBrief}
              </>
            ) : null}
          </div>
        </Panel>
      );
    case "timeline":
      return (
        <Panel title="Timeline" description="Recent operational events (synthetic).">
          <CardList
            items={[
              ...pm.messages.map((msg) => ({
                id: `t-${msg.id}`,
                title: msg.subject,
                meta: msg.at,
                detail: msg.from
              })),
              ...pm.workOrders.map((wo) => ({
                id: `t-${wo.id}`,
                title: wo.title,
                meta: wo.status,
                detail: wo.assignee
              }))
            ]}
          />
        </Panel>
      );
    case "mission-control":
    default: {
      if (product === "mpa_complete_platform" && fo && surface === "mission-control") {
        return (
          <CompleteMissionControlShowcase
            showcase={buildCompleteDemoShowcase(
              pm.organizationName,
              pm,
              fo
            )}
            personaLabel={toDemoPersonaLabel(persona)}
            watermark={snapshot.watermark}
          />
        );
      }
      return (
        <PmMissionControlShowcase
          showcase={buildPmDemoShowcase(pm)}
          personaLabel={toDemoPersonaLabel(persona)}
          watermark={snapshot.watermark}
        />
      );
    }
  }
}

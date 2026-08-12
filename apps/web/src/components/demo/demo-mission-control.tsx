import type { ReactNode } from "react";
import type {
  CompleteDemoShowcase,
  DemoKpi,
  DemoQueueItem,
  FoDemoShowcase,
  PmDemoShowcase
} from "@mpa/shared";
import { Badge } from "@mpa/ui";

function money(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function kpiToneClass(tone: DemoKpi["tone"]): string {
  if (tone === "good") return "border-[var(--mpa-color-brand-primary)]/30";
  if (tone === "watch") return "border-amber-300";
  if (tone === "critical") return "border-red-300";
  return "border-[var(--mpa-color-border-default)]";
}

function KpiStrip({ items }: { items: DemoKpi[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((kpi) => (
        <li
          key={kpi.id}
          className={`rounded-md border bg-[var(--mpa-color-bg-surface)] px-4 py-3 ${kpiToneClass(kpi.tone)}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
            {kpi.label}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {kpi.value}
          </p>
          {kpi.hint ? (
            <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{kpi.hint}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
      <header className="mb-3 space-y-1">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function SeverityBadge({ severity }: { severity: DemoQueueItem["badge"] }) {
  if (severity === "immediate") return <Badge variant="danger">Immediate</Badge>;
  if (severity === "waiting") return <Badge variant="warning">Waiting</Badge>;
  return <Badge variant="info">Info</Badge>;
}

function GlanceStrip({
  immediate,
  waiting,
  changed,
  next,
  health
}: {
  immediate: number;
  waiting: number;
  changed: string;
  next: string;
  health: string;
}) {
  return (
    <section
      aria-label="At a glance"
      className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
        At a glance
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <li className="rounded-md border border-red-200 bg-red-50/40 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#C0392B]">Immediate</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{immediate}</p>
        </li>
        <li className="rounded-md border border-amber-200 bg-amber-50/40 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B45309]">Can wait</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{waiting}</p>
        </li>
        <li className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 sm:col-span-2 xl:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
            Changed today
          </p>
          <p className="mt-2 text-sm font-medium leading-5">{changed}</p>
        </li>
        <li className="rounded-md border border-[var(--mpa-color-brand-primary)]/25 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-3 py-2 sm:col-span-2 xl:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
            Do next
          </p>
          <p className="mt-2 text-sm font-medium leading-5">{next}</p>
        </li>
        <li className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
            Health
          </p>
          <p className="mt-2 text-sm font-medium leading-5">{health}</p>
        </li>
      </ul>
    </section>
  );
}

function AttentionQueue({ items }: { items: DemoQueueItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className={`flex flex-wrap items-start justify-between gap-3 rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-2 ${
            item.badge === "immediate"
              ? "border-l-[3px] border-l-[#C0392B]"
              : item.badge === "waiting"
                ? "border-l-[3px] border-l-[#B45309]"
                : "border-l-[3px] border-l-[var(--mpa-color-border-default)]"
          }`}
        >
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {item.module} · {item.detail}
            </p>
          </div>
          <SeverityBadge severity={item.badge} />
        </li>
      ))}
    </ul>
  );
}

function OccupancyChart({
  bars
}: {
  bars: PmDemoShowcase["occupancyBars"];
}) {
  return (
    <ul className="space-y-3">
      {bars.map((bar) => (
        <li key={bar.id} className="space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">{bar.label}</span>
            <span className="text-[var(--mpa-color-text-secondary)]">
              {bar.pct}% · {bar.units} units · {bar.openWorkOrders} open WOs
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
            role="img"
            aria-label={`${bar.label} occupancy ${bar.pct} percent`}
          >
            <div
              className="h-full rounded-full bg-[var(--mpa-color-brand-primary)]"
              style={{ width: `${Math.min(100, Math.max(0, bar.pct))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusMixChart({ mix }: { mix: FoDemoShowcase["statusMix"] }) {
  return (
    <ul className="space-y-3">
      {mix.map((row) => (
        <li key={row.id} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{row.label}</span>
            <span className="text-[var(--mpa-color-text-secondary)]">
              {row.count} · {row.pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
            <div
              className={`h-full rounded-full ${
                row.id === "attention"
                  ? "bg-amber-500"
                  : row.id === "down"
                    ? "bg-red-500"
                    : "bg-[var(--mpa-color-brand-primary)]"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, row.pct))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PmMissionControlShowcase({
  showcase,
  personaLabel,
  watermark
}: {
  showcase: PmDemoShowcase;
  personaLabel: string;
  watermark?: string;
}) {
  const immediate = showcase.queue.filter((item) => item.badge === "immediate").length;
  const waiting = showcase.queue.filter((item) => item.badge === "waiting").length;
  const next = showcase.queue[0]?.title ?? "Review portfolio health";
  const health =
    immediate > 0 ? "Needs attention" : waiting > 0 ? "Watch" : "Healthy";

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
          Property Manager · Live Demo
        </p>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Mission Control</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {showcase.organizationName} · viewing as {personaLabel}
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
          Start here · See today&apos;s work
        </p>
      </header>

      <GlanceStrip
        immediate={immediate}
        waiting={waiting}
        changed={`${showcase.maintenance.open} open work orders · ${showcase.financial.pendingApprovals} approvals pending`}
        next={next}
        health={health}
      />

      <SectionCard title="Assistant briefing">
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{showcase.assistantBrief}</p>
      </SectionCard>

      <SectionCard title="Today’s priorities" description="Attention queue from demo signals.">
        <AttentionQueue items={showcase.queue} />
      </SectionCard>

      <KpiStrip items={showcase.kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Portfolio health" description="Occupancy by property from the demo snapshot.">
          <OccupancyChart bars={showcase.occupancyBars} />
        </SectionCard>
        <SectionCard title="Financial snapshot" description="Rent roll and approvals — synthetic only.">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">Monthly rent roll</dt>
              <dd className="font-semibold">{money(showcase.financial.monthlyRentRoll)}</dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">Outstanding balances</dt>
              <dd className="font-semibold">{money(showcase.financial.outstandingBalance)}</dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">Pending vendor approvals</dt>
              <dd className="font-semibold">{showcase.financial.pendingApprovals}</dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">Pending amount</dt>
              <dd className="font-semibold">{money(showcase.financial.pendingApprovalAmount)}</dd>
            </div>
          </dl>
        </SectionCard>
        <SectionCard title="Maintenance summary" description="Work orders across the demo portfolio.">
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">Open</dt>
              <dd className="font-display text-xl font-semibold">{showcase.maintenance.open}</dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">In progress</dt>
              <dd className="font-display text-xl font-semibold">{showcase.maintenance.inProgress}</dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">Urgent</dt>
              <dd className="font-display text-xl font-semibold">{showcase.maintenance.urgent}</dd>
            </div>
          </dl>
        </SectionCard>
        <SectionCard title="Recent activity" description="Messages and work orders from the snapshot.">
          <ul className="space-y-2">
            {showcase.recentActivity.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--mpa-color-border-subtle)] pb-2 text-sm last:border-0"
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-[var(--mpa-color-text-muted)]">{item.meta}</span>
                <span className="w-full text-[var(--mpa-color-text-secondary)]">{item.detail}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {watermark ? (
        <p className="text-xs text-[var(--mpa-color-text-muted)]">{watermark}</p>
      ) : null}
    </section>
  );
}

export function FoMissionControlShowcase({
  showcase,
  personaLabel,
  watermark
}: {
  showcase: FoDemoShowcase;
  personaLabel: string;
  watermark?: string;
}) {
  const immediate = showcase.queue.filter((item) => item.badge === "immediate").length;
  const waiting = showcase.queue.filter((item) => item.badge === "waiting").length;
  const next = showcase.queue[0]?.title ?? "Review asset health";
  const health =
    immediate > 0 ? "Needs attention" : waiting > 0 ? "Watch" : "Healthy";

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
          Facility Operations · Live Demo
        </p>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Facility Mission Control</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {showcase.organizationName} · viewing as {personaLabel}
        </p>
      </header>

      <GlanceStrip
        immediate={immediate}
        waiting={waiting}
        changed={`${showcase.corrective.length} corrective tickets · ${showcase.compliance.length} compliance dues`}
        next={next}
        health={health}
      />

      <SectionCard title="Assistant briefing">
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{showcase.assistantBrief}</p>
      </SectionCard>

      <SectionCard title="Today’s priorities" description="Facility attention queue.">
        <AttentionQueue items={showcase.queue} />
      </SectionCard>

      <KpiStrip items={showcase.kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Asset health" description="Status mix from demo assets.">
          <StatusMixChart mix={showcase.statusMix} />
          <ul className="mt-4 space-y-2">
            {showcase.assetHealth.map((asset) => (
              <li
                key={asset.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium">
                  {asset.label}{" "}
                  <span className="text-[var(--mpa-color-text-muted)]">· {asset.system}</span>
                </span>
                <Badge variant={asset.status === "attention" ? "warning" : "success"}>
                  {asset.status}
                </Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Corrective work" description="Open facility corrective tickets.">
          <ul className="space-y-2">
            {showcase.corrective.map((wo) => (
              <li key={wo.id} className="rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{wo.title}</p>
                  <Badge variant={wo.priority === "urgent" ? "danger" : "neutral"}>{wo.priority}</Badge>
                </div>
                <p className="mt-1 text-[var(--mpa-color-text-secondary)]">
                  {wo.status.replaceAll("_", " ")} · {wo.assignee}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Compliance summary" description="Upcoming compliance dues.">
          <ul className="space-y-2">
            {showcase.compliance.map((item) => (
              <li key={item.id} className="flex justify-between gap-2 text-sm">
                <span className="font-medium">{item.title}</span>
                <span className="text-[var(--mpa-color-text-secondary)]">Due {item.due}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--mpa-color-text-muted)]">
            Preventive due:{" "}
            {showcase.preventiveDue.map((task) => `${task.title} (${task.due})`).join(" · ")}
          </p>
        </SectionCard>
      </div>

      {watermark ? (
        <p className="text-xs text-[var(--mpa-color-text-muted)]">{watermark}</p>
      ) : null}
    </section>
  );
}

export function CompleteMissionControlShowcase({
  showcase,
  personaLabel,
  watermark
}: {
  showcase: CompleteDemoShowcase;
  personaLabel: string;
  watermark?: string;
}) {
  const pmNext = showcase.pm.queue[0]?.title ?? "Open Property Manager Mission Control";
  const foNext = showcase.fo.queue[0]?.title ?? "Open Facility Mission Control";
  const immediate =
    showcase.pm.queue.filter((item) => item.badge === "immediate").length +
    showcase.fo.queue.filter((item) => item.badge === "immediate").length;
  const waiting =
    showcase.pm.queue.filter((item) => item.badge === "waiting").length +
    showcase.fo.queue.filter((item) => item.badge === "waiting").length;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
          Complete Platform · Live Demo
        </p>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Executive Mission Control</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {showcase.organizationName} · viewing as {personaLabel}
        </p>
      </header>

      <GlanceStrip
        immediate={immediate}
        waiting={waiting}
        changed="Both product homes report live demo snapshot signals"
        next={`PM: ${pmNext}`}
        health={immediate > 0 ? "Needs attention across homes" : "Dual-home healthy"}
      />

      <SectionCard
        title="What should I work on next"
        description="Executive next steps from existing PM and FO attention queues."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
          <li>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">Property Manager:</span>{" "}
            {pmNext}
          </li>
          <li>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">Facility Operations:</span>{" "}
            {foNext}
          </li>
        </ol>
      </SectionCard>

      <SectionCard
        title="Executive summary"
        description="Both product homes in one organization — derived from the Complete Platform demo snapshot."
      >
        <KpiStrip items={showcase.executiveKpis} />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] p-4">
          <h2 className="font-display text-lg font-semibold">Property Manager</h2>
          <KpiStrip items={showcase.pm.kpis.slice(0, 4)} />
          <AttentionQueue items={showcase.pm.queue.slice(0, 3)} />
        </div>
        <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] p-4">
          <h2 className="font-display text-lg font-semibold">Facility Operations</h2>
          <KpiStrip items={showcase.fo.kpis.slice(0, 4)} />
          <AttentionQueue items={showcase.fo.queue.slice(0, 3)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Portfolio occupancy">
          <OccupancyChart bars={showcase.pm.occupancyBars} />
        </SectionCard>
        <SectionCard title="Asset health">
          <StatusMixChart mix={showcase.fo.statusMix} />
        </SectionCard>
      </div>

      {watermark ? (
        <p className="text-xs text-[var(--mpa-color-text-muted)]">{watermark}</p>
      ) : null}
    </section>
  );
}

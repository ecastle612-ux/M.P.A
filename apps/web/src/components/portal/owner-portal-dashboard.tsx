import Link from "next/link";
import type { ReactNode } from "react";
import { Card, EmptyState, KpiMetric } from "@mpa/ui";
import type {
  OwnerDashboardListItem,
  OwnerDashboardListWidgetState,
  OwnerDashboardWidgetState,
  OwnerPortalDashboardModel
} from "../../lib/owner-portal/dashboard";

function MetricWidget({
  label,
  state
}: {
  label: string;
  state: OwnerDashboardWidgetState;
}) {
  if (state.status === "ready") {
    return (
      <KpiMetric
        label={label}
        value={state.value}
        {...(state.detail ? { hint: state.detail } : {})}
        {...(state.href ? { href: state.href } : {})}
      />
    );
  }

  if (state.status === "empty") {
    return (
      <Card variant="muted" className="flex h-full flex-col justify-between p-4">
        <div>
          <p className="mpa-section-label">{label}</p>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{state.message}</p>
        </div>
        {state.href ? (
          <Link
            href={state.href}
            className="mt-3 text-xs font-medium text-[var(--mpa-color-text-link)] transition-opacity hover:opacity-80"
          >
            Open section →
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <Card variant="muted" className="p-4">
      <p className="mpa-section-label">{label}</p>
      <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{state.message}</p>
    </Card>
  );
}

function ListWidget({
  title,
  state,
  emptyTitle
}: {
  title: string;
  state: OwnerDashboardListWidgetState;
  emptyTitle: string;
}) {
  return (
    <Card variant="elevated" className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">{title}</h2>
        {state.status === "ready" && state.href ? (
          <Link
            href={state.href}
            className="shrink-0 text-xs font-medium text-[var(--mpa-color-text-link)] transition-opacity hover:opacity-80"
          >
            View all
          </Link>
        ) : null}
      </div>

      {state.status === "ready" ? (
        <ul className="space-y-2">
          {state.items.map((item) => (
            <ListItemRow key={item.id} item={item} />
          ))}
        </ul>
      ) : state.status === "empty" ? (
        <EmptyState title={emptyTitle} description={state.message} className="py-6" />
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{state.message}</p>
      )}
    </Card>
  );
}

function ListItemRow({ item }: { item: OwnerDashboardListItem }) {
  const content = (
    <>
      <p className="truncate text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
      {item.subtitle ? (
        <p className="truncate text-xs text-[var(--mpa-color-text-secondary)]">{item.subtitle}</p>
      ) : null}
    </>
  );
  if (item.href) {
    return (
      <li>
        <Link
          href={item.href}
          className="mpa-list-row mpa-chrome-control flex flex-col justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-3 transition-colors hover:border-[var(--mpa-color-border-default)]"
        >
          {content}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <div className="mpa-list-row flex flex-col justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-3">
        {content}
      </div>
    </li>
  );
}

export function OwnerPortalDashboard({
  model,
  demoPanel
}: {
  model: OwnerPortalDashboardModel;
  demoPanel?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="mpa-rise-in space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          {model.welcomeName ? `Welcome, ${model.welcomeName}` : "Owner dashboard"}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Portfolio performance, recent activity, and what needs attention — scoped to your owner access.
          {model.propertyCount > 0 ? ` Tracking ${model.propertyCount} properties.` : null}
        </p>
      </div>

      {demoPanel}

      {model.attentionItems.length > 0 ? (
        <section aria-labelledby="owner-attention-heading" className="mpa-rise-in mpa-rise-in-delay-1 space-y-3">
          <h2
            id="owner-attention-heading"
            className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Needs attention
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {model.attentionItems.map((item) => (
              <ListItemRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="owner-metrics-heading" className="mpa-rise-in mpa-rise-in-delay-2 space-y-3">
        <h2 id="owner-metrics-heading" className="sr-only">
          Portfolio metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricWidget label="Properties" state={model.propertyCountWidget} />
          <MetricWidget label="Occupancy" state={model.occupancy} />
          <MetricWidget label="Recent collections" state={model.revenue} />
          <MetricWidget label="Expenses" state={model.expenses} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricWidget label="Outstanding balance" state={model.outstanding} />
          <MetricWidget label="Pending payout" state={model.pendingPayout} />
        </div>
      </section>

      <section aria-labelledby="owner-statement-heading" className="space-y-3">
        <h2 id="owner-statement-heading" className="sr-only">
          Latest statement
        </h2>
        <ListWidget
          title="Latest statement"
          emptyTitle="No statement yet"
          state={model.latestStatement}
        />
      </section>

      <section aria-labelledby="owner-activity-heading" className="space-y-3">
        <h2 id="owner-activity-heading" className="sr-only">
          Recent activity
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <ListWidget
            title="Recent vendor expenses"
            emptyTitle="No vendor expenses"
            state={model.recentVendorExpenses}
          />
          <ListWidget
            title="Recent messages"
            emptyTitle="No messages"
            state={model.recentMessages}
          />
          <ListWidget
            title="Recent documents"
            emptyTitle="No documents"
            state={model.recentDocuments}
          />
          <ListWidget
            title="Recent reports"
            emptyTitle="No reports"
            state={model.recentReports}
          />
          <ListWidget
            title="Notifications"
            emptyTitle="No notifications"
            state={model.notifications}
          />
        </div>
      </section>
    </div>
  );
}

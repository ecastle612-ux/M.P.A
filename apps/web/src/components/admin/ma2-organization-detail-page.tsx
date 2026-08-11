import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@mpa/ui";
import type { Ma2OrgDetailSnapshot } from "../../lib/admin/load-ma2-org-detail";
import type { HealthTone } from "../../lib/admin/command-center-metrics";
import { SupportOrgActions } from "./support-org-actions";
import {
  Ma7CapacityMutationBlocked,
  Ma7MembershipActions,
  Ma7OrgLifecycleBlocked,
  Ma7SubscriptionActions
} from "./ma7-mutation-actions";

function toneVariant(tone: HealthTone): "success" | "warning" | "danger" | "neutral" | "info" {
  switch (tone) {
    case "ok":
      return "success";
    case "warn":
      return "warning";
    case "down":
      return "danger";
    case "info":
      return "info";
    default:
      return "neutral";
  }
}

function Section({
  id,
  title,
  children,
  action
}: {
  id: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2
          id={`${id}-heading`}
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      {children}
    </div>
  );
}

function Kv({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--mpa-color-border-subtle)] py-1.5 first:border-0 first:pt-0 text-sm">
      <dt className="text-[var(--mpa-color-text-secondary)]">{label}</dt>
      <dd className="font-mono text-xs text-[var(--mpa-color-text-primary)] text-right break-all">
        {value}
      </dd>
    </div>
  );
}

const SECTION_LINKS = [
  ["summary", "Summary"],
  ["users", "Users"],
  ["modules", "Modules"],
  ["properties", "Properties"],
  ["subscription", "Subscription"],
  ["capacity", "Capacity"],
  ["stripe", "Stripe"],
  ["checkout", "Checkout"],
  ["work-orders", "Work orders"],
  ["vendors", "Vendors"],
  ["notifications", "Notifications"],
  ["webhooks", "Webhooks"],
  ["errors", "Errors"],
  ["audit", "Audit"]
] as const;

export function Ma2OrganizationDetailPage({ detail }: { detail: Ma2OrgDetailSnapshot }) {
  const trialActive = detail.subscription.status === "trialing";

  return (
    <main className="space-y-8 p-4 md:p-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link href="/admin" className="text-[var(--mpa-color-brand-primary)] underline">
            Overview
          </Link>
          <span className="text-[var(--mpa-color-text-secondary)]">/</span>
          <Link
            href="/admin/platform/organizations"
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Organizations
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
            {detail.name}
          </h1>
          <Badge variant={toneVariant(detail.health)}>{detail.health}</Badge>
          <Badge variant="neutral">{detail.lifecycle}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Authoritative organization diagnostic — inspect commercial, capacity, operations, and
          errors without leaving Master Admin.
        </p>
        <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Panel>
            <Kv label="Organization ID" value={detail.id} />
            <Kv label="Slug" value={detail.slug} />
            <Kv label="Created" value={new Date(detail.createdAt).toLocaleString()} />
          </Panel>
          <Panel>
            <Kv label="Product" value={detail.subscription.skuLabel ?? "—"} />
            <Kv
              label="Subscription"
              value={detail.subscription.status ?? "—"}
            />
            <Kv label="Trial" value={trialActive ? "Yes" : "No"} />
          </Panel>
          <Panel>
            <Kv
              label="Managed units"
              value={detail.subscription.managedUnitCount ?? "—"}
            />
            <Kv
              label="Authorized capacity"
              value={detail.subscription.authorizedUnitCapacity ?? "—"}
            />
            <Kv
              label="Setup"
              value={detail.setupComplete ? "complete" : "incomplete"}
            />
          </Panel>
          <Panel>
            <Kv label="Stripe linked" value={detail.stripe.linked ? "yes" : "no"} />
            <Kv label="Members" value={detail.users.length} />
            <Kv label="Open issues" value={detail.healthIssues.length} />
          </Panel>
        </dl>
      </header>

      <nav
        aria-label="Organization sections"
        className="flex gap-2 overflow-x-auto pb-1 text-xs"
      >
        {SECTION_LINKS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2.5 py-1.5 text-[var(--mpa-color-text-secondary)] hover:border-[var(--mpa-color-brand-primary)] hover:text-[var(--mpa-color-text-primary)]"
          >
            {label}
          </a>
        ))}
      </nav>

      {detail.degraded.length > 0 ? (
        <div
          role="status"
          className="rounded-md border border-[var(--mpa-color-border-default)] border-l-4 border-l-[#C0392B] bg-white px-4 py-3 text-sm"
        >
          <p className="font-semibold text-[var(--mpa-color-text-primary)]">Partial section data</p>
          <ul className="mt-1 list-disc pl-5 text-[var(--mpa-color-text-secondary)]">
            {detail.degraded.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Section id="summary" title="Health summary">
        {detail.healthIssues.length === 0 ? (
          <Panel>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              No organization-scoped health issues in the current inspect signals.
            </p>
          </Panel>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {detail.healthIssues.map((issue) => (
              <li key={issue.id}>
                <a
                  href={issue.href ?? "#summary"}
                  className="block rounded-md border border-[var(--mpa-color-border-default)] border-l-4 border-l-[#C0392B] bg-white px-4 py-3 hover:border-[var(--mpa-color-brand-primary)]"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        issue.severity === "critical"
                          ? "danger"
                          : issue.severity === "warn"
                            ? "warning"
                            : "info"
                      }
                    >
                      {issue.severity}
                    </Badge>
                    <span className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                      {issue.title}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{issue.detail}</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Ma7OrgLifecycleBlocked organizationName={detail.name} />

      <Section id="users" title="Users / Memberships">
        <p className="mb-3 text-xs">
          <Link
            href={`/admin/users?organizationId=${encodeURIComponent(detail.id)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Open org memberships in Users →
          </Link>
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel>
            <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Members</h3>
            {detail.users.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No memberships.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.users.map((u) => (
                  <li
                    key={u.membershipId}
                    className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0"
                  >
                    <Link
                      href={`/admin/users/${u.userId}`}
                      className="font-mono text-xs text-[var(--mpa-color-brand-primary)] underline"
                    >
                      {u.userId}
                    </Link>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {u.roles.join(", ") || "no roles"} · {u.status}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                      updated {u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "—"}
                      {u.createdAt ? ` · created ${new Date(u.createdAt).toLocaleString()}` : ""}
                    </p>
                    <Ma7MembershipActions
                      membershipId={u.membershipId}
                      organizationId={detail.id}
                      status={u.status}
                      roles={u.roles}
                    />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-[var(--mpa-color-text-secondary)]">
              Membership status changes are governed MA-7 mutations (confirmation + reason + audit). Role
              editing is not available here.
            </p>
          </Panel>
          <Panel>
            <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Invitations</h3>
            {detail.invitations.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No invitations.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.invitations.map((i) => (
                  <li
                    key={i.id}
                    className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-xs"
                  >
                    <span className="text-[var(--mpa-color-text-primary)]">{i.email}</span>
                    <p className="text-[var(--mpa-color-text-secondary)]">
                      {i.status} · {i.roles.join(", ") || "no roles"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </Section>

      <Section id="modules" title="Modules">
        <div className="grid gap-3 md:grid-cols-3">
          {detail.modules.map((m) => (
            <Panel key={m.sku}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{m.label}</h3>
                <Badge variant={m.enabled ? "success" : "neutral"}>
                  {m.enabled ? "enabled" : "not included"}
                </Badge>
              </div>
              <dl className="mt-2">
                <Kv label="Commercial state" value={m.commercialState.replaceAll("_", " ")} />
                <Kv label="Entitlements (SKU map)" value={m.entitlementCount} />
              </dl>
            </Panel>
          ))}
        </div>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          FO and Complete are fully functional products. Entitlement keys for current SKU:{" "}
          {detail.entitlementKeys.length
            ? detail.entitlementKeys.slice(0, 12).join(", ") +
              (detail.entitlementKeys.length > 12 ? "…" : "")
            : "none"}
        </p>
      </Section>

      <Section id="properties" title="Properties & Units">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Panel>
            <Kv label="Properties" value={detail.capacity.propertyCount} />
          </Panel>
          <Panel>
            <Kv
              label="Inventory units"
              value={detail.capacity.inventoryUnitCount ?? "n/a"}
            />
          </Panel>
          <Panel>
            <Kv label="Managed units (billing)" value={detail.capacity.managedUnitCount ?? "—"} />
          </Panel>
          <Panel>
            <Kv
              label="Utilization"
              value={
                detail.capacity.utilizationPercent == null
                  ? "n/a"
                  : `${detail.capacity.utilizationPercent}%`
              }
            />
          </Panel>
        </div>
        {detail.capacity.utilizationNote ? (
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">{detail.capacity.utilizationNote}</p>
        ) : null}
        <Panel>
          <h3 className="text-sm font-semibold">Properties</h3>
          {detail.properties.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No properties.</p>
          ) : (
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {detail.properties.map((p) => (
                <li key={p.id} className="text-sm">
                  <span className="text-[var(--mpa-color-text-primary)]">{p.name}</span>
                  <span className="ml-2 font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                    {p.status ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Section>

      <Section id="subscription" title="Subscription">
        <p className="mb-3 text-xs">
          <Link
            href={`/admin/subscriptions/${encodeURIComponent(detail.id)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Open fleet Subscription detail →
          </Link>
        </p>
        <Panel>
          <dl>
            <Kv label="Product / module" value={detail.subscription.skuLabel ?? "—"} />
            <Kv label="Billing interval" value={detail.subscription.billingCycle ?? "—"} />
            <Kv label="Status" value={detail.subscription.status ?? "—"} />
            <Kv label="Trial ends" value={detail.subscription.trialEndsAt ? new Date(detail.subscription.trialEndsAt).toLocaleString() : "—"} />
            <Kv
              label="Current period end"
              value={
                detail.subscription.currentPeriodEnd
                  ? new Date(detail.subscription.currentPeriodEnd).toLocaleString()
                  : "—"
              }
            />
            <Kv
              label="Cancel at period end"
              value={detail.subscription.cancelAtPeriodEnd ? "yes" : "no"}
            />
            <Kv label="Lifecycle" value={detail.lifecycle} />
            <Kv label="Quote ID" value={detail.subscription.quoteId ?? "—"} />
          </dl>
        </Panel>
        <Ma7SubscriptionActions
          organizationId={detail.id}
          organizationName={detail.name}
          status={detail.subscription.status}
          cancelAtPeriodEnd={Boolean(detail.subscription.cancelAtPeriodEnd)}
          currentPeriodEnd={detail.subscription.currentPeriodEnd ?? null}
        />
      </Section>

      <Section id="capacity" title="Capacity">
        <p className="mb-3 text-xs">
          <Link
            href={`/admin/capacity/${encodeURIComponent(detail.id)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Open fleet Capacity detail →
          </Link>
        </p>
        <Ma7CapacityMutationBlocked />
        <Panel>
          <dl>
            <Kv label="Managed units" value={detail.capacity.managedUnitCount ?? "—"} />
            <Kv label="Authorized capacity" value={detail.capacity.authorizedUnitCapacity ?? "—"} />
            <Kv
              label="Next-period capacity"
              value={detail.capacity.pendingAuthorizedUnitCapacity ?? "—"}
            />
            <Kv
              label="Additional blocks"
              value={detail.subscription.authorizedAdditionalBlocks ?? "—"}
            />
            <Kv
              label="Declared units"
              value={detail.subscription.declaredUnitCount ?? "—"}
            />
            <Kv
              label="Last capacity authorized"
              value={
                detail.subscription.lastCapacityAuthorizedAt
                  ? new Date(detail.subscription.lastCapacityAuthorizedAt).toLocaleString()
                  : "—"
              }
            />
            <Kv label="Over capacity" value={detail.capacity.overCapacity ? "yes" : "no"} />
          </dl>
          <p className="mt-2 text-[11px] text-[var(--mpa-color-text-secondary)]">
            Inspect-only. Manual capacity editing is deferred.
          </p>
        </Panel>
      </Section>

      <Section id="stripe" title="Stripe linkage">
        <Panel>
          <dl>
            <Kv label="Customer ID" value={detail.stripe.customerId ?? "—"} />
            <Kv label="Subscription ID" value={detail.stripe.subscriptionId ?? "—"} />
            <Kv label="Base item ID" value={detail.stripe.baseItemId ?? "—"} />
            <Kv
              label="Additional capacity item ID"
              value={detail.stripe.additionalCapacityItemId ?? "—"}
            />
            <Kv label="Billing interval" value={detail.stripe.billingCycle ?? "—"} />
            <Kv label="Subscription status" value={detail.stripe.status ?? "—"} />
          </dl>
          <p className="mt-2 text-[11px] text-[var(--mpa-color-text-secondary)]">
            {detail.stripe.priceIdsNote}
          </p>
          {!detail.stripe.linked && detail.subscription.status ? (
            <p className="mt-2 text-xs text-[#C0392B]">
              Subscription expects Stripe linkage but customer/subscription IDs are missing.
            </p>
          ) : null}
        </Panel>
      </Section>

      <Section id="checkout" title="Checkout / Provisioning">
        <p className="mb-3 text-xs">
          <Link
            href={`/admin/checkout?organizationId=${encodeURIComponent(detail.id)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Open fleet Checkout / Provisioning for this org →
          </Link>
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel>
            <h3 className="text-sm font-semibold">Checkout sessions</h3>
            {detail.checkout.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No checkout rows.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.checkout.map((c) => (
                  <li
                    key={c.sessionId}
                    className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-xs"
                  >
                    <Link
                      href={`/admin/checkout/${encodeURIComponent(c.sessionId)}`}
                      className="font-mono break-all text-[var(--mpa-color-brand-primary)] underline"
                    >
                      {c.sessionId}
                    </Link>
                    <p className="text-[var(--mpa-color-text-secondary)]">
                      {c.status} · provisioned={String(c.provisioned)} · {c.productSku ?? "—"} ·{" "}
                      {c.billingCycle ?? "—"}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel>
            <h3 className="text-sm font-semibold">Provisioning jobs</h3>
            {detail.provisioning.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No provisioning jobs.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.provisioning.map((p) => (
                  <li
                    key={p.id}
                    className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-xs"
                  >
                    <p className="font-mono">{p.checkpoint}</p>
                    <p className="text-[var(--mpa-color-text-secondary)]">
                      {p.productSku ?? "—"} · {p.ownerEmail ?? "—"}
                    </p>
                    <p className="font-mono text-[10px]">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/commercial/provisioning"
              className="mt-3 inline-block text-xs text-[var(--mpa-color-brand-primary)] underline"
            >
              Open provisioning console
            </Link>
          </Panel>
        </div>
        <div id="support-actions" className="pt-2">
          <SupportOrgActions
            organizationId={detail.id}
            invitations={detail.invitations}
            provisioning={detail.provisioning.map((p) => ({
              id: p.id,
              status: p.checkpoint,
              updatedAt: p.updatedAt
            }))}
          />
        </div>
      </Section>

      <Section
        id="work-orders"
        title="Work orders"
        action={
          <span className="text-xs text-[var(--mpa-color-text-secondary)]">
            {detail.workOrders.availability}
            {detail.workOrders.note ? ` · ${detail.workOrders.note}` : ""}
          </span>
        }
      >
        <p className="mb-3 text-xs">
          <Link
            href={`/admin/operations/work-orders?organizationId=${encodeURIComponent(detail.id)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Open fleet Operations work orders for this org →
          </Link>
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Panel>
            <Kv label="Open" value={detail.workOrders.open} />
          </Panel>
          <Panel>
            <Kv label="In progress" value={detail.workOrders.inProgress} />
          </Panel>
          <Panel>
            <Kv label="Completed" value={detail.workOrders.completed} />
          </Panel>
          <Panel>
            <Kv label="Cancelled" value={detail.workOrders.cancelled} />
          </Panel>
          <Panel>
            <Kv label="Urgent / critical" value={detail.workOrders.urgent} />
          </Panel>
        </div>
        <Panel>
          <h3 className="text-sm font-semibold">Recent activity</h3>
          {detail.recentWorkOrders.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No work orders.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {detail.recentWorkOrders.map((wo) => (
                <li
                  key={wo.id}
                  className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-xs"
                >
                  <Link
                    href={`/admin/operations/work-orders/${encodeURIComponent(wo.id)}`}
                    className="text-[var(--mpa-color-text-primary)] underline"
                  >
                    {wo.title}
                  </Link>
                  <p className="text-[var(--mpa-color-text-secondary)]">
                    {wo.status} · {wo.priority}
                    {wo.workSurface ? ` · ${wo.workSurface}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Section>

      <Section id="vendors" title="Vendors">
        <p className="mb-3 text-xs">
          <Link
            href={`/admin/operations/vendors?organizationId=${encodeURIComponent(detail.id)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Open fleet Operations vendors for this org →
          </Link>
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Panel>
            <Kv label="Vendors" value={detail.vendors.total} />
          </Panel>
          <Panel>
            <Kv label="Active" value={detail.vendors.active} />
          </Panel>
          <Panel>
            <Kv label="Inactive" value={detail.vendors.inactive} />
          </Panel>
          <Panel>
            <Kv label="Outstanding vendor WO" value={detail.vendors.outstandingWorkOrders} />
          </Panel>
        </div>
        <Panel>
          {detail.recentVendors.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No vendors.</p>
          ) : (
            <ul className="space-y-2">
              {detail.recentVendors.map((v) => (
                <li
                  key={v.id}
                  className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-xs"
                >
                  {v.name} · {v.status}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Section>

      <Section id="notifications" title="Notifications">
        <p className="mb-3 text-xs">
          <Link
            href={`/admin/operations/notifications?organizationId=${encodeURIComponent(detail.id)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Open fleet Operations notifications for this org →
          </Link>
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Panel>
            <Kv label="Email failed" value={detail.notifications.recentFailed} />
          </Panel>
          <Panel>
            <Kv label="Email sent" value={detail.notifications.recentSent} />
          </Panel>
          <Panel>
            <Kv label="Email queued" value={detail.notifications.recentQueued} />
          </Panel>
        </div>
        <Panel>
          {detail.notifications.recent.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No recent notifications.</p>
          ) : (
            <ul className="space-y-2">
              {detail.notifications.recent.map((n) => (
                <li
                  key={n.id}
                  className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-xs"
                >
                  <span className="text-[var(--mpa-color-text-primary)]">{n.title}</span>
                  <p className="text-[var(--mpa-color-text-secondary)]">
                    {n.emailDeliveryStatus ?? "no email attempt"} · {n.channel ?? "—"} ·{" "}
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Section>

      <Section id="webhooks" title="Webhooks">
        <p className="mb-2 text-xs text-[var(--mpa-color-text-secondary)]">{detail.webhooks.note}</p>
        <p className="mb-3 text-xs">
          <Link
            href={`/admin/webhooks?organizationId=${encodeURIComponent(detail.id)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Open fleet Webhook Health for this org →
          </Link>
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel>
            <h3 className="text-sm font-semibold">Stripe lifecycle</h3>
            <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
              Checkout webhook unresolved (correlated): {detail.webhooks.stripeCheckoutUnresolved}
            </p>
            {detail.webhooks.stripeLifecycle.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No lifecycle events.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.webhooks.stripeLifecycle.map((e) => (
                  <li
                    key={e.id}
                    className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-xs"
                  >
                    {e.eventType}
                    <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                      {e.processedAt ? new Date(e.processedAt).toLocaleString() : "—"}
                      {e.summary ? ` · ${e.summary}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel>
            <h3 className="text-sm font-semibold">SignWell</h3>
            {detail.webhooks.signwell.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No SignWell events.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.webhooks.signwell.map((e) => (
                  <li
                    key={e.id}
                    className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-xs"
                  >
                    {e.eventType}
                    <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                      {e.documentId ?? "—"} ·{" "}
                      {e.processedAt ? new Date(e.processedAt).toLocaleString() : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </Section>

      <Section
        id="errors"
        title="Errors"
        action={
          <Link
            href={`/admin/errors?organizationId=${encodeURIComponent(detail.id)}`}
            className="text-sm text-[var(--mpa-color-brand-primary)] underline"
          >
            Open Critical Errors filtered
          </Link>
        }
      >
        {detail.errors.length === 0 ? (
          <Panel>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              No durable errors for this organization.
            </p>
          </Panel>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
            {detail.errors.map((err) => (
              <li key={err.id}>
                <Link
                  href={`/admin/errors/${err.id}`}
                  className="block px-4 py-3 hover:bg-[var(--mpa-color-bg-app)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={err.severity === "critical" ? "danger" : "warning"}>
                      {err.severity}
                    </Badge>
                    <span className="text-sm text-[var(--mpa-color-text-primary)]">{err.message}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[var(--mpa-color-text-secondary)]">
                    {[err.route, err.requestId ? `req ${err.requestId}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="audit" title="Audit history">
        <p className="mb-3 text-xs text-[var(--mpa-color-text-secondary)]">
          Organization-scoped support + domain audit.{" "}
          <Link
            href={`/admin/audit?organizationId=${encodeURIComponent(detail.id)}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Open fleet Audit Log for this org →
          </Link>
        </p>
        {detail.audit.length === 0 ? (
          <Panel>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No audit events.</p>
          </Panel>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
            {detail.audit.map((a) => (
              <li key={`${a.source}-${a.id}`} className="px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{a.source}</Badge>
                  <Link
                    href={`/admin/audit/${a.id}`}
                    className="font-medium text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {a.action}
                  </Link>
                  <span className="text-[var(--mpa-color-text-secondary)]">{a.result}</span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                  {a.at ? new Date(a.at).toLocaleString() : "—"} · actor{" "}
                  {a.actor ? (
                    <Link
                      href={`/admin/users/${a.actor}`}
                      className="text-[var(--mpa-color-brand-primary)] underline"
                    >
                      {a.actor}
                    </Link>
                  ) : (
                    "—"
                  )}{" "}
                  · target {a.target}
                </p>
                {Object.keys(a.context).length > 0 ? (
                  <pre className="mt-1 max-h-24 overflow-auto font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                    {JSON.stringify(a.context)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}

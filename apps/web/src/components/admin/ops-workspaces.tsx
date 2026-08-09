"use client";

import { formatUsdFromCents } from "../../lib/admin/command-center-metrics";
import type {
  OpsCustomerRow,
  OpsInvitationRow,
  OpsOperatorRow,
  OpsOrgRow,
  OpsSubscriptionRow,
  OpsSupportEvent,
  OpsSystemItem
} from "../../lib/admin/load-ops-directories";
import type { StoredSaasPurchase } from "../../lib/saas-stripe/purchase-store";
import { OpsMetricStrip, OpsWorkspaceChrome } from "./ops-workspace-chrome";
import { HealthBadge, OpsDirectoryTable, StatusBadge } from "./ops-directory-table";

function stripeCustomerHref(customerId: string | null): string | null {
  if (!customerId) return null;
  return `https://dashboard.stripe.com/customers/${customerId}`;
}

function stripeSubscriptionHref(subscriptionId: string | null): string | null {
  if (!subscriptionId) return null;
  return `https://dashboard.stripe.com/subscriptions/${subscriptionId}`;
}

function uniqueOptions(values: string[]): Array<{ value: string; label: string }> {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

export function OrganizationsOpsWorkspace({ organizations }: { organizations: OpsOrgRow[] }) {
  return (
    <OpsWorkspaceChrome
      eyebrow="Platform Operations · Organizations"
      title="Organization directory"
      description="Search and filter customer organizations by status, product, provisioning, and Guided Setup — visibility only."
    >
      <OpsMetricStrip
        items={[
          { label: "Organizations", value: organizations.length },
          {
            label: "Active",
            value: organizations.filter((o) => o.statusBucket === "active").length
          },
          {
            label: "Pending provisioning",
            value: organizations.filter((o) => o.statusBucket === "pending_provisioning").length
          },
          {
            label: "Setup incomplete",
            value: organizations.filter((o) => !o.setupComplete).length
          }
        ]}
      />
      <OpsDirectoryTable
        caption="Organizations"
        rows={organizations}
        searchPlaceholder="Search name, slug, product…"
        searchText={(row) =>
          `${row.name} ${row.slug} ${row.productLabel ?? ""} ${row.statusBucket} ${row.provisioningState}`
        }
        filters={[
          {
            id: "status",
            label: "Status",
            options: uniqueOptions(organizations.map((o) => o.statusBucket)),
            valueOf: (row) => row.statusBucket
          },
          {
            id: "product",
            label: "Product",
            options: uniqueOptions(organizations.map((o) => o.productLabel ?? "none")),
            valueOf: (row) => row.productLabel ?? "none"
          },
          {
            id: "setup",
            label: "Guided Setup",
            options: [
              { value: "complete", label: "Complete" },
              { value: "incomplete", label: "Incomplete" }
            ],
            valueOf: (row) => (row.setupComplete ? "complete" : "incomplete")
          }
        ]}
        columns={[
          {
            id: "org",
            header: "Organization",
            cell: (row) => (
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="font-mono text-[11px] text-[var(--mpa-color-text-secondary)]">{row.slug}</p>
              </div>
            )
          },
          {
            id: "health",
            header: "Health",
            cell: (row) => <HealthBadge tone={row.health} />
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.statusBucket} />
          },
          {
            id: "subscription",
            header: "Subscription",
            cell: (row) =>
              row.subscriptionStatus ? <StatusBadge value={row.subscriptionStatus} /> : "—"
          },
          {
            id: "product",
            header: "Product",
            cell: (row) => row.productLabel ?? "—"
          },
          {
            id: "provisioning",
            header: "Provisioning",
            cell: (row) => <StatusBadge value={row.provisioningState} />
          },
          {
            id: "setup",
            header: "Guided Setup",
            cell: (row) => (
              <StatusBadge value={row.setupComplete ? "complete" : "incomplete"} />
            )
          },
          {
            id: "members",
            header: "Members",
            cell: (row) => row.memberCount
          },
          {
            id: "activity",
            header: "Last activity",
            cell: (row) => (
              <span className="font-mono text-[11px]">{new Date(row.lastActivityAt).toLocaleString()}</span>
            )
          }
        ]}
      />
    </OpsWorkspaceChrome>
  );
}

export function CustomersOpsWorkspace({
  customers,
  invitations
}: {
  customers: OpsCustomerRow[];
  invitations: OpsInvitationRow[];
}) {
  return (
    <OpsWorkspaceChrome
      eyebrow="Platform Operations · Customers"
      title="Customer directory"
      description="Memberships, organization relationships, roles, invitations, and setup state. Last login is not stored — membership updated_at is shown as an activity proxy."
    >
      <OpsMetricStrip
        items={[
          { label: "Memberships", value: customers.length },
          {
            label: "Active",
            value: customers.filter((c) => c.status === "active").length
          },
          {
            label: "Pending setup",
            value: customers.filter((c) => c.pendingSetup).length
          },
          { label: "Open invitations", value: invitations.filter((i) => i.status === "pending").length }
        ]}
      />
      <OpsDirectoryTable
        caption="Customers"
        rows={customers}
        searchPlaceholder="Search user id, organization, roles…"
        searchText={(row) =>
          `${row.userId} ${row.organizationName} ${row.roles.join(" ")} ${row.status}`
        }
        filters={[
          {
            id: "status",
            label: "Account status",
            options: uniqueOptions(customers.map((c) => c.status)),
            valueOf: (row) => row.status
          },
          {
            id: "setup",
            label: "Pending setup",
            options: [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" }
            ],
            valueOf: (row) => (row.pendingSetup ? "yes" : "no")
          }
        ]}
        columns={[
          {
            id: "user",
            header: "User",
            cell: (row) => (
              <span className="font-mono text-[11px] break-all">{row.userId}</span>
            )
          },
          {
            id: "org",
            header: "Organization",
            cell: (row) => row.organizationName
          },
          {
            id: "roles",
            header: "Roles",
            cell: (row) => (row.roles.length ? row.roles.join(", ") : "—")
          },
          {
            id: "status",
            header: "Account status",
            cell: (row) => <StatusBadge value={row.status} />
          },
          {
            id: "login",
            header: "Last activity (proxy)",
            cell: (row) => (
              <span className="font-mono text-[11px]">{new Date(row.updatedAt).toLocaleString()}</span>
            )
          },
          {
            id: "setup",
            header: "Pending setup",
            cell: (row) => <StatusBadge value={row.pendingSetup ? "pending" : "complete"} />
          },
          {
            id: "invite",
            header: "Org invite pending",
            cell: (row) => (row.invitationPending ? <StatusBadge value="pending" /> : "—")
          }
        ]}
      />
      <OpsDirectoryTable
        caption="Invitations"
        rows={invitations}
        searchPlaceholder="Search email, organization…"
        searchText={(row) => `${row.email} ${row.organizationName} ${row.roles.join(" ")} ${row.status}`}
        filters={[
          {
            id: "status",
            label: "Invitation status",
            options: uniqueOptions(invitations.map((i) => i.status)),
            valueOf: (row) => row.status
          }
        ]}
        columns={[
          {
            id: "email",
            header: "Email",
            cell: (row) => row.email
          },
          {
            id: "org",
            header: "Organization",
            cell: (row) => row.organizationName
          },
          {
            id: "roles",
            header: "Roles",
            cell: (row) => (row.roles.length ? row.roles.join(", ") : "—")
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.status} />
          },
          {
            id: "created",
            header: "Created",
            cell: (row) => (
              <span className="font-mono text-[11px]">{new Date(row.createdAt).toLocaleString()}</span>
            )
          }
        ]}
      />
    </OpsWorkspaceChrome>
  );
}

export function CommercialOpsWorkspace({
  subscriptions,
  purchases,
  commercial
}: {
  subscriptions: OpsSubscriptionRow[];
  purchases: StoredSaasPurchase[];
  commercial: {
    activeSubscriptions: number;
    mrrFormatted: string;
    arrFormatted: string;
    failedProvisioning: number;
  };
}) {
  const purchaseRows = purchases.map((p) => ({ ...p, id: p.id }));
  const commercialHealth =
    commercial.failedProvisioning > 0
      ? "warn"
      : commercial.activeSubscriptions > 0
        ? "ok"
        : "unknown";

  return (
    <OpsWorkspaceChrome
      eyebrow="Platform Operations · Commercial"
      title="Commercial directory"
      description="Subscription directory, MRR/ARR, recent purchases, provisioning status, and Stripe customer links. Read-only — no billing mutations."
    >
      <OpsMetricStrip
        items={[
          {
            label: "Active subscriptions",
            value: commercial.activeSubscriptions,
            hint: `Commercial health: ${commercialHealth}`
          },
          { label: "MRR", value: commercial.mrrFormatted },
          { label: "ARR", value: commercial.arrFormatted },
          {
            label: "Provisioning failures",
            value: commercial.failedProvisioning
          }
        ]}
      />
      <OpsDirectoryTable
        caption="Subscriptions"
        rows={subscriptions.map((s) => ({ ...s, id: s.organizationId }))}
        searchPlaceholder="Search organization, product, Stripe id…"
        searchText={(row) =>
          `${row.organizationName} ${row.productLabel ?? ""} ${row.status} ${row.stripeCustomerId ?? ""} ${row.stripeSubscriptionId ?? ""}`
        }
        filters={[
          {
            id: "status",
            label: "Status",
            options: uniqueOptions(subscriptions.map((s) => s.status)),
            valueOf: (row) => row.status
          },
          {
            id: "product",
            label: "Product",
            options: uniqueOptions(subscriptions.map((s) => s.productLabel ?? "none")),
            valueOf: (row) => row.productLabel ?? "none"
          }
        ]}
        columns={[
          {
            id: "org",
            header: "Organization",
            cell: (row) => row.organizationName
          },
          {
            id: "product",
            header: "Product",
            cell: (row) => row.productLabel ?? "—"
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.status} />
          },
          {
            id: "cycle",
            header: "Billing",
            cell: (row) => row.billingCycle ?? "—"
          },
          {
            id: "mrr",
            header: "MRR",
            cell: (row) => formatUsdFromCents(row.mrrCents)
          },
          {
            id: "prov",
            header: "Provisioning",
            cell: (row) => <StatusBadge value={row.provisioningState} />
          },
          {
            id: "stripe",
            header: "Stripe",
            cell: (row) => {
              const customerHref = stripeCustomerHref(row.stripeCustomerId);
              const subHref = stripeSubscriptionHref(row.stripeSubscriptionId);
              if (!customerHref && !subHref) return "—";
              return (
                <span className="flex flex-col gap-1 text-xs">
                  {customerHref ? (
                    <a
                      href={customerHref}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--mpa-color-brand-primary)] underline"
                    >
                      Customer
                    </a>
                  ) : null}
                  {subHref ? (
                    <a
                      href={subHref}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--mpa-color-brand-primary)] underline"
                    >
                      Subscription
                    </a>
                  ) : null}
                </span>
              );
            }
          }
        ]}
      />
      <OpsDirectoryTable
        caption="Recent purchases"
        rows={purchaseRows}
        searchPlaceholder="Search email, session, product…"
        searchText={(row) =>
          `${row.customerEmail ?? ""} ${row.productSku} ${row.status} ${row.stripeCheckoutSessionId}`
        }
        filters={[
          {
            id: "status",
            label: "Purchase status",
            options: uniqueOptions(purchaseRows.map((p) => p.status)),
            valueOf: (row) => row.status
          }
        ]}
        columns={[
          {
            id: "when",
            header: "Created",
            cell: (row) => (
              <span className="font-mono text-[11px]">{new Date(row.createdAt).toLocaleString()}</span>
            )
          },
          {
            id: "email",
            header: "Customer",
            cell: (row) => row.customerEmail ?? "—"
          },
          {
            id: "product",
            header: "Product",
            cell: (row) => row.productSku
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.status} />
          },
          {
            id: "provisioned",
            header: "Provisioned",
            cell: (row) => <StatusBadge value={row.provisioned ? "yes" : "no"} />
          },
          {
            id: "stripe",
            header: "Stripe customer",
            cell: (row) => {
              const href = stripeCustomerHref(row.stripeCustomerId);
              return href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--mpa-color-brand-primary)] underline"
                >
                  Open
                </a>
              ) : (
                "—"
              );
            }
          }
        ]}
      />
    </OpsWorkspaceChrome>
  );
}

export function SupportOpsWorkspace({
  organizations,
  customers,
  events
}: {
  organizations: OpsOrgRow[];
  customers: OpsCustomerRow[];
  events: OpsSupportEvent[];
}) {
  return (
    <OpsWorkspaceChrome
      eyebrow="Platform Operations · Support"
      title="Support lookup"
      description="Customer and organization lookup with failure timeline. Support notes are a placeholder — no editing in this sprint."
    >
      <OpsMetricStrip
        items={[
          { label: "Organizations", value: organizations.length },
          { label: "Customers", value: customers.length },
          {
            label: "Timeline events",
            value: events.length
          },
          {
            label: "Failures",
            value: events.filter((e) => e.kind.includes("fail") || e.kind.includes("error")).length
          }
        ]}
      />
      <OpsDirectoryTable
        caption="Organization lookup"
        rows={organizations}
        searchPlaceholder="Lookup organization by name or slug…"
        searchText={(row) => `${row.name} ${row.slug} ${row.productLabel ?? ""}`}
        columns={[
          {
            id: "org",
            header: "Organization",
            cell: (row) => (
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="font-mono text-[11px] text-[var(--mpa-color-text-secondary)]">{row.slug}</p>
              </div>
            )
          },
          {
            id: "health",
            header: "Health",
            cell: (row) => <HealthBadge tone={row.health} />
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.statusBucket} />
          },
          {
            id: "product",
            header: "Product",
            cell: (row) => row.productLabel ?? "—"
          },
          {
            id: "setup",
            header: "Guided Setup",
            cell: (row) => (
              <StatusBadge value={row.setupComplete ? "complete" : "incomplete"} />
            )
          }
        ]}
      />
      <OpsDirectoryTable
        caption="Customer lookup"
        rows={customers}
        searchPlaceholder="Lookup customer by user id or organization…"
        searchText={(row) => `${row.userId} ${row.organizationName} ${row.roles.join(" ")}`}
        columns={[
          {
            id: "user",
            header: "User",
            cell: (row) => <span className="font-mono text-[11px] break-all">{row.userId}</span>
          },
          {
            id: "org",
            header: "Organization",
            cell: (row) => row.organizationName
          },
          {
            id: "roles",
            header: "Roles",
            cell: (row) => (row.roles.length ? row.roles.join(", ") : "—")
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.status} />
          }
        ]}
      />
      <OpsDirectoryTable
        caption="Support timeline"
        rows={events}
        searchPlaceholder="Search failures, lifecycle, Guided Setup…"
        searchText={(row) => `${row.kind} ${row.title} ${row.detail}`}
        filters={[
          {
            id: "kind",
            label: "Kind",
            options: uniqueOptions(events.map((e) => e.kind)),
            valueOf: (row) => row.kind
          }
        ]}
        columns={[
          {
            id: "at",
            header: "When",
            cell: (row) => (
              <span className="font-mono text-[11px]">{new Date(row.at).toLocaleString()}</span>
            )
          },
          {
            id: "kind",
            header: "Kind",
            cell: (row) => <StatusBadge value={row.kind} />
          },
          {
            id: "title",
            header: "Title",
            cell: (row) => row.title
          },
          {
            id: "detail",
            header: "Detail",
            cell: (row) => (
              <span className="text-xs text-[var(--mpa-color-text-secondary)]">{row.detail}</span>
            )
          },
          {
            id: "link",
            header: "Related",
            cell: (row) =>
              row.href ? (
                <a href={row.href} className="text-xs text-[var(--mpa-color-brand-primary)] underline">
                  Open
                </a>
              ) : (
                "—"
              )
          }
        ]}
      />
      <section
        aria-label="Support notes placeholder"
        className="rounded-md border border-dashed border-[var(--mpa-color-border-default)] bg-white p-4"
      >
        <h2 className="font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">
          Support notes
        </h2>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Notes are not available in Sprint 2. This is a read-only placeholder — no create, edit, or
          delete.
        </p>
      </section>
    </OpsWorkspaceChrome>
  );
}

export function SystemOpsWorkspace({ system }: { system: OpsSystemItem[] }) {
  return (
    <OpsWorkspaceChrome
      eyebrow="Platform Operations · System"
      title="Platform health"
      description="Environment and integration health for Stripe, Supabase, email, background jobs, demo, authentication, and app environment."
    >
      <section
        aria-label="System health cards"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {system.map((item) => (
          <article
            key={item.id}
            className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{item.label}</h2>
              <HealthBadge tone={item.tone} />
            </div>
            <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
          </article>
        ))}
      </section>
    </OpsWorkspaceChrome>
  );
}

export function OperatorsOpsWorkspace({ operators }: { operators: OpsOperatorRow[] }) {
  return (
    <OpsWorkspaceChrome
      eyebrow="Platform Operations · Operators"
      title="Platform operators"
      description="Read-only list of platform operator records. Access control is unchanged — no grant or revoke in this sprint."
    >
      <OpsMetricStrip items={[{ label: "Operators", value: operators.length }]} />
      <OpsDirectoryTable
        caption="Operators"
        rows={operators.map((o) => ({ ...o, id: o.userId }))}
        searchPlaceholder="Search operator user id…"
        searchText={(row) => `${row.userId} ${row.status}`}
        filters={[
          {
            id: "status",
            label: "Status",
            options: uniqueOptions(operators.map((o) => o.status)),
            valueOf: (row) => row.status
          }
        ]}
        columns={[
          {
            id: "user",
            header: "User id",
            cell: (row) => <span className="font-mono text-[11px] break-all">{row.userId}</span>
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge value={row.status} />
          }
        ]}
      />
    </OpsWorkspaceChrome>
  );
}

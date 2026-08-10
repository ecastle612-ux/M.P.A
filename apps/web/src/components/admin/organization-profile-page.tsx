import Link from "next/link";
import { Badge, Button } from "@mpa/ui";
import type { OrgProfileSnapshot } from "../../lib/admin/load-org-profile";
import { OpsMetricStrip, OpsWorkspaceChrome } from "./ops-workspace-chrome";
import { HealthBadge, StatusBadge } from "./ops-directory-table";
import { SupportOrgActions } from "./support-org-actions";

export function OrganizationProfilePage({ profile }: { profile: OrgProfileSnapshot }) {
  const stripeCustomer = profile.subscription.stripeCustomerId
    ? `https://dashboard.stripe.com/customers/${profile.subscription.stripeCustomerId}`
    : null;
  const stripeSub = profile.subscription.stripeSubscriptionId
    ? `https://dashboard.stripe.com/subscriptions/${profile.subscription.stripeSubscriptionId}`
    : null;

  return (
    <OpsWorkspaceChrome
      eyebrow="Platform Operations · Organization"
      title={profile.name}
      description="Support profile — diagnose subscription, provisioning, users, and activity without database access."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/platform/organizations">
            <Button type="button" variant="secondary" size="sm">
              Back to directory
            </Button>
          </Link>
          <Link href={`/admin/testing/impersonation?orgId=${profile.id}`}>
            <Button type="button" size="sm">
              View As…
            </Button>
          </Link>
        </div>
      }
    >
      <OpsMetricStrip
        items={[
          { label: "Members", value: profile.users.length },
          { label: "Properties", value: profile.properties.length },
          { label: "Residents", value: profile.residentsCount },
          { label: "Applications", value: profile.applicationsCount },
          { label: "Documents", value: profile.documentsCount }
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-base font-semibold">Organization summary</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Slug</dt>
              <dd className="font-mono text-xs">{profile.slug}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Status</dt>
              <dd>
                <StatusBadge value={profile.statusBucket} />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Health</dt>
              <dd>
                <HealthBadge tone={profile.health} />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Guided Setup</dt>
              <dd>
                <StatusBadge value={profile.setupComplete ? "complete" : "incomplete"} />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Created</dt>
              <dd className="font-mono text-xs">{new Date(profile.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-base font-semibold">Subscription & billing</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Product</dt>
              <dd>{profile.subscription.skuLabel ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Status</dt>
              <dd>
                {profile.subscription.status ? (
                  <StatusBadge value={profile.subscription.status} />
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--mpa-color-text-secondary)]">Billing cycle</dt>
              <dd>{profile.subscription.billingCycle ?? "—"}</dd>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {stripeCustomer ? (
                <a
                  href={stripeCustomer}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--mpa-color-brand-primary)] underline"
                >
                  Stripe customer
                </a>
              ) : null}
              {stripeSub ? (
                <a
                  href={stripeSub}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--mpa-color-brand-primary)] underline"
                >
                  Stripe subscription
                </a>
              ) : null}
              <Link
                href="/admin/commercial/provisioning"
                className="text-sm text-[var(--mpa-color-brand-primary)] underline"
              >
                Provisioning console
              </Link>
            </div>
          </dl>
        </article>
      </section>

      <SupportOrgActions
        organizationId={profile.id}
        invitations={profile.invitations}
        provisioning={profile.provisioning}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-base font-semibold">Users & roles</h2>
          <ul className="mt-3 space-y-2">
            {profile.users.length === 0 ? (
              <li className="text-sm text-[var(--mpa-color-text-secondary)]">No members.</li>
            ) : (
              profile.users.map((user) => (
                <li key={user.membershipId} className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0">
                  <Link
                    href={`/admin/platform/customers/${user.userId}`}
                    className="text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {user.userId.slice(0, 8)}…
                  </Link>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {user.roles.join(", ") || "—"} · {user.status}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-base font-semibold">Properties</h2>
          <ul className="mt-3 space-y-2">
            {profile.properties.length === 0 ? (
              <li className="text-sm text-[var(--mpa-color-text-secondary)]">No properties on portfolio tables.</li>
            ) : (
              profile.properties.map((property) => (
                <li key={property.id} className="text-sm">
                  {property.name}{" "}
                  {property.status ? <Badge variant="neutral">{property.status}</Badge> : null}
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-base font-semibold">Recent activity</h2>
          <ul className="mt-3 space-y-2">
            {profile.recentEvents.length === 0 ? (
              <li className="text-sm text-[var(--mpa-color-text-secondary)]">No recent events.</li>
            ) : (
              profile.recentEvents.map((event) => (
                <li key={event.id} className="text-sm">
                  <p className="font-medium">{event.type}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {event.detail} · {new Date(event.at).toLocaleString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-base font-semibold">Support audit</h2>
          <ul className="mt-3 space-y-2">
            {profile.supportAudit.length === 0 ? (
              <li className="text-sm text-[var(--mpa-color-text-secondary)]">No support actions yet.</li>
            ) : (
              profile.supportAudit.map((event) => (
                <li key={event.id} className="text-sm">
                  <p className="font-medium">{event.action}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {event.entityType} · {new Date(event.at).toLocaleString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </OpsWorkspaceChrome>
  );
}

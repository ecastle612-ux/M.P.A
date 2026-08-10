import Link from "next/link";
import { OpsWorkspaceChrome } from "./ops-workspace-chrome";
import { StatusBadge } from "./ops-directory-table";
import type { UserProfileSnapshot } from "../../lib/admin/load-user-profile";

export function UserProfilePage({ profile }: { profile: UserProfileSnapshot }) {
  const roleSummary = [...new Set(profile.memberships.flatMap((m) => m.roles))].filter(Boolean);

  return (
    <OpsWorkspaceChrome
      eyebrow="Owner Operations · Customer profile"
      title={profile.displayName ?? profile.email ?? profile.userId}
      description="Diagnose roles, invitations, documents, resident status, and recent activity without database access."
      actions={
        <Link
          href="/admin/platform/customers"
          className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-1.5 text-sm text-[var(--mpa-color-text-secondary)]"
        >
          Back to directory
        </Link>
      }
    >
      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-base font-semibold">Profile</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-[var(--mpa-color-text-secondary)]">User id</dt>
            <dd className="font-mono text-xs break-all">{profile.userId}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-secondary)]">Email</dt>
            <dd>{profile.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-secondary)]">Phone</dt>
            <dd>{profile.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-secondary)]">Auth last sign-in</dt>
            <dd>{profile.authLastSignInAt ? new Date(profile.authLastSignInAt).toLocaleString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-secondary)]">Email confirmed</dt>
            <dd>
              {profile.authEmailConfirmedAt
                ? new Date(profile.authEmailConfirmedAt).toLocaleString()
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-base font-semibold">Roles & organizations</h2>
        {profile.memberships.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">No organization memberships.</p>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-3">Organization</th>
                  <th className="py-2 pr-3">Roles</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {profile.memberships.map((m) => (
                  <tr key={m.id} className="border-b border-[var(--mpa-color-border-subtle)]">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/admin/platform/organizations/${m.organizationId}`}
                        className="text-[var(--mpa-color-brand-primary)] underline"
                      >
                        {m.organizationName}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{m.roles.join(", ") || "—"}</td>
                    <td className="py-2">
                      <StatusBadge value={m.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-base font-semibold">Invitations</h2>
        {profile.invitations.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">No invitations linked.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {profile.invitations.map((inv) => (
              <li
                key={inv.id}
                className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0"
              >
                <p className="text-sm font-medium">{inv.organizationName}</p>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {inv.email} · <StatusBadge value={inv.status} /> ·{" "}
                  {new Date(inv.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-base font-semibold">Documents</h2>
          {profile.documents.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">No documents.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {profile.documents.map((d) => (
                <li key={d.id}>
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {d.status} · {new Date(d.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="font-display text-base font-semibold">Applications & resident status</h2>
          {profile.applications.length === 0 && profile.residentRecords.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
              No applications or resident records linked.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {profile.applications.map((a) => (
                <li key={a.id}>
                  <p className="text-sm font-medium">Application · {a.status}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    Org {a.organizationId.slice(0, 8)}… · {new Date(a.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
              {profile.residentRecords.map((r) => (
                <li key={r.id}>
                  <p className="text-sm font-medium">
                    Resident · {r.displayName} · <StatusBadge value={r.status} />
                  </p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    Org {r.organizationId.slice(0, 8)}…
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-base font-semibold">Permissions summary</h2>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Effective roles across memberships: {roleSummary.length ? roleSummary.join(", ") : "none"}
        </p>
      </section>

      <section className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-base font-semibold">Recent activity</h2>
        {profile.recentAudit.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">No recent audit events.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {profile.recentAudit.map((e) => (
              <li
                key={e.id}
                className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0"
              >
                <p className="text-sm font-medium">{e.action}</p>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {new Date(e.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </OpsWorkspaceChrome>
  );
}

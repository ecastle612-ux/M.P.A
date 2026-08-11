import Link from "next/link";
import { Badge } from "@mpa/ui";
import type { UserProfileSnapshot } from "../../lib/admin/load-user-profile";
import type { Ma3AuditEvent } from "../../lib/admin/ma3-audit";

export function Ma3UserDetailPage({
  profile,
  audit,
  security
}: {
  profile: UserProfileSnapshot;
  audit: Ma3AuditEvent[];
  security: Ma3AuditEvent[];
}) {
  const roles = [...new Set(profile.memberships.flatMap((m) => m.roles))].filter(Boolean);

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/admin/users" className="text-[var(--mpa-color-brand-primary)] underline">
            ← Users
          </Link>
          <Link href="/admin/audit" className="text-[var(--mpa-color-brand-primary)] underline">
            Audit Log
          </Link>
        </div>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          {profile.displayName ?? profile.email ?? profile.userId}
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Read-only user diagnostic — identity, memberships, and related audit/security signals.
        </p>
      </header>

      <section id="identity" className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Identity</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-[var(--mpa-color-text-secondary)]">User ID</dt>
            <dd className="font-mono text-xs break-all">{profile.userId}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-secondary)]">Email</dt>
            <dd>{profile.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-secondary)]">Display name</dt>
            <dd>{profile.displayName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-secondary)]">Phone</dt>
            <dd>{profile.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-secondary)]">Last sign-in</dt>
            <dd>
              {profile.authLastSignInAt
                ? new Date(profile.authLastSignInAt).toLocaleString()
                : "—"}
            </dd>
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
        <p className="mt-2 text-[11px] text-[var(--mpa-color-text-secondary)]">
          Passwords, tokens, and auth secrets are never displayed.
        </p>
      </section>

      <section id="organizations" className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Organizations / Memberships</h2>
        {profile.memberships.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">No memberships.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {profile.memberships.map((m) => (
              <li
                key={m.id}
                className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-sm"
              >
                <Link
                  href={`/admin/platform/organizations/${m.organizationId}`}
                  className="text-[var(--mpa-color-brand-primary)] underline"
                >
                  {m.organizationName}
                </Link>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {m.roles.join(", ") || "no roles"} · {m.status}
                </p>
                <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                  joined {m.createdAt ? new Date(m.createdAt).toLocaleString() : "—"} · updated{" "}
                  {m.updatedAt ? new Date(m.updatedAt).toLocaleString() : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="access" className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Access</h2>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Authoritative roles from memberships: {roles.join(", ") || "none"}
        </p>
        <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
          Fine-grained RBAC administration is deferred to a later MA slice.
        </p>
      </section>

      <section id="activity" className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Recent activity</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <h3 className="text-sm font-semibold">Audit</h3>
            {audit.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No related audit events.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {audit.slice(0, 12).map((e) => (
                  <li key={e.id} className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-xs">
                    <Link
                      href={`/admin/audit/${e.id}`}
                      className="text-[var(--mpa-color-brand-primary)] underline"
                    >
                      {e.action}
                    </Link>
                    <p className="text-[var(--mpa-color-text-secondary)]">
                      {e.source} · {e.organizationName ?? e.organizationId ?? "—"} ·{" "}
                      {e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
          <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <h3 className="text-sm font-semibold">Security signals</h3>
            {security.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                No auth/security durable errors linked to this user.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {security.slice(0, 12).map((e) => (
                  <li key={e.id} className="border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0 text-xs">
                    <Badge variant="warning">{e.result}</Badge> {e.reason}
                    <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                      {e.correlationId ?? "—"} · {e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

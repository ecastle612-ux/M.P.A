import Link from "next/link";
import { Badge } from "@mpa/ui";
import type { Ma3UsersDirectory } from "../../lib/admin/load-ma3-users";

export function Ma3UsersPage({ directory }: { directory: Ma3UsersDirectory }) {
  const { users, memberships, filters, degraded, totals } = directory;
  const view = filters.organizationId || filters.role || filters.status ? "memberships" : "users";

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Master Admin
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Users
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Platform-wide people and memberships — who belongs where, with which roles. Read-only.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3">
          <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">Users</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{totals.users}</p>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3">
          <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">Memberships</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{totals.memberships}</p>
        </article>
        <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3">
          <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">Active memberships</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{totals.activeMemberships}</p>
        </article>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-4"
      >
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Search
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="user id, email, org…"
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Organization ID
          <input
            name="organizationId"
            defaultValue={filters.organizationId ?? ""}
            placeholder="uuid"
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 font-mono text-sm"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Role
          <input
            name="role"
            defaultValue={filters.role ?? ""}
            placeholder="property_manager…"
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Membership status
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </label>
        <div className="md:col-span-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-[var(--mpa-color-brand-primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Apply filters
          </button>
          <Link href="/admin/users" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            Clear
          </Link>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Membership mutations are deferred. Showing {view === "memberships" ? "filtered memberships" : "users"}.
          </p>
        </div>
      </form>

      {degraded.length > 0 ? (
        <div
          role="status"
          className="rounded-md border border-l-4 border-l-[#C0392B] border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm"
        >
          <p className="font-semibold">Partial data</p>
          <ul className="mt-1 list-disc pl-5 text-[var(--mpa-color-text-secondary)]">
            {degraded.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {filters.organizationId || filters.role || filters.status ? (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Memberships</h2>
          {memberships.length === 0 ? (
            <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-6 text-sm text-[var(--mpa-color-text-secondary)]">
              No memberships match filters.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
              {memberships.map((m) => (
                <li key={m.membershipId} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/users/${m.userId}`}
                      className="font-mono text-xs text-[var(--mpa-color-brand-primary)] underline"
                    >
                      {m.displayName ?? m.email ?? m.userId}
                    </Link>
                    <Badge variant="neutral">{m.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                    <Link
                      href={`/admin/platform/organizations/${m.organizationId}`}
                      className="text-[var(--mpa-color-brand-primary)] underline"
                    >
                      {m.organizationName}
                    </Link>{" "}
                    · {m.roles.join(", ") || "no roles"}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                    updated {m.updatedAt ? new Date(m.updatedAt).toLocaleString() : "—"}
                    {m.createdAt ? ` · created ${new Date(m.createdAt).toLocaleString()}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">Users</h2>
          {users.length === 0 ? (
            <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-6 text-sm text-[var(--mpa-color-text-secondary)]">
              No users found.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
              {users.map((u) => (
                <li key={u.userId}>
                  <Link
                    href={`/admin/users/${u.userId}`}
                    className="block px-4 py-3 hover:bg-[var(--mpa-color-bg-app)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                        {u.displayName ?? u.email ?? u.userId}
                      </span>
                      <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {u.organizationCount} org{u.organizationCount === 1 ? "" : "s"} ·{" "}
                        {u.activeMembershipCount} active
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-[var(--mpa-color-text-secondary)]">
                      {u.userId}
                    </p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {u.roles.join(", ") || "no roles"} · statuses {u.membershipStatuses.join(", ") || "—"}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                      last activity{" "}
                      {u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleString() : "—"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

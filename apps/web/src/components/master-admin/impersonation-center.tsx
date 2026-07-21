"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@mpa/ui";
import type { MasterAdminPortal } from "../../lib/master-admin/contracts";

type PersonRow = {
  userId: string;
  displayName: string;
  email: string | null;
  roles: string[];
  roleLabel: string;
  redirectTo: string;
};

type OrgRow = { id: string; name: string; slug: string | null };
type PropertyRow = { id: string; name: string; code: string | null };

const EMERGENCY_PORTALS: Array<{ portal: MasterAdminPortal; label: string }> = [
  { portal: "resident", label: "Resident Portal" },
  { portal: "vendor", label: "Vendor Portal" },
  { portal: "owner", label: "Owner Portal" },
  { portal: "manager", label: "Manager Portal" }
];

export function ImpersonationCenter({
  people,
  organizations,
  properties
}: {
  people: PersonRow[];
  organizations: OrgRow[];
  properties: PropertyRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingPortal, setPendingPortal] = useState<MasterAdminPortal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (person) =>
        person.displayName.toLowerCase().includes(q) ||
        (person.email ?? "").toLowerCase().includes(q) ||
        person.roleLabel.toLowerCase().includes(q)
    );
  }, [people, query]);

  async function impersonate(person: PersonRow) {
    setError(null);
    setPendingUserId(person.userId);
    try {
      const response = await fetch("/api/master-admin/impersonation/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetUserId: person.userId,
          targetDisplayName: person.displayName,
          targetRoleLabel: person.roleLabel,
          redirectTo: person.redirectTo
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { redirectTo?: string; message?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to impersonate user.");
      }
      router.push(payload?.redirectTo ?? "/dashboard");
      router.refresh();
    } catch (impersonateError) {
      setError(impersonateError instanceof Error ? impersonateError.message : "Unable to impersonate.");
    } finally {
      setPendingUserId(null);
    }
  }

  async function launchEmergency(portal: MasterAdminPortal) {
    setError(null);
    setPendingPortal(portal);
    try {
      const response = await fetch("/api/master-admin/portal-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ portal, reason: "emergency_support" })
      });
      const payload = (await response.json().catch(() => null)) as
        | { redirectTo?: string; message?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to launch portal.");
      }
      router.push(payload?.redirectTo ?? "/portal");
      router.refresh();
    } catch (launchError) {
      setError(launchError instanceof Error ? launchError.message : "Unable to launch portal.");
    } finally {
      setPendingPortal(null);
    }
  }

  return (
    <div className="space-y-5">
      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          Emergency Support Mode
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Launch any portal in Test Mode with demo data — no user search required.
        </p>
        <div className="flex flex-wrap gap-2">
          {EMERGENCY_PORTALS.map((item) => (
            <Button
              key={item.portal}
              type="button"
              variant="secondary"
              disabled={pendingPortal === item.portal}
              onClick={() => void launchEmergency(item.portal)}
            >
              {pendingPortal === item.portal ? "Opening…" : item.label}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="text-base font-semibold">Organizations</h2>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {organizations.map((org) => (
              <li key={org.id} className="rounded-md bg-[var(--mpa-color-bg-muted)] px-2 py-1.5">
                {org.name}
                {org.slug ? (
                  <span className="text-[var(--mpa-color-text-tertiary)]"> · {org.slug}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-2">
          <h2 className="text-base font-semibold">Properties (active org)</h2>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {properties.length === 0 ? (
              <li className="text-[var(--mpa-color-text-secondary)]">No properties in this organization.</li>
            ) : (
              properties.map((property) => (
                <li key={property.id} className="rounded-md bg-[var(--mpa-color-bg-muted)] px-2 py-1.5">
                  {property.name}
                  {property.code ? (
                    <span className="text-[var(--mpa-color-text-tertiary)]"> · {property.code}</span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">People</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Residents, owners, vendors, and managers in the active organization.
            </p>
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, role…"
            className="max-w-xs"
          />
        </div>
        <ul className="divide-y divide-[var(--mpa-color-border-subtle)]">
          {filtered.map((person) => (
            <li key={person.userId} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium text-[var(--mpa-color-text-primary)]">{person.displayName}</p>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {person.roleLabel}
                  {person.email ? ` · ${person.email}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push(person.redirectTo)}
                >
                  View Profile
                </Button>
                <Button
                  type="button"
                  disabled={pendingUserId === person.userId}
                  onClick={() => void impersonate(person)}
                >
                  {pendingUserId === person.userId ? "Starting…" : "Impersonate User"}
                </Button>
              </div>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="py-4 text-sm text-[var(--mpa-color-text-secondary)]">No matching people.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}

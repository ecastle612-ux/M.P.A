"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, EmptyState, Input, Skeleton } from "@mpa/ui";
import { ErrorRetry } from "../shell/error-retry";
import { FoPageChrome, FoQuickActions } from "../shell/fo-workspace";

type VendorRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  user_id: string | null;
};

/**
 * Facility Operations vendor directory — same vendor_vendors records as PM,
 * FO-branded workflow: Vendors → Add → Assign from Operations.
 */
export function FacilityVendorsWorkspace() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/facility/vendors");
    const body = (await response.json()) as { vendors?: VendorRow[]; error?: string };
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load vendors");
    }
    setVendors(body.vendors ?? []);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        await refresh();
        if (!controller.signal.aborted) {
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to load vendors");
          setLoading(false);
        }
      }
    })();
    return () => controller.abort();
  }, [refresh, reloadToken]);

  function retry() {
    setLoading(true);
    setError(null);
    setReloadToken((value) => value + 1);
  }

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Facility Operations Mission Control" },
        { label: "Vendors" }
      ]}
      eyebrow="Facility Operations"
      title="Facility vendors"
      description="Add HVAC, plumbing, electrical, and contractor contacts. Assign them from Operations — no Property Manager workspace required."
    >
      <FoQuickActions
        actions={[
          { href: "/facility/operations", label: "Assign in Operations", primary: true },
          { href: "/facility/mission-control", label: "Mission Control" },
          { href: "/facility/assets", label: "Assets" }
        ]}
      />

      <p
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]"
        data-testid="fo-vendors-guidance"
      >
        Facility Operations → Vendors → Add vendor → Create/assign work in Operations → Track
        execution. Email is required so vendor portal access can be provisioned on assignment.
      </p>

      <form
        className="grid max-w-xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        data-testid="fo-add-vendor-form"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            setBusy(true);
            setNotice(null);
            setError(null);
            try {
              const response = await fetch("/api/facility/vendors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: name.trim(),
                  email: email.trim(),
                  phone: phone.trim() || undefined
                })
              });
              const body = (await response.json()) as { error?: string };
              if (!response.ok) {
                throw new Error(body.error ?? "Failed to add vendor");
              }
              setName("");
              setEmail("");
              setPhone("");
              setNotice("Vendor added. Assign them from Operations on a facility work order.");
              setLoading(true);
              setReloadToken((value) => value + 1);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to add vendor");
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Add vendor</h2>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Company name</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            placeholder="Harborline HVAC"
            data-testid="fo-vendor-name"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Contact email (required for assignment)</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="dispatch@vendor.example"
            data-testid="fo-vendor-email"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Contact phone (optional)</span>
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="555-0100"
            data-testid="fo-vendor-phone"
          />
        </label>
        <Button type="submit" className="min-h-11" disabled={busy} data-testid="fo-vendor-submit">
          {busy ? "Adding…" : "Add vendor"}
        </Button>
      </form>

      {notice ? (
        <Alert variant="success" title="Vendor ready">
          <p>{notice}</p>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {!loading && error ? (
        <ErrorRetry title="Unable to load vendors" description={error} onRetry={retry} />
      ) : null}

      {!loading && !error && vendors.length === 0 ? (
        <EmptyState
          title="No facility vendors yet"
          description="Add your first vendor contact, then assign facility work from Operations."
        />
      ) : null}

      {!loading && !error && vendors.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2" data-testid="fo-vendor-list">
          {vendors.map((vendor) => (
            <li
              key={vendor.id}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
              data-testid={`fo-vendor-${vendor.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
                  {vendor.name}
                </h3>
                <Badge variant="neutral">{vendor.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                {vendor.email ?? "No email"} · {vendor.phone ?? "No phone"}
              </p>
              <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                {vendor.user_id
                  ? "Vendor portal linked"
                  : "Portal links when you assign facility work"}
              </p>
              <Link
                href="/facility/operations"
                className="mt-3 inline-block text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
              >
                Assign facility work
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </FoPageChrome>
  );
}

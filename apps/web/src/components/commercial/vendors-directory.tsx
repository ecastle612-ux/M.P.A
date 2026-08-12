"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert, Button, EmptyState, Input, Skeleton } from "@mpa/ui";
import { ErrorRetry } from "../shell/error-retry";
import {
  PmDocumentsStrip,
  PmEntityCard,
  PmPageChrome,
  PmQuickActions,
  documentsHref
} from "../shell/pm-workspace";

type VendorRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  user_id: string | null;
};

export function VendorsDirectory() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/pm/maintenance/vendors");
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
    <PmPageChrome
      crumbs={[
        { href: "/pm/mission-control", label: "Mission Control" },
        { label: "Vendors" }
      ]}
      eyebrow="Property Manager · Vendors"
      title="Vendors"
      description="Your organization vendor directory. Add vendors here, assign them from Maintenance, and manage invoices in Financial Operations."
    >
      <PmQuickActions
        actions={[
          { href: "/pm/maintenance", label: "Assign in Maintenance", primary: true },
          { href: "/pm/financial-operations#vendor-invoices", label: "Vendor invoices" },
          { href: documentsHref("vendor"), label: "Vendor contracts" }
        ]}
      />

      <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
        Vendors are shared organization records. Creating a vendor here uses the same directory as
        Maintenance assignment and Facility Operations payables.
      </p>

      <form
        className="grid max-w-xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            setBusy(true);
            setNotice(null);
            setError(null);
            try {
              const response = await fetch("/api/pm/maintenance/vendors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name,
                  email: email.trim() || undefined
                })
              });
              const body = await response.json();
              if (!response.ok) {
                throw new Error(body.error ?? "Failed to add vendor");
              }
              setName("");
              setEmail("");
              setNotice("Vendor added to the directory.");
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
        <h2 className="text-sm font-semibold">Add vendor</h2>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Vendor name</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            placeholder="Acme HVAC"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium">Email (optional, for vendor portal)</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="dispatch@vendor.example"
          />
        </label>
        <Button type="submit" className="min-h-11" disabled={busy}>
          Add vendor
        </Button>
      </form>

      {notice ? <Alert variant="success">{notice}</Alert> : null}

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
          title="No vendors yet"
          description="Add your first vendor to assign work orders and track invoices against a shared directory."
        />
      ) : null}

      {!loading && !error && vendors.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {vendors.map((vendor) => (
            <PmEntityCard
              key={vendor.id}
              title={vendor.name}
              href="/pm/maintenance"
              meta={[
                vendor.email ?? "No email on file",
                vendor.phone ?? "No phone on file",
                vendor.user_id ? "Portal linked" : "No portal user yet"
              ].join(" · ")}
              status={vendor.status}
              footer="Assign from Maintenance · invoices in Financial Operations"
            >
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/pm/maintenance"
                  className="text-[var(--mpa-color-brand-primary)] underline"
                >
                  Assign work
                </Link>
                <Link
                  href="/pm/financial-operations#vendor-invoices"
                  className="text-[var(--mpa-color-brand-primary)] underline"
                >
                  Vendor invoices
                </Link>
              </div>
            </PmEntityCard>
          ))}
        </ul>
      ) : null}

      <PmDocumentsStrip
        entityType="vendor"
        title="Vendor contracts"
        detail="Contracts and vendor paperwork attach in Documents."
      />
    </PmPageChrome>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Select } from "@mpa/ui";
import { PRODUCT_SKUS, SKU_SUMMARIES, toSkuLabel, type ProductSku } from "@mpa/shared";

type GrantRow = {
  id: string;
  organization_id: string;
  organization_name?: string | null;
  organization_slug?: string | null;
  plan_granted: ProductSku;
  grant_status: "active" | "revoked" | "expired";
  start_date: string;
  expiration_date: string | null;
  reason: string;
  notes: string | null;
  created_at: string;
};

type Duration = "7d" | "30d" | "custom" | "none";
type StatusFilter = "active" | "expired" | "revoked" | "all";

export function TesterGrantsConsole() {
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<ProductSku>("mpa_property_manager");
  const [duration, setDuration] = useState<Duration>("30d");
  const [customExpiration, setCustomExpiration] = useState("");
  const [allowNoExpiration, setAllowNoExpiration] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/admin/testers?status=${statusFilter}`);
    const payload = (await response.json()) as { grants?: GrantRow[]; error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to load grants");
      return;
    }
    setGrants(payload.grants ?? []);
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createGrant() {
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/testers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        planGranted: plan,
        duration,
        customExpiration: duration === "custom" ? new Date(customExpiration).toISOString() : undefined,
        allowNoExpiration: duration === "none" ? allowNoExpiration : false,
        reason,
        notes: notes.trim() || undefined
      })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to create grant");
      return;
    }
    setNotice("Complimentary grant created.");
    setEmail("");
    setReason("");
    setNotes("");
    setAllowNoExpiration(false);
    await load();
  }

  async function extendGrant(grantId: string) {
    const days = window.prompt("Extend by how many days?", "30");
    if (!days) return;
    const n = Number(days);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Extension days must be a positive number.");
      return;
    }
    const next = new Date();
    next.setUTCDate(next.getUTCDate() + Math.floor(n));
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/admin/testers/${grantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extend", expirationDate: next.toISOString() })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to extend grant");
      return;
    }
    setNotice("Grant extended.");
    await load();
  }

  async function revokeGrant(grantId: string) {
    if (!window.confirm("Revoke complimentary access for this organization?")) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/admin/testers/${grantId}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to revoke grant");
      return;
    }
    setNotice("Grant revoked.");
    await load();
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold">Tester access</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Grant time-bounded complimentary product access without creating Stripe subscriptions.
          Active Stripe subscriptions always take precedence.
        </p>
      </header>

      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Create grant</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Tester email</span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tester@example.com"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Plan</span>
            <Select value={plan} onChange={(event) => setPlan(event.target.value as ProductSku)}>
              {PRODUCT_SKUS.map((sku) => (
                <option key={sku} value={sku}>
                  {SKU_SUMMARIES[sku].label}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Duration</span>
            <Select
              value={duration}
              onChange={(event) => setDuration(event.target.value as Duration)}
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="custom">Custom expiration</option>
              <option value="none">No expiration</option>
            </Select>
          </label>
          {duration === "custom" ? (
            <label className="space-y-1 text-sm">
              <span>Custom expiration</span>
              <Input
                type="datetime-local"
                value={customExpiration}
                onChange={(event) => setCustomExpiration(event.target.value)}
              />
            </label>
          ) : null}
          <label className="space-y-1 text-sm md:col-span-2">
            <span>Reason</span>
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Pre-launch FO tester cohort"
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span>Notes (optional)</span>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>
        {duration === "none" ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowNoExpiration}
              onChange={(event) => setAllowNoExpiration(event.target.checked)}
            />
            Confirm no expiration (requires explicit approval)
          </label>
        ) : null}
        <Button type="button" disabled={loading || !email || !reason} onClick={() => void createGrant()}>
          Create complimentary grant
        </Button>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Grants</h2>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
            <option value="all">All</option>
          </Select>
          <Button type="button" variant="secondary" disabled={loading} onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {loading ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading…</p> : null}
        {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
        {notice ? <p className="text-sm text-[#0F6B56]">{notice}</p> : null}

        <ul className="space-y-3">
          {grants.map((grant) => (
            <li
              key={grant.id}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">
                    {grant.organization_name ?? grant.organization_id}
                  </p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {grant.organization_slug ?? grant.organization_id} · {toSkuLabel(grant.plan_granted)} ·{" "}
                    {grant.grant_status}
                  </p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    Starts {new Date(grant.start_date).toLocaleString()} · Expires{" "}
                    {grant.expiration_date
                      ? new Date(grant.expiration_date).toLocaleString()
                      : "never"}
                  </p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">Reason: {grant.reason}</p>
                </div>
                {grant.grant_status === "active" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={loading} onClick={() => void extendGrant(grant.id)}>
                      Extend
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={loading}
                      onClick={() => void revokeGrant(grant.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
          {!loading && grants.length === 0 ? (
            <li className="text-sm text-[var(--mpa-color-text-secondary)]">No grants in this filter.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}

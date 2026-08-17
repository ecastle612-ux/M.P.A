"use client";

import { useState } from "react";
import { Button, Input, Select } from "@mpa/ui";
import {
  COMPLIMENTARY_DURATION_PRESETS,
  PRODUCT_SKUS,
  SKU_SUMMARIES,
  type ComplimentaryDurationId,
  type ComplimentaryGrantType,
  type ComplimentaryLimitMode,
  type ProductSku
} from "@mpa/shared";

type GrantRow = {
  id: string;
  recipientEmail: string;
  organizationName: string | null;
  grantType: ComplimentaryGrantType;
  productSku: ProductSku;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  limitMode: ComplimentaryLimitMode;
  customUnitLimit: number | null;
  convertedAt: string | null;
};

function limitLabel(row: GrantRow): string {
  if (row.limitMode === "unlimited") return "Unlimited";
  if (row.limitMode === "custom") return `${row.customUnitLimit ?? 0} units`;
  return "Product normal";
}

export function ComplimentaryAccessConsole() {
  const [grants, setGrants] = useState<GrantRow[] | null>(null);
  const [email, setEmail] = useState("");
  const [grantType, setGrantType] = useState<ComplimentaryGrantType>("tester");
  const [productSku, setProductSku] = useState<ProductSku>("mpa_property_manager");
  const [durationId, setDurationId] = useState<ComplimentaryDurationId>("30d");
  const [limitMode, setLimitMode] = useState<ComplimentaryLimitMode>("product_normal");
  const [customUnitLimit, setCustomUnitLimit] = useState("500");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/complimentary-access");
    const payload = (await response.json()) as { grants?: GrantRow[]; error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to load grants");
      return;
    }
    setGrants(payload.grants ?? []);
  }

  async function sendAccess() {
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/complimentary-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        grantType,
        productSku,
        durationId,
        limitMode,
        customUnitLimit: limitMode === "custom" ? Number(customUnitLimit) : null
      })
    });
    const payload = (await response.json()) as { error?: string; resent?: boolean };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to send access");
      return;
    }
    setNotice(payload.resent ? "Access resent." : "Access sent.");
    setEmail("");
    await load();
  }

  async function act(grantId: string, action: string, extra: Record<string, unknown> = {}) {
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/complimentary-access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantId, action, ...extra })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Action failed");
      return;
    }
    setNotice("Updated.");
    await load();
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Complimentary Access</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Email → TESTER/GIFT → product → duration → optional limit → Send Access. M.P.A. sends the
          welcome email and claim link. No card. No public free plan.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void sendAccess();
        }}
      >
        <label className="text-sm">
          Email
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1"
          />
        </label>
        <label className="text-sm">
          Grant type
          <Select
            value={grantType}
            onChange={(event) => setGrantType(event.target.value as ComplimentaryGrantType)}
            className="mt-1"
          >
            <option value="tester">TESTER</option>
            <option value="gift">GIFT</option>
          </Select>
        </label>
        <label className="text-sm">
          Product
          <Select
            value={productSku}
            onChange={(event) => setProductSku(event.target.value as ProductSku)}
            className="mt-1"
          >
            {PRODUCT_SKUS.map((sku) => (
              <option key={sku} value={sku}>
                {SKU_SUMMARIES[sku].label}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-sm">
          Duration
          <Select
            value={durationId}
            onChange={(event) => setDurationId(event.target.value as ComplimentaryDurationId)}
            className="mt-1"
          >
            {COMPLIMENTARY_DURATION_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-sm">
          Limit
          <Select
            value={limitMode}
            onChange={(event) => setLimitMode(event.target.value as ComplimentaryLimitMode)}
            className="mt-1"
          >
            <option value="product_normal">Product normal</option>
            <option value="custom">Custom unit limit</option>
            <option value="unlimited">Unlimited</option>
          </Select>
        </label>
        {limitMode === "custom" ? (
          <label className="text-sm">
            Custom unit limit
            <Input
              type="number"
              min={1}
              value={customUnitLimit}
              onChange={(event) => setCustomUnitLimit(event.target.value)}
              className="mt-1"
            />
          </label>
        ) : null}
        <div className="md:col-span-2">
          <Button type="submit" disabled={loading}>
            Send Access
          </Button>
        </div>
      </form>

      {grants === null ? (
        <Button type="button" onClick={() => void load()}>
          Load directory
        </Button>
      ) : null}
      {loading ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">Working…</p> : null}
      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {notice ? <p className="text-sm text-[#0F6B56]">{notice}</p> : null}

      {grants ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--mpa-color-border-default)] text-[var(--mpa-color-text-secondary)]">
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Organization</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Granted</th>
                <th className="py-2 pr-3">Expiration</th>
                <th className="py-2 pr-3">Limit</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => (
                <tr key={grant.id} className="border-b border-[var(--mpa-color-border-default)]">
                  <td className="py-2 pr-3">{grant.recipientEmail}</td>
                  <td className="py-2 pr-3">{grant.organizationName ?? "—"}</td>
                  <td className="py-2 pr-3 uppercase">{grant.grantType}</td>
                  <td className="py-2 pr-3">{SKU_SUMMARIES[grant.productSku].label}</td>
                  <td className="py-2 pr-3 uppercase">
                    {grant.convertedAt ? "converted" : grant.status}
                  </td>
                  <td className="py-2 pr-3">{grant.createdAt.slice(0, 10)}</td>
                  <td className="py-2 pr-3">{grant.expiresAt ? grant.expiresAt.slice(0, 10) : "None"}</td>
                  <td className="py-2 pr-3">{limitLabel(grant)}</td>
                  <td className="flex flex-wrap gap-1 py-2">
                    <Button type="button" disabled={loading} onClick={() => void act(grant.id, "resend")}>
                      Resend
                    </Button>
                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => void act(grant.id, "extend", { durationId: "30d" })}
                    >
                      Extend 30d
                    </Button>
                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => void act(grant.id, "remove_expiration")}
                    >
                      Remove Expiration
                    </Button>
                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        void act(grant.id, "change_limit", {
                          limitMode: "unlimited"
                        })
                      }
                    >
                      Unlimited
                    </Button>
                    {grant.grantType === "tester" ? (
                      <Button
                        type="button"
                        disabled={loading}
                        onClick={() => void act(grant.id, "convert_to_gift")}
                      >
                        Convert to Gift
                      </Button>
                    ) : null}
                    <Button type="button" disabled={loading} onClick={() => void act(grant.id, "revoke")}>
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {grants.length === 0 ? (
            <p className="pt-3 text-sm text-[var(--mpa-color-text-secondary)]">No grants yet.</p>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

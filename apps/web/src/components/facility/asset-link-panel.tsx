"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Select } from "@mpa/ui";
import type { FacilityAssetListItem } from "../../lib/facility/asset-contracts";
import { formatAssetTypeLabel } from "../../lib/facility/asset-contracts";

export function AssetLinkPanel({
  recordId,
  currentAssetId,
  currentAssetLabel,
  assets,
  canLink
}: {
  recordId: string;
  currentAssetId: string | null;
  currentAssetLabel: string | null;
  assets: FacilityAssetListItem[];
  canLink: boolean;
}) {
  const router = useRouter();
  const [assetId, setAssetId] = useState(currentAssetId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function linkAsset(nextAssetId: string | null) {
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/facility/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "link_asset", assetId: nextAssetId })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Unable to link asset");
      return;
    }
    setNotice(nextAssetId ? "Facility record linked to asset." : "Asset unlinked.");
    router.refresh();
  }

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Asset</h3>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Optionally attach this permanent repair to an asset so future work accumulates under one identity.
        </p>
      </div>

      {currentAssetId && currentAssetLabel ? (
        <p className="text-sm">
          Linked to{" "}
          <Link
            href={`/facility/assets/${currentAssetId}`}
            className="font-medium text-[var(--mpa-color-brand-primary)] underline-offset-2 hover:underline"
          >
            {currentAssetLabel}
          </Link>
        </p>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No asset linked.</p>
      )}

      {canLink ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            aria-label="Link facility record to asset"
            value={assetId}
            onChange={(event) => setAssetId(event.target.value)}
            disabled={loading}
          >
            <option value="">Select asset…</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.assetCode} · {asset.name} ({formatAssetTypeLabel(asset.assetType, asset.customTypeLabel)})
              </option>
            ))}
          </Select>
          <Button
            type="button"
            disabled={loading || !assetId}
            onClick={() => void linkAsset(assetId || null)}
          >
            Link asset
          </Button>
          {currentAssetId ? (
            <Button type="button" variant="secondary" disabled={loading} onClick={() => void linkAsset(null)}>
              Unlink
            </Button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
    </Card>
  );
}

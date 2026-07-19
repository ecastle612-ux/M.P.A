"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@mpa/ui";
import {
  UNIT_OCCUPANCY_STATUSES,
  buildBulkUnitPreview,
  toUnitOccupancyLabel,
  type BulkUnitGeneratorInput,
  type UnitOccupancyStatus
} from "../../lib/unit/contracts";
import { readApiError } from "../../lib/api/client-error";
import { ConfirmActionDialog } from "../trust/confirm-action-dialog";
import { OperationalStatus } from "../trust/operational-status";
import { ApiErrorAlert } from "../trust/validation-alert";
import { useSubmissionGuard } from "../../hooks/use-submission-guard";

type Props = {
  properties: Array<{ id: string; name: string }>;
  initialPropertyId?: string | null;
};

export function BulkUnitGenerator({ properties, initialPropertyId }: Props) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState(
    initialPropertyId && properties.some((p) => p.id === initialPropertyId)
      ? initialPropertyId
      : (properties[0]?.id ?? "")
  );
  const [startNumber, setStartNumber] = useState("101");
  const [endNumber, setEndNumber] = useState("110");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [padWidth, setPadWidth] = useState("0");
  const [floorTemplate, setFloorTemplate] = useState<"none" | "hundreds" | "explicit">("hundreds");
  const [floorLabel, setFloorLabel] = useState("");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [occupancyStatus, setOccupancyStatus] = useState<UnitOccupancyStatus>("vacant_not_ready");
  const [step, setStep] = useState<"configure" | "review">("configure");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const { busy, run } = useSubmissionGuard(5000);

  const generatorInput: BulkUnitGeneratorInput = useMemo(
    () => ({
      propertyId,
      startNumber: Number.parseInt(startNumber, 10) || 0,
      endNumber: Number.parseInt(endNumber, 10) || 0,
      prefix,
      suffix,
      padWidth: Number.parseInt(padWidth, 10) || 0,
      floorTemplate,
      floorLabel: floorLabel.trim() || null,
      bedrooms: bedrooms === "" ? null : Number(bedrooms),
      bathrooms: bathrooms === "" ? null : Number(bathrooms),
      squareFeet: null,
      rentAmount: rentAmount === "" ? null : Number(rentAmount),
      depositAmount: depositAmount === "" ? null : Number(depositAmount),
      currencyCode: "USD",
      occupancyStatus,
      status: "active"
    }),
    [
      propertyId,
      startNumber,
      endNumber,
      prefix,
      suffix,
      padWidth,
      floorTemplate,
      floorLabel,
      bedrooms,
      bathrooms,
      rentAmount,
      depositAmount,
      occupancyStatus
    ]
  );

  const preview = useMemo(() => buildBulkUnitPreview(generatorInput), [generatorInput]);

  function handlePreview(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (preview.errors.length > 0) {
      setError(preview.errors.join(" "));
      return;
    }
    setStep("review");
  }

  async function handleCreate() {
    setError(null);
    if (preview.errors.length > 0 || preview.items.length === 0) {
      setError(preview.errors[0] ?? "Nothing to create.");
      return;
    }
    setConfirmOpen(false);
    await run(`bulk-units:${propertyId}:${preview.items.length}`, async () => {
      setSubmitting(true);
      setProgress(15);
      try {
        const progressTimer = window.setInterval(() => {
          setProgress((current) => (current === undefined || current >= 85 ? current : current + 10));
        }, 400);
        const response = await fetch("/api/units/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(generatorInput)
        });
        window.clearInterval(progressTimer);
        setProgress(100);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(readApiError(payload, "Bulk creation failed. Check for duplicate unit numbers and try again."));
          setSubmitting(false);
          setProgress(undefined);
          return;
        }
        const count = (payload as { count?: number }).count ?? preview.items.length;
        router.push(`/units?propertyId=${propertyId}&created=${count}&from=bulk-units-created`);
        router.refresh();
      } catch {
        setError("Network unavailable while creating units. Check your connection and retry.");
        setSubmitting(false);
        setProgress(undefined);
      }
    });
  }

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Bulk create units</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Generate a sequence of units for a multifamily property. Preview before creating.
        </p>
      </div>

      {step === "configure" ? (
        <form className="space-y-4" onSubmit={handlePreview}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Property</span>
            <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Start number</span>
              <Input value={startNumber} onChange={(e) => setStartNumber(e.target.value)} inputMode="numeric" required />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">End number</span>
              <Input value={endNumber} onChange={(e) => setEndNumber(e.target.value)} inputMode="numeric" required />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Prefix</span>
              <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="Optional, e.g. A-" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Suffix</span>
              <Input value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="Optional" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Zero-pad width</span>
              <Input value={padWidth} onChange={(e) => setPadWidth(e.target.value)} inputMode="numeric" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Floor template</span>
              <Select
                value={floorTemplate}
                onChange={(e) => setFloorTemplate(e.target.value as "none" | "hundreds" | "explicit")}
              >
                <option value="none">No floor</option>
                <option value="hundreds">Floor from hundreds (101 → 1)</option>
                <option value="explicit">Same floor for all</option>
              </Select>
            </label>
          </div>

          {floorTemplate === "explicit" ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Floor label</span>
              <Input value={floorLabel} onChange={(e) => setFloorLabel(e.target.value)} />
            </label>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Bedrooms</span>
              <Input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} inputMode="decimal" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Bathrooms</span>
              <Input value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} inputMode="decimal" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Rent amount</span>
              <Input value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} inputMode="decimal" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Deposit amount</span>
              <Input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} inputMode="decimal" />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Occupancy status</span>
            <Select
              value={occupancyStatus}
              onChange={(e) => setOccupancyStatus(e.target.value as UnitOccupancyStatus)}
            >
              {UNIT_OCCUPANCY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {toUnitOccupancyLabel(status)}
                </option>
              ))}
            </Select>
          </label>

          {preview.items.length > 0 && preview.errors.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Preview: {preview.items.slice(0, 5).map((i) => i.unitNumber).join(", ")}
              {preview.items.length > 5 ? ` … (+${preview.items.length - 5} more)` : ""} · {preview.items.length} units
            </p>
          ) : null}

          {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}

          <Button type="submit">Preview units</Button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Review {preview.items.length} units, then create. Duplicates on the property will be rejected.
          </p>
          <div className="max-h-64 overflow-auto rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[var(--mpa-color-bg-muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Unit</th>
                  <th className="px-3 py-2 font-medium">Floor</th>
                </tr>
              </thead>
              <tbody>
                {preview.items.map((item) => (
                  <tr key={item.unitNumber} className="border-t border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-1.5">{item.unitNumber}</td>
                    <td className="px-3 py-1.5 text-[var(--mpa-color-text-secondary)]">{item.floor ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error ? <ApiErrorAlert message={error} /> : null}
          {submitting || busy ? (
            typeof progress === "number" ? (
              <OperationalStatus message={`Creating ${preview.items.length} units…`} progress={progress} />
            ) : (
              <OperationalStatus message={`Creating ${preview.items.length} units…`} />
            )
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={submitting || busy}
              onClick={() => setConfirmOpen(true)}
            >
              {submitting || busy ? "Creating…" : `Create ${preview.items.length} units`}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={submitting || busy}
              onClick={() => setStep("configure")}
            >
              Back
            </Button>
          </div>
          <ConfirmActionDialog
            open={confirmOpen}
            title={`Create ${preview.items.length} units?`}
            consequence={`M.P.A. will create ${preview.items.length} unit records on the selected property. Duplicate unit numbers will be rejected. This cannot be undone in one click — review the list carefully.`}
            confirmLabel={`Create ${preview.items.length} units`}
            busy={submitting || busy}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => void handleCreate()}
          />
        </div>
      )}
    </Card>
  );
}

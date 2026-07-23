"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Modal, Select, Textarea, useToast } from "@mpa/ui";
import type { TenantListItem } from "../../lib/tenant/server";
import type { MoveOutChecklist } from "../../lib/resident-lifecycle/contracts";
import { readApiError } from "../../lib/api/client-error";
import { emptyMoveOutChecklist, formatCurrencySafe } from "./lifecycle-format";
import { Field } from "./field";

const STEPS = ["Select", "Details", "Checklist", "Complete"] as const;

const CHECKLIST_LABELS: Array<{ key: keyof MoveOutChecklist; label: string }> = [
  { key: "keysReturned", label: "Keys returned" },
  { key: "finalBalanceSettled", label: "Final balance settled" },
  { key: "depositResolved", label: "Deposit refunded or withheld" },
  { key: "documentsArchived", label: "Documents archived" },
  { key: "accessDisabled", label: "Resident access disabled" }
];

const INSPECTION_COMING_SOON =
  "Unit inspections product is coming in a future update — record condition notes outside this checklist for now.";

type MoveOutContext = {
  tenant: TenantListItem;
  lease: { id: string; leaseNumber: string; status: string } | null;
  balance: number;
};

export function MoveOutWizard({ tenants }: { tenants: TenantListItem[] }) {
  const { notify } = useToast();
  const [step, setStep] = useState(0);
  const [tenantId, setTenantId] = useState("");
  const [context, setContext] = useState<MoveOutContext | null>(null);
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [forwardingAddress, setForwardingAddress] = useState("");
  const [depositDisposition, setDepositDisposition] = useState<
    "refund" | "partial_refund" | "withheld" | "pending"
  >("pending");
  const [finalChargesAmount, setFinalChargesAmount] = useState("");
  const [finalChargesNote, setFinalChargesNote] = useState("");
  const [checklist, setChecklist] = useState<MoveOutChecklist>(emptyMoveOutChecklist());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archivedUnitId, setArchivedUnitId] = useState<string | null>(null);

  const activeTenants = useMemo(
    () =>
      tenants.filter(
        (tenant) =>
          tenant.lifecycleStatus !== "former" &&
          tenant.status !== "archived" &&
          Boolean(tenant.unitId || tenant.propertyId)
      ),
    [tenants]
  );

  async function loadContext(nextTenantId: string) {
    setTenantId(nextTenantId);
    if (!nextTenantId) {
      setContext(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/resident-lifecycle/move-out?tenantId=${encodeURIComponent(nextTenantId)}`,
        { cache: "no-store" }
      );
      const json = (await response.json()) as { context?: MoveOutContext };
      if (!response.ok) throw new Error(readApiError(json, "Could not load resident"));
      setContext(json.context ?? null);
      setArchivedUnitId(json.context?.tenant.unitId ?? null);
      if (json.context?.tenant.moveOutDate) setMoveOutDate(json.context.tenant.moveOutDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load resident");
    } finally {
      setLoading(false);
    }
  }

  function toggleChecklist(key: keyof MoveOutChecklist) {
    setChecklist((current) => ({ ...current, [key]: !current[key] }));
  }

  async function complete() {
    if (!tenantId) return;
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/resident-lifecycle/move-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          leaseId: context?.lease?.id ?? null,
          moveOutDate,
          reason: reason || null,
          forwardingAddress: forwardingAddress || null,
          depositDisposition,
          finalChargesAmount: finalChargesAmount ? Number(finalChargesAmount) : null,
          finalChargesNote: finalChargesNote || null,
          checklist
        })
      });
      const json = (await response.json()) as { result?: { checklist: MoveOutChecklist } };
      if (!response.ok) throw new Error(readApiError(json, "Move-out failed"));
      if (json.result?.checklist) setChecklist(json.result.checklist);
      setDone(true);
      notify({
        title: "Move-out complete",
        description: "Lease closed, unit vacated, portal access disabled.",
        variant: "success"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Move-out failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Move-out complete
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Lease closed, unit vacated, portal access disabled, conversations/documents archived. Historical records
          preserved.
        </p>
        <ChecklistPanel checklist={checklist} />
        <div className="flex flex-wrap gap-2">
          {tenantId ? (
            <Link href={`/tenants/${tenantId}`}>
              <Button>View resident</Button>
            </Link>
          ) : (
            <Link href="/tenants">
              <Button>Tenants</Button>
            </Link>
          )}
          {archivedUnitId ? (
            <Link href={`/units/${archivedUnitId}`}>
              <Button variant="secondary">Review unit</Button>
            </Link>
          ) : null}
          <Link href="/dashboard">
            <Button variant="secondary">Operations Center</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Resident move-out
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Guided close-out with automatic occupancy, lease, and portal updates.
        </p>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Move-out steps">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 text-xs ${
              index === step
                ? "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)]"
                : index < step
                  ? "bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-primary)]"
                  : "border border-[var(--mpa-color-border)] text-[var(--mpa-color-text-secondary)]"
            }`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}

      {step === 0 ? (
        <div className="space-y-4">
          <Field label="Resident">
            <Select
              aria-label="Resident"
              value={tenantId}
              onChange={(event) => void loadContext(event.target.value)}
            >
              <option value="">Select resident…</option>
              {activeTenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.firstName} {tenant.lastName}
                  {tenant.propertyName ? ` · ${tenant.propertyName}` : ""}
                  {tenant.unitNumber ? ` · Unit ${tenant.unitNumber}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          {context ? (
            <div className="space-y-1 rounded-lg border border-[var(--mpa-color-border)] p-3 text-sm">
              <p>
                Property: {context.tenant.propertyName ?? "—"} · Unit: {context.tenant.unitNumber ?? "—"}
              </p>
              <p>Lease: {context.lease ? `${context.lease.leaseNumber} (${context.lease.status})` : "None"}</p>
              <p>Balance: {formatCurrencySafe(context.balance)}</p>
              <p>Move-out date: {moveOutDate}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Move-out date">
            <Input
              aria-label="Move-out date"
              type="date"
              value={moveOutDate}
              onChange={(event) => setMoveOutDate(event.target.value)}
            />
          </Field>
          <Field label="Deposit disposition">
            <Select
              aria-label="Deposit disposition"
              value={depositDisposition}
              onChange={(event) =>
                setDepositDisposition(event.target.value as typeof depositDisposition)
              }
            >
              <option value="pending">Pending</option>
              <option value="refund">Full refund</option>
              <option value="partial_refund">Partial refund</option>
              <option value="withheld">Withheld</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Reason">
              <Input aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Forwarding address">
              <Textarea
                aria-label="Forwarding address"
                value={forwardingAddress}
                onChange={(event) => setForwardingAddress(event.target.value)}
              />
            </Field>
          </div>
          <Field label="Final charges amount">
            <Input
              aria-label="Final charges amount"
              type="number"
              value={finalChargesAmount}
              onChange={(event) => setFinalChargesAmount(event.target.value)}
            />
          </Field>
          <Field label="Final charges note">
            <Input
              aria-label="Final charges note"
              value={finalChargesNote}
              onChange={(event) => setFinalChargesNote(event.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="rounded-md border border-dashed border-[var(--mpa-color-border)] bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2 text-xs text-[var(--mpa-color-text-secondary)]">
            {INSPECTION_COMING_SOON}
          </p>
          <ul className="space-y-2">
            {CHECKLIST_LABELS.map((item) => (
              <li key={item.key}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--mpa-color-border)] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={() => toggleChecklist(item.key)}
                  />
                  <span>{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3 text-sm text-[var(--mpa-color-text-secondary)]">
          <p>
            Completing move-out will close the lease, vacate the unit, disable portal access, archive conversations and
            documents, and preserve audit history.
          </p>
          <ChecklistPanel checklist={checklist} />
        </div>
      ) : null}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="secondary" disabled={step === 0 || loading} onClick={() => setStep((current) => current - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            disabled={loading || (step === 0 && !tenantId)}
            onClick={() => setStep((current) => Math.min(current + 1, STEPS.length - 1))}
          >
            Continue
          </Button>
        ) : (
          <Button disabled={loading} onClick={() => setConfirmOpen(true)}>
            {loading ? "Completing…" : "Complete move-out"}
          </Button>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Complete move-out?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button disabled={loading} onClick={() => void complete()}>
              {loading ? "Completing…" : "Yes, close lease"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          This closes the lease, vacates the unit, and disables resident portal access. Historical records stay
          preserved.
        </p>
      </Modal>
    </Card>
  );
}

function ChecklistPanel({ checklist }: { checklist: MoveOutChecklist }) {
  return (
    <ul className="space-y-2">
      {CHECKLIST_LABELS.map((item) => {
        const done = checklist[item.key];
        return (
          <li
            key={item.key}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              done
                ? "border-[var(--mpa-color-border)]"
                : "border-[var(--mpa-color-danger)]/40 bg-[var(--mpa-color-danger)]/5"
            }`}
          >
            <span aria-hidden>{done ? "☑" : "☐"}</span>
            <span>{item.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

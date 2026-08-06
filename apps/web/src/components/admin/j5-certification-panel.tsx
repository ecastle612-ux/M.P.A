"use client";

import { useState } from "react";
import { Badge, Button, Input } from "@mpa/ui";

type J5Report = {
  organizationId: string;
  checks: Record<string, boolean>;
  assistantRecommendation: string;
  stripeConfigured: boolean;
  stripeNote?: string;
  propertyMoneyDetail?: string;
  ownerSummaryDetail?: string;
  counts?: Record<string, number>;
  payments: Array<{
    id: string;
    status: string;
    method: string;
    amount: number;
    paid_at: string | null;
  }>;
  receipts: Array<{ id: string; receipt_number: string; amount: number }>;
  timelineEvents: Array<{ id: string; event_type: string; created_at: string }>;
  auditEvents: Array<{ id: string; action: string; created_at: string }>;
};

export function J5CertificationPanel() {
  const [organizationId, setOrganizationId] = useState("");
  const [report, setReport] = useState<J5Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(
        `/api/admin/launch/j5?organizationId=${encodeURIComponent(organizationId.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load J5 evidence");
      }
      setReport(payload as J5Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load J5 evidence");
    } finally {
      setLoading(false);
    }
  }

  const corePass =
    report &&
    report.checks["chargeCreated"] &&
    report.checks["paymentSucceeded"] &&
    report.checks["receiptGenerated"] &&
    report.checks["timelineEvent"] &&
    report.checks["auditEvent"] &&
    report.checks["propertyFinancialUpdate"] &&
    report.checks["ownerSummaryUpdate"] &&
    report.checks["rentReady"] &&
    report.assistantRecommendation === "Submit your first maintenance request.";

  return (
    <section className="max-w-3xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          LAUNCH-001 · J5 certification
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Verify charge creation, Stripe and/or manual payment, receipts, resident ledger effects,
          property financial snapshot, owner summary, timeline, audit, and Mission Control → Submit
          your first maintenance request.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[240px] flex-1 space-y-1 text-sm">
          <span className="text-[var(--mpa-color-text-secondary)]">Organization id</span>
          <Input
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            placeholder="uuid"
          />
        </label>
        <Button type="button" disabled={loading || organizationId.trim().length < 32} onClick={() => void load()}>
          {loading ? "Loading…" : "Load J5 evidence"}
        </Button>
      </div>
      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {report ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={corePass ? "success" : "danger"}>
              {corePass ? "J5 evidence Pass" : "J5 evidence incomplete"}
            </Badge>
            <Badge variant={report.stripeConfigured ? "success" : "warning"}>
              Stripe {report.stripeConfigured ? "configured" : "not configured"}
            </Badge>
            <span className="text-[var(--mpa-color-text-secondary)]">
              Assistant: {report.assistantRecommendation}
            </span>
          </div>
          {report.stripeNote ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{report.stripeNote}</p>
          ) : null}
          {report.propertyMoneyDetail ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Property money: {report.propertyMoneyDetail}
            </p>
          ) : null}
          {report.ownerSummaryDetail ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Owner summary: {report.ownerSummaryDetail}
            </p>
          ) : null}
          <ul className="space-y-1">
            {Object.entries(report.checks).map(([key, value]) => (
              <li key={key} className="flex justify-between gap-3 border-b border-[var(--mpa-color-border-default)] py-1">
                <span>{key}</span>
                <Badge variant={value ? "success" : "danger"}>{value ? "yes" : "no"}</Badge>
              </li>
            ))}
          </ul>
          <div>
            <h3 className="font-medium">Payments / receipts</h3>
            <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
              {report.payments.map((payment) => (
                <li key={payment.id}>
                  {payment.id} · {payment.status} · {payment.method} · {payment.amount}
                </li>
              ))}
              {report.receipts.map((receipt) => (
                <li key={receipt.id}>
                  receipt {receipt.receipt_number} · {receipt.amount}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium">Timeline / audit</h3>
            <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
              {report.timelineEvents.map((event) => (
                <li key={event.id}>
                  {event.event_type} · {event.created_at}
                </li>
              ))}
              {report.auditEvents.map((event) => (
                <li key={`a-${event.id}`}>
                  audit {event.action} · {event.created_at}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

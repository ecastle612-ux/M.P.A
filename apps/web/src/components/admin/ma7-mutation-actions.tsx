"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@mpa/ui";

type ResultState = {
  ok: boolean;
  code?: string;
  message?: string;
  correlationId?: string;
} | null;

function ConfirmPanel({
  title,
  impact,
  confirmToken,
  confirmLabel,
  phraseLabel,
  expectedPhrase,
  disabled,
  onSubmit
}: {
  title: string;
  impact: string;
  confirmToken: string;
  confirmLabel: string;
  phraseLabel?: string;
  expectedPhrase?: string;
  disabled?: boolean;
  onSubmit: (input: { reason: string; confirmationToken: string; confirmationPhrase?: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [token, setToken] = useState("");
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
        {title}
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        CHANGE — confirmation required
      </p>
      <p className="text-sm text-[var(--mpa-color-text-primary)]">{impact}</p>
      <label className="block text-xs font-semibold text-[var(--mpa-color-text-secondary)]">
        Reason (required)
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-1.5 text-sm"
          placeholder="Why is this change authorized?"
        />
      </label>
      <label className="block text-xs font-semibold text-[var(--mpa-color-text-secondary)]">
        Type {confirmToken} to confirm
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-1.5 font-mono text-sm"
        />
      </label>
      {phraseLabel && expectedPhrase ? (
        <label className="block text-xs font-semibold text-[var(--mpa-color-text-secondary)]">
          {phraseLabel}
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-1.5 font-mono text-sm"
          />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void onSubmit({
              reason,
              confirmationToken: token,
              ...(expectedPhrase ? { confirmationPhrase: phrase } : {})
            }).finally(() => setBusy(false));
          }}
        >
          {confirmLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setReason("");
            setToken("");
            setPhrase("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function Ma7MembershipActions({
  membershipId,
  organizationId,
  status,
  roles
}: {
  membershipId: string;
  organizationId: string;
  status: string;
  roles: string[];
}) {
  const router = useRouter();
  const [result, setResult] = useState<ResultState>(null);

  async function run(nextStatus: "active" | "inactive", payload: { reason: string; confirmationToken: string }) {
    setResult(null);
    const response = await fetch("/api/admin/mutations/memberships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        membershipId,
        organizationId,
        status: nextStatus,
        reason: payload.reason,
        confirm: true,
        confirmationToken: payload.confirmationToken
      })
    });
    const body = (await response.json()) as ResultState & { error?: string };
    setResult({
      ok: Boolean(body?.ok),
      code: body?.code ?? body?.error,
      message: body?.message,
      correlationId: body?.correlationId
    });
    if (body?.ok) router.refresh();
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[11px] text-[var(--mpa-color-text-secondary)]">
        VIEW → CHANGE · roles {roles.join(", ") || "none"} · status {status}
      </p>
      {status === "active" ? (
        <ConfirmPanel
          title="Deactivate membership"
          impact="Member loses organization access immediately. Last-admin protection is enforced server-side."
          confirmToken="DEACTIVATE"
          confirmLabel="Confirm deactivate"
          onSubmit={(p) => run("inactive", p)}
        />
      ) : (
        <ConfirmPanel
          title="Reactivate membership"
          impact="Member regains organization access at their existing roles. Role editing is not available here."
          confirmToken="REACTIVATE"
          confirmLabel="Confirm reactivate"
          onSubmit={(p) => run("active", p)}
        />
      )}
      {result ? (
        <p className={`text-xs ${result.ok ? "text-[var(--mpa-color-text-secondary)]" : "text-[#C0392B]"}`}>
          {result.ok ? "Success" : "Failed"} · {result.code}
          {result.message ? ` · ${result.message}` : ""}
          {result.correlationId ? ` · ${result.correlationId}` : ""}
        </p>
      ) : null}
    </div>
  );
}

export function Ma7SubscriptionActions({
  organizationId,
  organizationName,
  status,
  cancelAtPeriodEnd,
  currentPeriodEnd
}: {
  organizationId: string;
  organizationName: string;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}) {
  const router = useRouter();
  const [result, setResult] = useState<ResultState>(null);

  async function run(action: "cancel" | "reactivate", payload: { reason: string; confirmationToken: string }) {
    setResult(null);
    const response = await fetch("/api/admin/mutations/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        action,
        reason: payload.reason,
        confirm: true,
        confirmationToken: payload.confirmationToken
      })
    });
    const body = (await response.json()) as ResultState & { error?: string };
    setResult({
      ok: Boolean(body?.ok),
      code: body?.code ?? body?.error,
      message: body?.message,
      correlationId: body?.correlationId
    });
    if (body?.ok) router.refresh();
  }

  return (
    <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <h2 className="font-display text-lg font-semibold">Governed lifecycle (MA-7)</h2>
      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
        Calls authoritative cancelAtPeriodEnd / reactivateSubscription. Does not rewrite Stripe Prices or
        invent a second lifecycle store. After success, this page reloads durable state.
      </p>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Organization</dt>
          <dd>{organizationName}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Current status</dt>
          <dd className="font-mono text-xs">{status ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Cancel at period end</dt>
          <dd>{cancelAtPeriodEnd ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--mpa-color-text-secondary)]">Period end</dt>
          <dd>{currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleString() : "—"}</dd>
        </div>
      </dl>
      {!cancelAtPeriodEnd && status !== "canceled" && status !== "expired" ? (
        <ConfirmPanel
          title="Cancel at period end"
          impact="Schedules cancellation at the current period end via the durable lifecycle service. Access continues until period end."
          confirmToken="CANCEL"
          confirmLabel="Confirm cancel"
          onSubmit={(p) => run("cancel", p)}
        />
      ) : null}
      {cancelAtPeriodEnd || status === "past_due" || status === "unpaid" ? (
        <ConfirmPanel
          title="Reactivate subscription"
          impact="Clears cancel-at-period-end / restores active access through the durable lifecycle service (existing Stripe sync path)."
          confirmToken="REACTIVATE"
          confirmLabel="Confirm reactivate"
          onSubmit={(p) => run("reactivate", p)}
        />
      ) : null}
      {result ? (
        <p className={`text-xs ${result.ok ? "text-[var(--mpa-color-text-secondary)]" : "text-[#C0392B]"}`}>
          {result.ok ? "Success" : "Failed"} · {result.code}
          {result.message ? ` · ${result.message}` : ""}
          {result.correlationId ? ` · ${result.correlationId}` : ""}
        </p>
      ) : null}
    </section>
  );
}

export function Ma7OrgLifecycleBlocked({ organizationName }: { organizationName: string }) {
  return (
    <section className="rounded-md border border-l-4 border-l-[#C0392B] border-[var(--mpa-color-border-default)] bg-white p-4">
      <h2 className="font-display text-lg font-semibold">Organization suspend / reactivate</h2>
      <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
        BLOCKED for {organizationName}. The organizations table has no lifecycle status field, and Product
        Owner has not approved suspend side effects (login block / entitlement freeze / Stripe). No
        incompatible semantics were invented.
      </p>
    </section>
  );
}

export function Ma7CapacityMutationBlocked() {
  return (
    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
      Capacity mutation remains read-only; no governed administrative mutation exists. MA-4 remains
      authoritative for commercial capacity.
    </p>
  );
}

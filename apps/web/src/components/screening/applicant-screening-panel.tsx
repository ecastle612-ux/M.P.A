"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input, Textarea } from "@mpa/ui";

type ScreeningDetail = {
  case: {
    id: string;
    caseNumber: string;
    status: string;
    provider: string;
    packageCode: string;
    resultSummary: string | null;
    decision: string | null;
    expiresAt: string | null;
    leaseId: string | null;
  };
  parties: Array<{
    id: string;
    role: string;
    fullName: string;
    email: string | null;
    status: string;
    consentUrl: string | null;
  }>;
  components: Array<{
    id: string;
    componentType: string;
    status: string;
    flags: Array<{ code: string; severity: string; message: string }>;
    summary: string | null;
  }>;
  progress: Array<{ key: string; label: string; status: string }>;
  conditions: Array<{ id: string; description: string; status: string }>;
  adverseActions: Array<{ id: string; stage: string; status: string; wait_until: string | null }>;
  canDecide: boolean;
  canReadFull: boolean;
};

type Props = {
  applicantId: string;
  canCreate: boolean;
  canDecide: boolean;
};

export function ApplicantScreeningPanel({ applicantId, canCreate, canDecide }: Props) {
  const [items, setItems] = useState<Array<{ id: string; caseNumber: string; status: string }>>([]);
  const [detail, setDetail] = useState<ScreeningDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [conditionText, setConditionText] = useState("");
  const [partyName, setPartyName] = useState("");
  const [partyRole, setPartyRole] = useState("guarantor");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const listRes = await fetch(`/api/screening?applicantId=${applicantId}`, { cache: "no-store" });
      const listJson = (await listRes.json()) as {
        items?: Array<{ id: string; caseNumber: string; status: string }>;
        error?: { message?: string };
      };
      if (!listRes.ok) throw new Error(listJson.error?.message ?? "Failed to load screenings");
      const nextItems = listJson.items ?? [];
      setItems(nextItems);
      const active = nextItems[0];
      if (active) {
        const detailRes = await fetch(`/api/screening/${active.id}`, { cache: "no-store" });
        const detailJson = (await detailRes.json()) as ScreeningDetail & { error?: { message?: string } };
        if (!detailRes.ok) throw new Error(detailJson.error?.message ?? "Failed to load case");
        setDetail(detailJson);
      } else {
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load screening");
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function startScreening() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Could not start screening");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Start failed");
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: "approve" | "reject" | "conditional") {
    if (!detail) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/screening/${detail.case.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decide",
          decision,
          notes,
          reasonCodes: decision === "reject" ? ["credit_or_background"] : [],
          conditions:
            decision === "conditional" && conditionText.trim()
              ? [{ conditionType: "custom", description: conditionText.trim() }]
              : []
        })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Decision failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision failed");
    } finally {
      setBusy(false);
    }
  }

  async function completeAdverse() {
    if (!detail) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/screening/${detail.case.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_adverse_action" })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Adverse action failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adverse action failed");
    } finally {
      setBusy(false);
    }
  }

  async function addParty() {
    if (!detail || !partyName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/screening/${detail.case.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_party", role: partyRole, fullName: partyName.trim() })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? "Add party failed");
      setPartyName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add party failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Card className="space-y-2">
        <h3 className="text-base font-semibold">Background screening</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading…</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Background screening</h3>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Consent-gated screening via ScreeningService. Human decision required.
          </p>
        </div>
        {canCreate && items.length === 0 ? (
          <Button onClick={() => void startScreening()} disabled={busy}>
            Start screening
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}

      {!detail ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No screening cases yet.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{detail.case.caseNumber}</Badge>
            <Badge>{detail.case.status}</Badge>
            <Badge>{detail.case.provider}</Badge>
            {detail.case.decision ? <Badge>{detail.case.decision}</Badge> : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {detail.progress.map((step) => (
              <div key={step.key} className="rounded-md border border-[var(--mpa-color-border)] p-2 text-sm">
                <div className="font-medium">{step.label}</div>
                <div className="text-[var(--mpa-color-text-secondary)]">{step.status}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Parties</h4>
            <ul className="space-y-2 text-sm">
              {detail.parties.map((party) => (
                <li key={party.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--mpa-color-border)] p-2">
                  <span>
                    {party.fullName} · {party.role} · {party.status}
                  </span>
                  {party.consentUrl ? (
                    <Link className="text-[var(--mpa-color-brand)] underline" href={party.consentUrl}>
                      Consent link
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
            {canCreate && detail.case.status === "awaiting_consent" ? (
              <div className="flex flex-wrap gap-2">
                <Input
                  value={partyName}
                  onChange={(event) => setPartyName(event.target.value)}
                  placeholder="Guarantor / co-applicant name"
                />
                <select
                  className="rounded-md border border-[var(--mpa-color-border)] bg-transparent px-2 text-sm"
                  value={partyRole}
                  onChange={(event) => setPartyRole(event.target.value)}
                >
                  <option value="guarantor">Guarantor</option>
                  <option value="co_applicant">Co-applicant</option>
                  <option value="co_signer">Co-signer</option>
                  <option value="adult_occupant">Adult occupant</option>
                </select>
                <Button variant="secondary" onClick={() => void addParty()} disabled={busy}>
                  Add party
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Structured results</h4>
            <ul className="space-y-2 text-sm">
              {detail.components.map((component) => (
                <li key={component.id} className="rounded-md border border-[var(--mpa-color-border)] p-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{component.componentType}</Badge>
                    <Badge>{component.status}</Badge>
                  </div>
                  <p className="mt-1 text-[var(--mpa-color-text-secondary)]">{component.summary ?? "—"}</p>
                  {component.flags.length > 0 ? (
                    <p className="mt-1 text-[var(--mpa-color-warning)]">
                      Flags: {component.flags.map((flag) => flag.message).join("; ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {detail.case.resultSummary ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{detail.case.resultSummary}</p>
            ) : null}
          </div>

          {canDecide && ["ready_for_review", "in_review"].includes(detail.case.status) ? (
            <div className="space-y-3 rounded-md border border-[var(--mpa-color-border)] p-3">
              <h4 className="text-sm font-semibold">Property manager decision</h4>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Decision notes (audited)" />
              <Input
                value={conditionText}
                onChange={(event) => setConditionText(event.target.value)}
                placeholder="Conditional approval requirement (optional)"
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void decide("approve")} disabled={busy}>
                  Approve
                </Button>
                <Button variant="secondary" onClick={() => void decide("conditional")} disabled={busy}>
                  Conditional
                </Button>
                <Button variant="secondary" onClick={() => void decide("reject")} disabled={busy}>
                  Reject
                </Button>
              </div>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                AI never approves or rejects. Human decision is mandatory.
              </p>
            </div>
          ) : null}

          {detail.case.status === "adverse_action_pending" && canDecide ? (
            <div className="space-y-2">
              <p className="text-sm">Adverse action in progress. Complete final notice after waiting period.</p>
              <Button onClick={() => void completeAdverse()} disabled={busy}>
                Complete final adverse action
              </Button>
            </div>
          ) : null}

          {["approved", "conditionally_approved"].includes(detail.case.status) ? (
            <div className="rounded-md border border-[var(--mpa-color-border)] p-3 text-sm">
              <p className="font-medium">Continue to Move In</p>
              <p className="text-[var(--mpa-color-text-secondary)]">
                Screening is ready. Guided Move in is the recommended path for lease, signature, and activation.
              </p>
              <Link href={`/residents/move-in?applicantId=${encodeURIComponent(applicantId)}`}>
                <Button className="mt-2">Continue to Move In</Button>
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}

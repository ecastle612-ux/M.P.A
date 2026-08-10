"use client";

import { useState } from "react";
import { Button } from "@mpa/ui";
import { StatusBadge } from "./ops-directory-table";

type Invitation = { id: string; email: string; status: string; roles: string[]; createdAt: string };
type Provisioning = { id: string; status: string; updatedAt: string };

export function SupportOrgActions({
  organizationId,
  invitations,
  provisioning
}: {
  organizationId: string;
  invitations: Invitation[];
  provisioning: Provisioning[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function resendInvitation(invitationId: string) {
    setBusy(invitationId);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/support/resend-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, organizationId })
      });
      const body = (await response.json()) as { error?: string; notice?: string };
      if (!response.ok) throw new Error(body.error ?? "Failed");
      setMessage(body.notice ?? "Invitation resend recorded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function retryProvisioning(sessionId: string) {
    setBusy(sessionId);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/commerce/provisioning/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Retry failed");
      setMessage("Provisioning retry requested.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Retry failed");
    } finally {
      setBusy(null);
    }
  }

  async function regenerateClaim(sessionId: string) {
    setBusy(`claim-${sessionId}`);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/support/regenerate-claim-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, organizationId })
      });
      const body = (await response.json()) as { error?: string; notice?: string };
      if (!response.ok) throw new Error(body.error ?? "Failed");
      setMessage(body.notice ?? "Claim link regenerated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-base font-semibold">Invitations</h2>
        {message ? <p className="mt-2 text-xs text-[var(--mpa-color-text-secondary)]">{message}</p> : null}
        <ul className="mt-3 space-y-3">
          {invitations.length === 0 ? (
            <li className="text-sm text-[var(--mpa-color-text-secondary)]">No invitations.</li>
          ) : (
            invitations.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0">
                <div>
                  <p className="text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {inv.roles.join(", ") || "—"} · <StatusBadge value={inv.status} />
                  </p>
                </div>
                {inv.status === "pending" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy === inv.id}
                    onClick={() => void resendInvitation(inv.id)}
                  >
                    Resend
                  </Button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </article>
      <article className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-display text-base font-semibold">Provisioning jobs</h2>
        <ul className="mt-3 space-y-3">
          {provisioning.length === 0 ? (
            <li className="text-sm text-[var(--mpa-color-text-secondary)]">No provisioning jobs.</li>
          ) : (
            provisioning.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--mpa-color-border-subtle)] pt-2 first:border-0 first:pt-0">
                <div>
                  <p className="font-mono text-xs">{job.id.slice(0, 8)}…</p>
                  <StatusBadge value={job.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.status !== "ready" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy === `claim-${job.id}`}
                      onClick={() => void regenerateClaim(job.id)}
                    >
                      Regenerate claim
                    </Button>
                  ) : null}
                  {["failed_retryable", "failed_dead", "compensating"].includes(job.status) ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy === job.id}
                      onClick={() => void retryProvisioning(job.id)}
                    >
                      Retry
                    </Button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}

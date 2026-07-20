"use client";

import { useState } from "react";
import { Button, Card } from "@mpa/ui";

type ActionState = {
  busy: "seed" | "reset" | null;
  message: string | null;
  error: string | null;
};

export function TestingUtilitiesPanel() {
  const [state, setState] = useState<ActionState>({
    busy: null,
    message: null,
    error: null
  });

  async function runAction(action: "seed" | "reset") {
    setState({ busy: action, message: null, error: null });
    try {
      const response = await fetch(`/api/master-admin/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setState({
          busy: null,
          message: null,
          error: payload.error ?? `Request failed (${response.status}).`
        });
        return;
      }
      setState({
        busy: null,
        message: payload.message ?? "Done.",
        error: null
      });
    } catch {
      setState({
        busy: null,
        message: null,
        error: "Network error. Retry."
      });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Testing utilities
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Seed or reset demo portfolio data for the active organization. Requires{" "}
          <code className="text-xs">master_admin</code>.
        </p>
      </div>

      <Card className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={state.busy !== null}
          onClick={() => void runAction("seed")}
        >
          {state.busy === "seed" ? "Seeding…" : "Seed demo portfolio"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={state.busy !== null}
          onClick={() => void runAction("reset")}
        >
          {state.busy === "reset" ? "Resetting…" : "Reset demo portfolio"}
        </Button>
      </Card>

      {state.message ? (
        <p className="text-sm text-[var(--mpa-color-feedback-success,#15803d)]">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm text-[var(--mpa-color-feedback-danger,#b91c1c)]">{state.error}</p>
      ) : null}
    </div>
  );
}

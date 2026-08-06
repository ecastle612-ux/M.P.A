"use client";

import { useCallback, useEffect, useState } from "react";
import {
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Select, Skeleton, Textarea } from "@mpa/ui";

type Entry = {
  workOrder: {
    id: string;
    title: string;
    description: string;
    status: WorkOrderStatus;
    priority: WorkOrderPriority;
    category: string;
    submitted_at: string;
  };
  updates: Array<{ id: string; body: string; actor_role: string; created_at: string }>;
};

export function ResidentMaintenancePortal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<WorkOrderPriority>("normal");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/portal/tenant/maintenance");
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load maintenance");
    }
    setEntries(body.workOrders ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Maintenance
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Report an issue, track progress, and confirm when it&apos;s fixed.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-[#C0392B] bg-[#FCE8E6] px-3 py-2 text-sm text-[#C0392B]">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {notice}
        </p>
      ) : null}

      <form
        className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            setBusy(true);
            setError(null);
            try {
              const response = await fetch("/api/portal/tenant/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, category, priority })
              });
              const body = await response.json();
              if (!response.ok) {
                throw new Error(body.error ?? "Submit failed");
              }
              setTitle("");
              setDescription("");
              setPriority("normal");
              setNotice("Request submitted. Your property manager can see it now.");
              await refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Submit failed");
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        <h3 className="text-sm font-semibold">Submit a request</h3>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What’s wrong?"
          required
          minLength={3}
        />
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add a few details so the team can help"
          required
          minLength={3}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="general">General</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC</option>
            <option value="appliance">Appliance</option>
            <option value="structural">Structural</option>
            <option value="other">Other</option>
          </Select>
          <Select
            value={priority}
            onChange={(event) => setPriority(event.target.value as WorkOrderPriority)}
          >
            {Object.entries(WORK_ORDER_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={busy}>
          Submit request
        </Button>
      </form>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Your requests</h3>
        {entries.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="Submit your first maintenance request above."
          />
        ) : (
          entries.map(({ workOrder, updates }) => (
            <article
              key={workOrder.id}
              className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-[var(--mpa-color-text-primary)]">
                    {workOrder.title}
                  </h4>
                  <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                    {workOrder.description}
                  </p>
                </div>
                <Badge
                  variant={
                    workOrder.status === "closed"
                      ? "success"
                      : workOrder.priority === "emergency"
                        ? "danger"
                        : "info"
                  }
                >
                  {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                </Badge>
              </div>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                Priority {WORK_ORDER_PRIORITY_LABELS[workOrder.priority]}
              </p>
              <ul className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {updates.map((update) => (
                  <li key={update.id}>
                    <span className="font-medium text-[var(--mpa-color-text-primary)]">
                      {update.actor_role}:
                    </span>{" "}
                    {update.body}
                  </li>
                ))}
              </ul>
              {workOrder.status === "completed" ? (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      setBusy(true);
                      setError(null);
                      try {
                        const response = await fetch("/api/portal/tenant/maintenance", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "confirm",
                            workOrderId: workOrder.id,
                            note: "Confirmed — issue is resolved."
                          })
                        });
                        const body = await response.json();
                        if (!response.ok) {
                          throw new Error(body.error ?? "Confirm failed");
                        }
                        setNotice("Thanks — your request is closed.");
                        await refresh();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Confirm failed");
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                >
                  Confirm resolution
                </Button>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

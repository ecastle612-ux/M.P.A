"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  WORK_ORDER_CATEGORY_LABELS,
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderCategory,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";
import { Alert, Badge, Button, Input, Textarea } from "@mpa/ui";
import Link from "next/link";
import { FoPageChrome } from "../shell/fo-workspace";
import { MediaAttachmentField } from "../media/media-attachment-field";

type WorkOrder = {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  category: WorkOrderCategory;
  due_at: string | null;
  facility_asset_label: string | null;
  facility_asset_id: string | null;
  facility_asset_code?: string | null;
  facility_assets?: { id: string; name: string; asset_code: string } | null;
  floor_label?: string | null;
  department_label?: string | null;
  room_label?: string | null;
  request_number?: string | null;
  intake_channel?: string | null;
  require_completion_photo?: boolean;
  property_properties?: { id: string; name: string } | null;
};

type ChecklistItem = {
  id: string;
  item_key: string;
  sort_order: number;
  item_type: "checkbox" | "text" | "number" | "yes_no" | "photo";
  label: string;
  required: boolean;
  value_boolean: boolean | null;
  value_text: string | null;
  value_number: number | null;
  value_yes_no: boolean | null;
  media_attachment_id: string | null;
};

type Submission = {
  source: string;
  requester_name: string | null;
  values_snapshot: unknown;
} | null;

type Tab = "today" | "overdue" | "upcoming";

export function FacilityMyWorkPage() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("workOrderId");

  const [tab, setTab] = useState<Tab>("today");
  const [today, setToday] = useState<WorkOrder[]>([]);
  const [overdue, setOverdue] = useState<WorkOrder[]>([]);
  const [upcoming, setUpcoming] = useState<WorkOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(deepLinkId);
  const [detail, setDetail] = useState<WorkOrder | null>(null);
  const [submission, setSubmission] = useState<Submission>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingMediaIds, setPendingMediaIds] = useState<string[]>([]);

  const list = useMemo(() => {
    if (tab === "overdue") return overdue;
    if (tab === "upcoming") return upcoming;
    return today;
  }, [tab, today, overdue, upcoming]);

  const refreshList = useCallback(async () => {
    const response = await fetch("/api/facility/my-work");
    const body = (await response.json()) as {
      today?: WorkOrder[];
      overdue?: WorkOrder[];
      upcoming?: WorkOrder[];
      error?: string;
    };
    if (!response.ok) throw new Error(body.error ?? "Could not load My Work.");
    setToday(body.today ?? []);
    setOverdue(body.overdue ?? []);
    setUpcoming(body.upcoming ?? []);
  }, []);

  const loadDetail = useCallback(async (workOrderId: string) => {
    const [woRes, checkRes] = await Promise.all([
      fetch(`/api/facility/operations/${workOrderId}`),
      fetch(`/api/facility/checklist?workOrderId=${workOrderId}`)
    ]);
    const woBody = (await woRes.json()) as {
      workOrder?: WorkOrder;
      submission?: Submission;
      error?: string;
    };
    const checkBody = (await checkRes.json()) as {
      items?: ChecklistItem[];
      requireCompletionPhoto?: boolean;
      error?: string;
    };
    if (!woRes.ok) throw new Error(woBody.error ?? "Could not load work order.");
    if (!checkRes.ok) throw new Error(checkBody.error ?? "Could not load checklist.");
    setDetail(woBody.workOrder ?? null);
    setSubmission(woBody.submission ?? null);
    setItems(checkBody.items ?? []);
    setRequirePhoto(Boolean(checkBody.requireCompletionPhoto));
    setPendingMediaIds([]);
    setNote("");
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Initial My Work fetch — async setState in then/catch (data sync).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch
    void refreshList()
      .then(() => {
        if (cancelled) return;
        if (deepLinkId) setSelectedId(deepLinkId);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshList, deepLinkId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detail fetch on selection
    void loadDetail(selectedId).catch((err: unknown) => {
      if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load job.");
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, loadDetail]);

  // Clear detail when returning to the list without sync setState-in-effect.
  const activeDetail = selectedId ? detail : null;

  async function saveChecklist() {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    try {
      const responses = items.map((item) => ({
        itemKey: item.item_key,
        valueBoolean: item.value_boolean ?? undefined,
        valueText: item.value_text ?? undefined,
        valueNumber: item.value_number ?? undefined,
        valueYesNo: item.value_yes_no ?? undefined,
        mediaAttachmentId: item.media_attachment_id
      }));
      const response = await fetch("/api/facility/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId: selectedId, responses })
      });
      const body = (await response.json()) as { items?: ChecklistItem[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not save checklist.");
      setItems(body.items ?? []);
      setNotice("Checklist saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save checklist.");
    } finally {
      setBusy(false);
    }
  }

  async function attachPendingMedia() {
    if (!selectedId || pendingMediaIds.length === 0) return;
    for (const mediaId of pendingMediaIds) {
      const response = await fetch("/api/shared/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId,
          relatedEntityType: "maintenance",
          relatedEntityId: selectedId
        })
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Could not attach evidence.");
      }
    }
    // Link first new media to any required photo checklist items still empty.
    const firstMedia = pendingMediaIds[0];
    if (firstMedia) {
      setItems((prev) =>
        prev.map((item) =>
          item.item_type === "photo" && !item.media_attachment_id
            ? { ...item, media_attachment_id: firstMedia }
            : item
        )
      );
    }
    setPendingMediaIds([]);
  }

  async function progress(action: "start" | "progress" | "complete", executionSignal?: string) {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const mediaForChecklist = pendingMediaIds[0] ?? null;
      await attachPendingMedia();
      const responses = items.map((item) => ({
        itemKey: item.item_key,
        valueBoolean: item.value_boolean ?? undefined,
        valueText: item.value_text ?? undefined,
        valueNumber: item.value_number ?? undefined,
        valueYesNo: item.value_yes_no ?? undefined,
        mediaAttachmentId:
          item.item_type === "photo"
            ? item.media_attachment_id ?? mediaForChecklist
            : item.media_attachment_id
      }));
      if (items.length > 0) {
        const responseSave = await fetch("/api/facility/checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workOrderId: selectedId, responses })
        });
        if (!responseSave.ok) {
          const body = (await responseSave.json()) as { error?: string };
          throw new Error(body.error ?? "Could not save checklist.");
        }
      }
      const response = await fetch("/api/facility/operations/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderId: selectedId,
          action,
          note:
            note.trim() ||
            (action === "start"
              ? "Started work"
              : action === "complete"
                ? "Completed work"
                : executionSignal
                  ? `Signal: ${executionSignal}`
                  : "Progress update"),
          executionSignal
        })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not update work order.");
      setNotice(
        action === "complete"
          ? "Work completed."
          : action === "start"
            ? "Work started."
            : "Update recorded."
      );
      await refreshList();
      if (action === "complete") {
        setSelectedId(null);
      } else {
        await loadDetail(selectedId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  function updateItem(itemKey: string, patch: Partial<ChecklistItem>) {
    setItems((prev) => prev.map((row) => (row.item_key === itemKey ? { ...row, ...patch } : row)));
  }

  const locationLine = activeDetail
    ? [
        activeDetail.property_properties?.name,
        activeDetail.floor_label ? `Floor ${activeDetail.floor_label}` : null,
        activeDetail.department_label,
        activeDetail.room_label ? `Room ${activeDetail.room_label}` : null
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Mission Control" },
        { label: "My Work" }
      ]}
      title="My Work"
      description="What do I need to work on?"
      eyebrow="Facility technician"
    >
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      {!selectedId ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(
              [
                ["today", "Today", today.length],
                ["overdue", "Overdue", overdue.length],
                ["upcoming", "Upcoming", upcoming.length]
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold ${
                  tab === key
                    ? "bg-[var(--mpa-forest)] text-white"
                    : "bg-[var(--mpa-surface-muted)] text-[var(--mpa-ink)]"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <p className="text-sm text-[var(--mpa-muted)]">Nothing assigned in this list.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((wo) => (
                <li key={wo.id}>
                  <button
                    type="button"
                    className="min-h-14 w-full rounded-xl border border-[var(--mpa-border)] bg-white p-4 text-left shadow-sm"
                    onClick={() => setSelectedId(wo.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--mpa-ink)]">{wo.title}</p>
                        <p className="mt-1 text-sm text-[var(--mpa-muted)]">
                          {[wo.property_properties?.name, wo.facility_asset_label, wo.request_number]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <Badge>{WORK_ORDER_STATUS_LABELS[wo.status]}</Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-5 pb-28">
          <button
            type="button"
            className="text-sm font-semibold text-[var(--mpa-forest)]"
            onClick={() => setSelectedId(null)}
          >
            ← Back to My Work
          </button>

          {activeDetail ? (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-[var(--mpa-ink)]">{activeDetail.title}</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge>{WORK_ORDER_STATUS_LABELS[activeDetail.status]}</Badge>
                  <Badge>{WORK_ORDER_PRIORITY_LABELS[activeDetail.priority]}</Badge>
                  <Badge>{WORK_ORDER_CATEGORY_LABELS[activeDetail.category]}</Badge>
                  {activeDetail.request_number ? <Badge>{activeDetail.request_number}</Badge> : null}
                </div>
                {activeDetail.facility_asset_label ? (
                  <div className="rounded-lg bg-[var(--mpa-surface-muted)] p-3">
                    <p className="font-semibold text-[var(--mpa-ink)]">{activeDetail.facility_asset_label}</p>
                    {activeDetail.facility_assets?.asset_code || activeDetail.facility_asset_code ? (
                      <p className="text-sm text-[var(--mpa-ink)]">
                        {activeDetail.facility_assets?.asset_code ?? activeDetail.facility_asset_code}
                      </p>
                    ) : null}
                    {locationLine ? (
                      <p className="mt-1 text-sm text-[var(--mpa-muted)]">{locationLine}</p>
                    ) : null}
                    {activeDetail.facility_asset_id ? (
                      <Link
                        href={`/facility/assets/${activeDetail.facility_asset_id}`}
                        className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--mpa-forest)] underline"
                      >
                        Asset Details
                      </Link>
                    ) : null}
                  </div>
                ) : locationLine ? (
                  <p className="text-sm text-[var(--mpa-muted)]">{locationLine}</p>
                ) : null}
                <p className="whitespace-pre-wrap text-[var(--mpa-ink)]">{activeDetail.description}</p>
                {submission?.requester_name ? (
                  <p className="text-sm text-[var(--mpa-muted)]">
                    Requester: {submission.requester_name}
                    {submission.source ? ` · ${submission.source}` : ""}
                  </p>
                ) : null}
              </div>

              {items.length > 0 ? (
                <section className="space-y-3 rounded-xl border border-[var(--mpa-border)] bg-white p-4">
                  <h3 className="font-semibold">Checklist</h3>
                  {items.map((item) => (
                    <div key={item.item_key} className="space-y-2 border-b border-[var(--mpa-border)] pb-3 last:border-0">
                      <label className="block text-sm font-medium">
                        {item.label}
                        {item.required ? <span className="text-red-600"> *</span> : null}
                      </label>
                      {item.item_type === "checkbox" ? (
                        <label className="flex min-h-11 items-center gap-3 text-sm">
                          <input
                            type="checkbox"
                            className="h-5 w-5"
                            checked={item.value_boolean === true}
                            onChange={(e) =>
                              updateItem(item.item_key, { value_boolean: e.target.checked })
                            }
                          />
                          Done
                        </label>
                      ) : null}
                      {item.item_type === "text" ? (
                        <Textarea
                          value={item.value_text ?? ""}
                          onChange={(e) => updateItem(item.item_key, { value_text: e.target.value })}
                        />
                      ) : null}
                      {item.item_type === "number" ? (
                        <Input
                          type="number"
                          value={item.value_number ?? ""}
                          onChange={(e) =>
                            updateItem(item.item_key, {
                              value_number: e.target.value === "" ? null : Number(e.target.value)
                            })
                          }
                        />
                      ) : null}
                      {item.item_type === "yes_no" ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={item.value_yes_no === true ? "primary" : "secondary"}
                            onClick={() => updateItem(item.item_key, { value_yes_no: true })}
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={item.value_yes_no === false ? "primary" : "secondary"}
                            onClick={() => updateItem(item.item_key, { value_yes_no: false })}
                          >
                            No
                          </Button>
                        </div>
                      ) : null}
                      {item.item_type === "photo" ? (
                        <p className="text-sm text-[var(--mpa-muted)]">
                          {item.media_attachment_id
                            ? "Evidence linked."
                            : "Attach evidence below, then save checklist."}
                        </p>
                      ) : null}
                    </div>
                  ))}
                  <Button type="button" variant="secondary" disabled={busy} onClick={() => void saveChecklist()}>
                    Save checklist
                  </Button>
                </section>
              ) : null}

              <section className="space-y-2 rounded-xl border border-[var(--mpa-border)] bg-white p-4">
                <h3 className="font-semibold">
                  Evidence{requirePhoto ? <span className="text-red-600"> *</span> : null}
                </h3>
                <MediaAttachmentField
                  relatedEntityType="maintenance"
                  relatedEntityId={activeDetail.id}
                  value={pendingMediaIds}
                  onChange={setPendingMediaIds}
                  label="Photos & video"
                />
              </section>

              <section className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
              </section>

              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--mpa-border)] bg-white/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
                <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
                  {activeDetail.status === "assigned" ? (
                    <Button type="button" disabled={busy} onClick={() => void progress("start")}>
                      Start
                    </Button>
                  ) : null}
                  {activeDetail.status === "in_progress" || activeDetail.status === "assigned" ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void progress("progress", "blocked")}
                      >
                        Blocked
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void progress("progress", "need_parts")}
                      >
                        Need parts
                      </Button>
                      <Button type="button" disabled={busy} onClick={() => void progress("complete")}>
                        Complete
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--mpa-muted)]">Loading…</p>
          )}
        </div>
      )}
    </FoPageChrome>
  );
}

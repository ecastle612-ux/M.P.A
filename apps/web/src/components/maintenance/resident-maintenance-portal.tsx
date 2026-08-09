"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderCategory,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";
import { Badge, Button, EmptyState, Skeleton, Textarea } from "@mpa/ui";
import { ResidentPageIntro } from "../shell/resident-workspace";

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

type CategoryChoice = {
  id: string;
  label: string;
  apiCategory: WorkOrderCategory;
};

const CATEGORIES: CategoryChoice[] = [
  { id: "plumbing", label: "Plumbing", apiCategory: "plumbing" },
  { id: "electrical", label: "Electrical", apiCategory: "electrical" },
  { id: "hvac", label: "HVAC", apiCategory: "hvac" },
  { id: "appliance", label: "Appliance", apiCategory: "appliance" },
  { id: "doors", label: "Doors & Windows", apiCategory: "structural" },
  { id: "pest", label: "Pest Control", apiCategory: "other" },
  { id: "general", label: "General", apiCategory: "general" }
];

type Step = "home" | "category" | "details" | "questions" | "done";

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

export function ResidentMaintenancePortal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("home");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [emergency, setEmergency] = useState(false);
  const [permissionToEnter, setPermissionToEnter] = useState(true);
  const [pets, setPets] = useState(false);
  const [listening, setListening] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const selectedCategory = useMemo(
    () => CATEGORIES.find((item) => item.id === categoryId) ?? null,
    [categoryId]
  );

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
      recognitionRef.current?.stop();
    };
  }, [refresh]);

  function resetComposer() {
    setStep("home");
    setCategoryId(null);
    setDescription("");
    setPhotoNames([]);
    setEmergency(false);
    setPermissionToEnter(true);
    setPets(false);
  }

  function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    const names = Array.from(files)
      .slice(0, 6)
      .map((file) => file.name || "photo.jpg");
    setPhotoNames((prev) => [...prev, ...names].slice(0, 8));
  }

  function startVoice() {
    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? (
            window as Window & {
              SpeechRecognition?: new () => SpeechRecognition;
              webkitSpeechRecognition?: new () => SpeechRecognition;
            }
          ).SpeechRecognition ||
          (
            window as Window & {
              webkitSpeechRecognition?: new () => SpeechRecognition;
            }
          ).webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionCtor) {
      setNotice("Use your keyboard mic for voice-to-text on this device.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) {
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.onerror = () => {
      setListening(false);
      setNotice("Voice capture stopped. You can keep typing.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  async function submitRequest() {
    if (!selectedCategory || description.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const titleBase = `${selectedCategory.label}: ${description.trim().slice(0, 48)}`;
      const title = titleBase.length >= 3 ? titleBase : `${selectedCategory.label} issue`;
      const extras = [
        `Emergency: ${emergency ? "Yes" : "No"}`,
        `Permission to enter: ${permissionToEnter ? "Yes" : "No"}`,
        `Pets on premises: ${pets ? "Yes" : "No"}`,
        photoNames.length
          ? `Photos selected (${photoNames.length}): ${photoNames.join(", ")}. Full photo attach lands with Document Intelligence — manager sees this note now.`
          : "Photos: none selected"
      ].join("\n");
      const fullDescription = `${description.trim()}\n\n---\n${extras}`;
      const priority: WorkOrderPriority = emergency ? "emergency" : "normal";

      const response = await fetch("/api/portal/tenant/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.slice(0, 160),
          description: fullDescription.slice(0, 4000),
          category: selectedCategory.apiCategory,
          priority
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Submit failed");
      }
      setNotice("Request submitted. Your property team has it.");
      setStep("done");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ResidentPageIntro
        eyebrow="Maintenance"
        title="Fix something"
        description="Report an issue in under a minute. We already know your home — you don’t pick property, unit, or technician."
      />

      {error ? (
        <p className="rounded-xl border border-[#C0392B] bg-[#FCE8E6] px-3 py-2 text-sm text-[#C0392B]">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {notice}
        </p>
      ) : null}

      {step === "home" ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setStep("category");
            }}
            className={`flex min-h-14 w-full items-center justify-center rounded-2xl bg-[var(--mpa-color-brand-primary)] px-4 text-base font-semibold text-white hover:bg-[#0C5A48] ${linkFocus}`}
          >
            Report an issue
          </button>
          <p className="text-center text-xs text-[var(--mpa-color-text-secondary)]">
            Routing to your property’s workflow happens automatically.
          </p>
        </div>
      ) : null}

      {step === "category" ? (
        <section className="space-y-3 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            What’s going on?
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCategoryId(item.id);
                  setStep("details");
                }}
                className={`min-h-14 rounded-2xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] px-3 text-sm font-semibold text-[var(--mpa-color-text-primary)] hover:border-[var(--mpa-color-brand-primary)] ${linkFocus}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`text-sm text-[var(--mpa-color-text-secondary)] underline ${linkFocus}`}
            onClick={resetComposer}
          >
            Cancel
          </button>
        </section>
      ) : null}

      {step === "details" && selectedCategory ? (
        <section className="space-y-4 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Category · <span className="font-medium text-[var(--mpa-color-text-primary)]">{selectedCategory.label}</span>
          </p>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Add photos</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={`inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--mpa-color-brand-primary)] px-3 text-sm font-semibold text-white ${linkFocus}`}
              >
                Take photo
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className={`inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--mpa-color-border-default)] px-3 text-sm font-medium ${linkFocus}`}
              >
                Choose from gallery
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={(event) => {
                onFilesSelected(event.target.files);
                event.target.value = "";
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                onFilesSelected(event.target.files);
                event.target.value = "";
              }}
            />
            {photoNames.length ? (
              <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
                {photoNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                Photos are noted on the request now; full attach arrives with Document Intelligence.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Describe the issue</p>
              <button
                type="button"
                onClick={startVoice}
                className={`rounded-lg px-2 py-1 text-xs font-medium text-[var(--mpa-color-brand-primary)] underline ${linkFocus}`}
              >
                {listening ? "Listening…" : "Voice to text"}
              </button>
            </div>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What’s wrong? A sentence is enough."
              required
              minLength={3}
              rows={4}
              className="min-h-28 text-base"
            />
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Tip: most phones also have a mic on the keyboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={description.trim().length < 3}
              onClick={() => setStep("questions")}
            >
              Continue
            </Button>
            <button
              type="button"
              className={`text-sm text-[var(--mpa-color-text-secondary)] underline ${linkFocus}`}
              onClick={() => setStep("category")}
            >
              Back
            </button>
          </div>
        </section>
      ) : null}

      {step === "questions" && selectedCategory ? (
        <section className="space-y-4 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h2 className="text-base font-semibold">A few optional details</h2>
          <ToggleRow
            label="Is this an emergency?"
            checked={emergency}
            onChange={setEmergency}
          />
          <ToggleRow
            label="Permission to enter if you’re not home?"
            checked={permissionToEnter}
            onChange={setPermissionToEnter}
          />
          <ToggleRow label="Pets on the premises?" checked={pets} onChange={setPets} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void submitRequest()}>
              {busy ? "Submitting…" : "Submit request"}
            </Button>
            <button
              type="button"
              className={`text-sm text-[var(--mpa-color-text-secondary)] underline ${linkFocus}`}
              onClick={() => setStep("details")}
            >
              Back
            </button>
          </div>
        </section>
      ) : null}

      {step === "done" ? (
        <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="text-base font-semibold text-emerald-950">You’re all set</h2>
          <p className="text-sm text-emerald-900">
            Your request is in. We’ll route it through your property’s workflow — you don’t need to
            chase anyone.
          </p>
          <Button type="button" onClick={resetComposer}>
            Done
          </Button>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Your requests</h2>
        {entries.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="Tap Report an issue when something needs fixing."
          />
        ) : (
          entries.map(({ workOrder, updates }) => (
            <article
              key={workOrder.id}
              className="space-y-3 rounded-2xl border border-[var(--mpa-color-border-default)] bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-[var(--mpa-color-text-primary)]">{workOrder.title}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-[var(--mpa-color-text-secondary)]">
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
              {updates.length ? (
                <ul className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  {updates.slice(0, 3).map((update) => (
                    <li key={update.id}>
                      <span className="font-medium text-[var(--mpa-color-text-primary)]">
                        {update.actor_role}:
                      </span>{" "}
                      {update.body}
                    </li>
                  ))}
                </ul>
              ) : null}
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
                  Confirm it’s fixed
                </Button>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--mpa-color-border-default)] px-3 py-2">
      <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{label}</span>
      <input
        type="checkbox"
        className="h-5 w-5 accent-[var(--mpa-color-brand-primary)]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

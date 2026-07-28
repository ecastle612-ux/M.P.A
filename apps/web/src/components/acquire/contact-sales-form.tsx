"use client";

import { useState, type FormEvent } from "react";

type FormState = {
  name: string;
  workEmail: string;
  company: string;
  portfolioSize: string;
  message: string;
};

const INITIAL: FormState = {
  name: "",
  workEmail: "",
  company: "",
  portfolioSize: "",
  message: ""
};

export function ContactSalesForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.workEmail.includes("@") || !form.company.trim()) {
      setError("Name, work email, and company are required.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/acquire/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          workEmail: form.workEmail.trim().toLowerCase(),
          company: form.company.trim(),
          portfolioSize: form.portfolioSize.trim() || null,
          message: form.message.trim() || null
        })
      });
      const payload = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok) {
        setError(payload.error ?? "Unable to submit your request.");
        setPending(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-6"
        role="status"
      >
        <h2 className="font-display text-xl font-semibold">Thanks — we received your request</h2>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          A sales specialist will follow up at <strong>{form.workEmail}</strong>. Your request is in the
          commercial pipeline.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="name"
          label="Your name"
          required
          value={form.name}
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
        />
        <Field
          id="workEmail"
          label="Work email"
          type="email"
          required
          value={form.workEmail}
          onChange={(value) => setForm((current) => ({ ...current, workEmail: value }))}
        />
      </div>
      <Field
        id="company"
        label="Company"
        required
        value={form.company}
        onChange={(value) => setForm((current) => ({ ...current, company: value }))}
      />
      <Field
        id="portfolioSize"
        label="Approximate portfolio size"
        value={form.portfolioSize}
        onChange={(value) => setForm((current) => ({ ...current, portfolioSize: value }))}
        hint="Properties or units — optional"
      />
      <div>
        <label htmlFor="message" className="mpa-text-caption font-medium text-[var(--mpa-color-text-secondary)]">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          className="mt-1 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-interactive-focus-ring)]"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-[var(--mpa-color-feedback-error)]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  hint
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mpa-text-caption font-medium text-[var(--mpa-color-text-secondary)]">
        {label}
        {required ? <span className="text-[var(--mpa-color-feedback-error)]"> *</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-interactive-focus-ring)]"
      />
      {hint ? <p className="mt-1 text-xs text-[var(--mpa-color-text-muted)]">{hint}</p> : null}
    </div>
  );
}

"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "../lib/cn";
import { Input } from "./input";

export type ComboboxOption = { value: string; label: string };

export type ComboboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "list"> & {
  options: ComboboxOption[];
  error?: boolean;
  /** Optional label rendered above the control when not using FormField. */
  label?: ReactNode;
};

/**
 * UX-012 Slice B — Combobox (native datalist typeahead for long lists).
 * Menu/popover combobox chrome can extend later; datalist covers MVP typeahead.
 */
export function Combobox({
  options,
  error = false,
  label,
  id,
  className,
  ...props
}: ComboboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;

  const control = (
    <>
      <Input id={inputId} list={listId} error={error} className={className} {...props} />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
    </>
  );

  if (label == null) return control;

  return (
    <div className="space-y-[var(--mpa-space-1)]">
      <label
        htmlFor={inputId}
        className="mpa-text-caption font-[var(--mpa-font-weight-medium)] text-[var(--mpa-color-text-secondary)]"
      >
        {label}
      </label>
      {control}
    </div>
  );
}

/** Shared menu panel recipe for future popover menus (tokenized). */
export function menuPanelClassName(className?: string): string {
  return cn(
    "rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-1)] shadow-[var(--mpa-shadow-md)]",
    className
  );
}

export function menuItemClassName(active?: boolean, className?: string): string {
  return cn(
    "block w-full rounded-[var(--mpa-radius-sm)] px-[var(--mpa-space-3)] py-[var(--mpa-space-2)] text-left mpa-text-body text-[var(--mpa-color-text-primary)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]",
    active
      ? "bg-[var(--mpa-color-interactive-selected)]"
      : "hover:bg-[var(--mpa-color-interactive-row-hover)]",
    className
  );
}

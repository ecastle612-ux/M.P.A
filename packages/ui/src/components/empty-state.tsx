import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "../primitives/button";

type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: ButtonProps["onClick"];
};

export function EmptyState({
  icon,
  title,
  description,
  whyItMatters,
  examples,
  action,
  secondaryAction,
  className
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  whyItMatters?: string;
  examples?: string[];
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--mpa-radius-xl)] border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)]/50 px-5 py-8 text-center md:py-10",
        className
      )}
    >
      {icon ? (
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary-subtle)] text-xl text-[var(--mpa-color-brand-primary)]"
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-base font-semibold tracking-tight text-[var(--mpa-color-text-primary)] md:text-lg">{title}</h3>
      <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">{description}</p>
      {whyItMatters ? (
        <p className="mt-2 max-w-lg text-xs font-medium leading-relaxed text-[var(--mpa-color-text-primary)]">
          Why it matters: {whyItMatters}
        </p>
      ) : null}
      {examples && examples.length > 0 ? (
        <ul className="mt-3 max-w-md space-y-1 text-left text-xs text-[var(--mpa-color-text-secondary)]">
          {examples.map((example) => (
            <li key={example} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-[var(--mpa-color-brand-primary)]" aria-hidden>
                ·
              </span>
              {example}
            </li>
          ))}
        </ul>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action ? (
            action.href ? (
              <a href={action.href}>
                <Button>{action.label}</Button>
              </a>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            )
          ) : null}
          {secondaryAction ? (
            secondaryAction.href ? (
              <a href={secondaryAction.href}>
                <Button variant="secondary">{secondaryAction.label}</Button>
              </a>
            ) : (
              <Button variant="secondary" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

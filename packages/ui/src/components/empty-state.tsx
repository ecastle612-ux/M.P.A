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
  examples,
  action,
  secondaryAction,
  className
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  examples?: string[];
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--mpa-radius-xl)] border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)]/50 px-6 py-12 text-center",
        className
      )}
    >
      {icon ? (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary-subtle)] text-2xl text-[var(--mpa-color-brand-primary)]"
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">{description}</p>
      {examples && examples.length > 0 ? (
        <ul className="mt-4 max-w-md space-y-1 text-left text-xs text-[var(--mpa-color-text-secondary)]">
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
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

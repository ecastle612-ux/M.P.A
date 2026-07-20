"use client";

import type { DeploymentMeta } from "../../lib/launch/deployment-meta";

export function DeploymentBadge({
  meta,
  className = ""
}: {
  meta: DeploymentMeta;
  className?: string;
}) {
  const showBadge = meta.designPartnerMode || meta.env !== "production";
  if (!showBadge) return null;

  return (
    <div
      className={`flex max-w-[14rem] items-center gap-1.5 truncate rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] px-2 py-1 text-[11px] leading-tight text-[var(--mpa-color-text-secondary)] sm:max-w-none sm:gap-2 sm:px-2.5 ${className}`}
      title={`${meta.envLabel} · v${meta.version} · build ${meta.build}`}
    >
      <span className="font-medium text-[var(--mpa-color-text-primary)]">{meta.envLabel}</span>
      <span aria-hidden="true" className="text-[var(--mpa-color-border-strong)]">
        ·
      </span>
      <span>v{meta.version}</span>
      <span aria-hidden="true" className="text-[var(--mpa-color-border-strong)]">
        ·
      </span>
      <span className="font-mono">{meta.build}</span>
      {meta.feedbackUrl ? (
        <>
          <span aria-hidden="true" className="text-[var(--mpa-color-border-strong)]">
            ·
          </span>
          <a
            href={meta.feedbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--mpa-color-brand-primary)] underline-offset-2 hover:underline"
          >
            Feedback
          </a>
        </>
      ) : meta.designPartnerMode ? (
        <>
          <span aria-hidden="true" className="text-[var(--mpa-color-border-strong)]">
            ·
          </span>
          <span className="text-[var(--mpa-color-text-muted)]">Feedback soon</span>
        </>
      ) : null}
    </div>
  );
}

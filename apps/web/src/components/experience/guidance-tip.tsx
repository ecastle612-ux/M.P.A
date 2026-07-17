import type { GuidanceTipKey } from "../../lib/experience/guidance-tips";
import { GUIDANCE_TIPS } from "../../lib/experience/guidance-tips";

export function GuidanceTip({ tipKey, className }: { tipKey: GuidanceTipKey; className?: string }) {
  return (
    <p
      className={[
        "rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/60 px-3 py-2 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      role="note"
    >
      {GUIDANCE_TIPS[tipKey]}
    </p>
  );
}

import Image from "next/image";
import type { ReactNode } from "react";

export function LandingProductFrame({
  eyebrow,
  title,
  description,
  children,
  caption
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  caption?: string;
}) {
  return (
    <figure className="space-y-3">
      <figcaption className="max-w-2xl space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            {eyebrow}
          </p>
        ) : null}
        <p className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)] md:text-xl">
          {title}
        </p>
        {description ? (
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{description}</p>
        ) : null}
      </figcaption>
      <div className="overflow-hidden rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] shadow-[0_18px_48px_rgba(15,27,45,0.12)]">
        {children}
      </div>
      {caption ? (
        <p className="text-xs leading-5 text-[var(--mpa-color-text-muted)] md:text-sm">{caption}</p>
      ) : null}
    </figure>
  );
}

export function LandingMissionControlScreenshot({
  priority = false,
  className = ""
}: {
  priority?: boolean;
  className?: string;
}) {
  return (
    <LandingProductFrame
      eyebrow="Product proof"
      title="Mission Control"
      description="See what needs attention and keep the operation moving."
      caption="Live Demo — Property Manager Mission Control (Harborline Properties demo data)."
    >
      <Image
        src="/marketing/pm-mission-control-demo.png"
        alt="Property Manager Mission Control in Live Demo, showing attention bands, priorities, and portfolio metrics"
        width={1280}
        height={720}
        className={`h-auto w-full ${className}`}
        sizes="(max-width: 768px) 100vw, 640px"
        priority={priority}
      />
    </LandingProductFrame>
  );
}

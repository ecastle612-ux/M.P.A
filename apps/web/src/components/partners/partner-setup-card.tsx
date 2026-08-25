"use client";

import Link from "next/link";
import { buttonClassName } from "@mpa/ui";

export type PartnerSetupSnapshot = {
  onboardingStatus: "not_started" | "in_progress" | "complete";
  readiness: "ready" | "not_ready";
  items: Array<{ id: string; label: string; href: string; complete: boolean }>;
  completedCount: number;
  totalCount: number;
  percent: number;
  nextItem: { id: string; label: string; href: string } | null;
  nextLabel: string | null;
  progressLabel: string;
};

export function PartnerSetupCard({
  onboarding,
  referralUrl,
  onAck
}: {
  onboarding: PartnerSetupSnapshot;
  referralUrl?: string | null;
  onAck?: (action: string) => Promise<void>;
}) {
  return (
    <section
      className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
      aria-labelledby="partner-setup-heading"
    >
      <div className="space-y-1">
        <h2 id="partner-setup-heading" className="font-display text-xl font-semibold">
          Partner Setup
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]" aria-live="polite">
          {onboarding.completedCount} of {onboarding.totalCount} complete · {onboarding.progressLabel}
        </p>
        {onboarding.nextLabel ? (
          <p className="text-sm font-medium">{onboarding.nextLabel}</p>
        ) : (
          <p className="text-sm">
            {onboarding.readiness === "ready" ? "Ready to receive requests." : "Setup is complete."}
          </p>
        )}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={onboarding.percent}
        aria-label={onboarding.progressLabel}
      >
        <div
          className="h-full bg-[var(--mpa-color-brand-primary)]"
          style={{ width: `${onboarding.percent}%` }}
        />
      </div>
      <ol className="space-y-2">
        {onboarding.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {item.label}{" "}
                <span className="text-[var(--mpa-color-text-secondary)]">
                  {item.complete ? "(complete)" : "(not started)"}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={buttonClassName({ size: "sm" })} href={item.href}>
                {item.complete ? "Review" : "Continue"}
              </Link>
              {item.id === "understand_earnings" && !item.complete && onAck ? (
                <button
                  type="button"
                  className={buttonClassName({ size: "sm", variant: "secondary" })}
                  onClick={() => void onAck("partner.earnings_acknowledged")}
                >
                  I understand tracked earnings
                </button>
              ) : null}
              {item.id === "share_referral_link" && referralUrl && onAck ? (
                <button
                  type="button"
                  className={buttonClassName({ size: "sm", variant: "secondary" })}
                  onClick={() => {
                    void navigator.clipboard.writeText(referralUrl);
                    void onAck("partner.referral_shared");
                  }}
                >
                  Copy referral link
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {referralUrl ? (
        <p className="break-all text-sm text-[var(--mpa-color-text-secondary)]">
          Your M.P.A. Referral Link: <code>{referralUrl}</code>
        </p>
      ) : null}
    </section>
  );
}

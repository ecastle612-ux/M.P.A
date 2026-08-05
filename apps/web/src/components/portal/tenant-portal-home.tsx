import Link from "next/link";
import { Card } from "@mpa/ui";
import {
  NavIconCommunications,
  NavIconFinancials,
  NavIconLeases,
  NavIconMaintenance,
  NavIconPortals,
  NavIconProperties
} from "../presentation/nav-icons";
import { TenantGreetingLine } from "./tenant-greeting-line";

export type TenantAttentionItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  critical: boolean;
  unread: boolean;
  /** Rent due, expiring announcements, payment alerts, etc. */
  timeSensitive: boolean;
  createdAt: string;
  kind: "announcement" | "notification" | "message";
};

export type TenantTodayCard = {
  id: string;
  title: string;
  description: string;
  href: string;
};

const QUICK_ACTIONS = [
  { href: "/portal/tenant/payments", label: "Pay Rent", Icon: NavIconFinancials },
  { href: "/portal/tenant/maintenance", label: "Maintenance", Icon: NavIconMaintenance },
  { href: "/portal/tenant/messages", label: "Messages", Icon: NavIconCommunications },
  { href: "/portal/tenant/documents", label: "Documents", Icon: NavIconLeases },
  { href: "/portal/tenant/community", label: "Community", Icon: NavIconProperties },
  { href: "/portal/tenant/more", label: "More", Icon: NavIconPortals }
] as const;

function kindLabel(kind: TenantAttentionItem["kind"]): string {
  if (kind === "announcement") return "Announcement";
  if (kind === "notification") return "Update";
  return "Message";
}

export function TenantPortalHome({
  firstName,
  propertyName,
  unitNumber,
  hasLinkedTenant,
  attentionItems,
  todayCards,
  embedded = false
}: {
  firstName: string;
  propertyName: string | null;
  unitNumber: string | null;
  hasLinkedTenant: boolean;
  attentionItems: TenantAttentionItem[];
  todayCards: TenantTodayCard[];
  /** STD-001 — when true, greeting / For you sit in Universal Dashboard above. */
  embedded?: boolean;
}) {
  const forYouEmpty = attentionItems.length === 0;
  /** Avoid repeating the same calm message — Today only when there is content, or when For you has items but Today does not. */
  const showTodaySection = todayCards.length > 0 || (hasLinkedTenant && !forYouEmpty);
  const showTodayCaughtUp = hasLinkedTenant && todayCards.length === 0 && !forYouEmpty;

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10 sm:max-w-2xl sm:space-y-6">
      {embedded ? null : (
        <div className="mpa-rise-in">
          <TenantGreetingLine
            firstName={firstName}
            propertyName={propertyName}
            unitNumber={unitNumber}
            hasLinkedTenant={hasLinkedTenant}
          />
        </div>
      )}

      {embedded ? null : (
      <section
        aria-labelledby="tenant-attention-heading"
        className="mpa-rise-in mpa-rise-in-delay-1 space-y-2.5"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="tenant-attention-heading"
            className="text-base font-semibold text-[var(--mpa-color-text-primary)]"
          >
            For you
          </h2>
          <Link
            href="/portal/tenant/announcements"
            className="min-h-11 min-w-[4.5rem] shrink-0 content-center text-right text-sm font-medium text-[var(--mpa-color-brand-primary)]"
          >
            View all
          </Link>
        </div>

        {forYouEmpty ? (
          <Card className="border-[var(--mpa-color-border-subtle)] px-4 py-4">
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
              Everything looks good today
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]">
              No new updates right now.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden !p-0 border-[var(--mpa-color-border-subtle)] divide-y divide-[var(--mpa-color-border-subtle)]">
            <ul>
              {attentionItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex min-h-[3.25rem] flex-col justify-center gap-0.5 px-4 py-3 transition hover:bg-[var(--mpa-color-bg-surface-muted)]/70 active:bg-[var(--mpa-color-bg-surface-muted)]"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                        {kindLabel(item.kind)}
                      </span>
                      {item.critical ? (
                        <span className="rounded-full bg-[var(--mpa-color-feedback-error-subtle,rgba(185,28,28,0.1))] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--mpa-color-feedback-error,#b91c1c)]">
                          Critical
                        </span>
                      ) : null}
                      {!item.critical && item.unread ? (
                        <span className="rounded-full bg-[var(--mpa-color-brand-primary-subtle)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--mpa-color-brand-primary)]">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium leading-snug text-[var(--mpa-color-text-primary)]">
                      {item.title}
                    </p>
                    {item.body ? (
                      <p className="line-clamp-1 text-xs text-[var(--mpa-color-text-secondary)]">{item.body}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
      )}

      <section
        aria-labelledby="tenant-actions-heading"
        className="mpa-rise-in mpa-rise-in-delay-2 space-y-2.5"
      >
        <h2
          id="tenant-actions-heading"
          className="text-base font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {QUICK_ACTIONS.map((action, index) => {
            const isPrimary = index === 0;
            const Icon = action.Icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={[
                  "flex min-h-12 items-center justify-center gap-2 rounded-[var(--mpa-radius-lg)] px-3 py-3 text-center text-sm font-semibold leading-snug transition active:scale-[0.99]",
                  isPrimary
                    ? "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)] shadow-sm hover:opacity-95"
                    : "border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] text-[var(--mpa-color-text-primary)] hover:border-[var(--mpa-color-border-strong)] hover:bg-[var(--mpa-color-bg-surface-muted)]/40"
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" />
                <span>{action.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {showTodaySection ? (
        <section
          aria-labelledby="tenant-today-heading"
          className="mpa-rise-in mpa-rise-in-delay-3 space-y-2.5"
        >
          <h2
            id="tenant-today-heading"
            className="text-base font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Today
          </h2>
          {showTodayCaughtUp ? (
            <Card className="border-[var(--mpa-color-border-subtle)] px-4 py-4">
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                Nothing needs your attention
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]">
                Check back later for rent, maintenance, or messages.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {todayCards.map((card) => (
                <Link
                  key={card.id}
                  href={card.href}
                  className="block rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3.5 transition hover:border-[var(--mpa-color-border-strong)]"
                >
                  <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{card.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]">
                    {card.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

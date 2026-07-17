"use client";

import Link from "next/link";
import { Badge, Card } from "@mpa/ui";
import { communityEventTypeLabel, type CommunityEventRecord } from "../../lib/community/contracts";
import type { ResidentAnnouncementItem } from "../../lib/communication/server";

export function CommunityHub({
  announcements,
  events
}: {
  announcements: ResidentAnnouncementItem[];
  events: CommunityEventRecord[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Announcements</h2>
          <Link href="/portal/tenant/announcements" className="text-sm font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
            View all
          </Link>
        </div>
        {announcements.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No announcements right now. Check back for community updates.</p>
        ) : (
          <ul className="space-y-3">
            {announcements.slice(0, 5).map((item) => (
              <li key={item.id} className="rounded-lg border border-[var(--mpa-color-border-subtle)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/portal/tenant/announcements/${item.id}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                    {item.title}
                  </Link>
                  {item.priority === "emergency" ? <Badge variant="warning">Emergency</Badge> : null}
                  {!item.isRead ? <Badge variant="info">Unread</Badge> : null}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--mpa-color-text-secondary)]">{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Community calendar</h2>
        {events.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No upcoming events scheduled for your community.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="rounded-lg border border-[var(--mpa-color-border-subtle)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">{event.title}</p>
                  <Badge variant={event.eventType === "emergency" ? "warning" : "info"}>
                    {communityEventTypeLabel(event.eventType)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-muted)]">
                  {new Date(event.startsAt).toLocaleString()}
                  {event.endsAt ? ` – ${new Date(event.endsAt).toLocaleString()}` : ""}
                </p>
                {event.body ? <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{event.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

import { createAuthServerComponentClient } from "../auth/server";
import { getWorkOrdersForOrganization } from "../maintenance/server";
import { listPmOccurrences, listPmSchedules } from "./pm-server";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export type FacilityCalendarItem = {
  id: string;
  date: string;
  title: string;
  type: "work_order" | "pm_occurrence" | "pm_schedule";
  href: string;
  subtitle: string | null;
  status: string | null;
};

function monthBounds(year: number, month: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  };
}

export async function getFacilityCalendarItems(
  organizationId: string,
  options: { year: number; month: number },
  client?: SupabaseClientType
): Promise<FacilityCalendarItem[]> {
  const supabase = client ?? (await createAuthServerComponentClient());
  const { from, to } = monthBounds(options.year, options.month);

  const [workOrders, occurrences, schedules] = await Promise.all([
    getWorkOrdersForOrganization(
      organizationId,
      { status: "open", sortBy: "due_date", sortOrder: "asc", limit: 300 },
      supabase
    ),
    listPmOccurrences(organizationId, { from, to, limit: 300 }, supabase),
    listPmSchedules(organizationId, supabase)
  ]);

  const items: FacilityCalendarItem[] = [];

  for (const wo of workOrders) {
    const due = wo.dueDate?.slice(0, 10) ?? null;
    if (!due || due < from || due > to) continue;
    items.push({
      id: `wo:${wo.id}`,
      date: due,
      title: wo.title,
      type: "work_order",
      href: `/maintenance/${wo.id}`,
      subtitle: wo.propertyName,
      status: wo.status
    });
  }

  for (const occurrence of occurrences) {
    items.push({
      id: `pm-occ:${occurrence.id}`,
      date: occurrence.dueOn,
      title:
        schedules.find((schedule) => schedule.id === occurrence.scheduleId)?.title ??
        "Preventive maintenance",
      type: "pm_occurrence",
      href: occurrence.workOrderId
        ? `/maintenance/${occurrence.workOrderId}`
        : `/facility/pm/${occurrence.scheduleId}`,
      subtitle: occurrence.status,
      status: occurrence.status
    });
  }

  for (const schedule of schedules) {
    if (!schedule.active) continue;
    if (schedule.nextDue < from || schedule.nextDue > to) continue;
    // Avoid double-counting when an occurrence already exists for next due.
    const hasOccurrence = occurrences.some(
      (occurrence) =>
        occurrence.scheduleId === schedule.id && occurrence.dueOn === schedule.nextDue
    );
    if (hasOccurrence) continue;
    items.push({
      id: `pm-sched:${schedule.id}:${schedule.nextDue}`,
      date: schedule.nextDue,
      title: schedule.title,
      type: "pm_schedule",
      href: `/facility/pm/${schedule.id}`,
      subtitle: schedule.propertyName,
      status: schedule.overdue ? "overdue" : "scheduled"
    });
  }

  return items.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.title.localeCompare(b.title);
  });
}

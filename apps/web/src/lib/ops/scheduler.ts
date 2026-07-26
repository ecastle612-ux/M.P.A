/**
 * OPS-001 Slice B — Scheduler foundation.
 * Single-leader lease · idempotent run windows · org-safe execution · telemetry.
 */

import { randomUUID } from "crypto";
import { createServiceRoleServerClient } from "../auth/server";
import { dispatchPendingEvents } from "./dispatcher";
import { emitOpsDomainEvent } from "./emit";
import { getOutboxLagMetrics } from "./metrics";
import { processDueReminders } from "./reminder-engine";
import type { OpsDbClient } from "./types";

export type SchedulerTickResult = {
  leader: boolean;
  holderId: string;
  claimedSchedules: number;
  completed: number;
  failed: number;
  skipped: number;
  jobs: Array<{ jobType: string; status: string; detail?: Record<string, unknown> }>;
};

export type SchedulerTelemetry = {
  leader: { holderId: string | null; leasedUntil: string | null; isCurrentHolder: boolean };
  schedules: { enabled: number; due: number };
  runs24h: { completed: number; failed: number; skipped: number };
  reminders: { scheduledDue: number; processing: number; error: number };
  outbox: Awaited<ReturnType<typeof getOutboxLagMetrics>>;
};

function serviceClient(): OpsDbClient {
  return createServiceRoleServerClient() as unknown as OpsDbClient;
}

type ScheduleRow = {
  schedule_id: string;
  organization_id: string | null;
  name: string;
  job_type: string;
  schedule_kind: "cron" | "interval" | "one_shot";
  cron_expr: string | null;
  interval_seconds: number | null;
  run_at: string | null;
  timezone: string;
  payload: Record<string, unknown>;
  next_run_at: string | null;
};

function windowKeyFor(schedule: ScheduleRow, now: Date): string {
  if (schedule.schedule_kind === "interval" && schedule.interval_seconds) {
    const bucket = Math.floor(now.getTime() / (schedule.interval_seconds * 1000));
    return `interval:${schedule.interval_seconds}:${bucket}`;
  }
  if (schedule.schedule_kind === "one_shot" && schedule.run_at) {
    return `one_shot:${schedule.run_at}`;
  }
  // Cron / fallback: minute bucket
  const minute = new Date(now);
  minute.setUTCSeconds(0, 0);
  return `cron:${minute.toISOString()}`;
}

function nextRunAt(schedule: ScheduleRow, from: Date): string | null {
  if (schedule.schedule_kind === "interval" && schedule.interval_seconds) {
    return new Date(from.getTime() + schedule.interval_seconds * 1000).toISOString();
  }
  if (schedule.schedule_kind === "one_shot") {
    return null;
  }
  // Cron foundation: next minute (full cron parser deferred; interval covers MVP seeds)
  return new Date(from.getTime() + 60_000).toISOString();
}

async function executeJob(
  db: OpsDbClient,
  schedule: ScheduleRow
): Promise<Record<string, unknown>> {
  switch (schedule.job_type) {
    case "outbox_sweeper": {
      const result = await dispatchPendingEvents(50);
      return { claimed: result.claimed, processed: result.processed, failed: result.failed };
    }
    case "reminder_due_scan": {
      const result = await processDueReminders(50);
      return {
        claimed: result.claimed,
        fired: result.fired,
        failed: result.failed,
        consolidated: result.consolidated
      };
    }
    default:
      return { skipped: true, reason: "unknown_job_type", jobType: schedule.job_type };
  }
}

/**
 * Acquire / renew single-leader lease. Returns true when this holder may run due schedules.
 */
export async function acquireSchedulerLeadership(
  holderId: string,
  leaseSeconds = 60
): Promise<boolean> {
  const db = serviceClient();
  const { data, error } = await db.rpc("ops_acquire_scheduler_leader", {
    p_holder_id: holderId,
    p_lease_seconds: leaseSeconds
  });
  if (error) throw new Error(error.message ?? "Failed to acquire scheduler leader");
  return Boolean(data);
}

/**
 * Scheduler tick — leader only enqueues/executes due schedules with deduped window keys.
 */
export async function tickScheduler(options?: {
  holderId?: string;
  leaseSeconds?: number;
  limit?: number;
}): Promise<SchedulerTickResult> {
  const holderId = options?.holderId ?? `scheduler:${randomUUID()}`;
  const db = serviceClient();
  const isLeader = await acquireSchedulerLeadership(holderId, options?.leaseSeconds ?? 60);

  const base: SchedulerTickResult = {
    leader: isLeader,
    holderId,
    claimedSchedules: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    jobs: []
  };

  if (!isLeader) {
    return base;
  }

  const now = new Date();
  const { data: dueRows, error } = await db
    .from("ops_schedules")
    .select(
      "schedule_id, organization_id, name, job_type, schedule_kind, cron_expr, interval_seconds, run_at, timezone, payload, next_run_at"
    )
    .eq("enabled", true)
    .lte("next_run_at", now.toISOString())
    .order("next_run_at", { ascending: true })
    .limit(options?.limit ?? 20);

  if (error) throw new Error(error.message);

  const schedules = (dueRows ?? []) as ScheduleRow[];
  base.claimedSchedules = schedules.length;

  for (const schedule of schedules) {
    // Org-safe: platform schedules (null org) or org-scoped only — never fan across orgs.
    const windowKey = windowKeyFor(schedule, now);

    const { data: runInsert, error: runError } = await db
      .from("ops_scheduler_runs")
      .insert({
        schedule_id: schedule.schedule_id,
        organization_id: schedule.organization_id,
        window_key: windowKey,
        job_type: schedule.job_type,
        status: "running",
        result: {}
      })
      .select("run_id")
      .maybeSingle();

    if (runError) {
      // Unique violation → already executed this window
      if (runError.code === "23505" || /duplicate|unique/i.test(runError.message ?? "")) {
        base.skipped += 1;
        base.jobs.push({ jobType: schedule.job_type, status: "skipped", detail: { windowKey } });
        const nxt = nextRunAt(schedule, now);
        await db
          .from("ops_schedules")
          .update({
            next_run_at: nxt,
            updated_at: now.toISOString(),
            enabled: schedule.schedule_kind === "one_shot" ? false : true
          })
          .eq("schedule_id", schedule.schedule_id);
        continue;
      }
      base.failed += 1;
      base.jobs.push({
        jobType: schedule.job_type,
        status: "failed",
        detail: { error: runError.message }
      });
      continue;
    }

    const runId = (runInsert as { run_id: string } | null)?.run_id;

    if (schedule.organization_id) {
      await emitOpsDomainEvent(
        db,
        {
          eventType: "ops.schedule.run_started",
          organizationId: schedule.organization_id,
          subject: { type: "schedule", id: schedule.schedule_id },
          actor: { actor_type: "system" },
          summary: `Schedule run started: ${schedule.job_type}`,
          payload: {
            summary: `Schedule run started: ${schedule.job_type}`,
            scheduleId: schedule.schedule_id,
            jobType: schedule.job_type,
            windowKey,
            runId: runId ?? null
          },
          visibility: "ops"
        },
        { dispatchNow: false }
      );
    }

    try {
      const detail = await executeJob(db, schedule);
      const finished = new Date().toISOString();
      await db
        .from("ops_scheduler_runs")
        .update({
          status: detail["skipped"] ? "skipped" : "completed",
          finished_at: finished,
          result: detail
        })
        .eq("run_id", runId);

      const nxt = nextRunAt(schedule, now);
      await db
        .from("ops_schedules")
        .update({
          last_run_at: finished,
          next_run_at: nxt,
          updated_at: finished,
          enabled: schedule.schedule_kind === "one_shot" ? false : true
        })
        .eq("schedule_id", schedule.schedule_id);

      if (schedule.organization_id) {
        await emitOpsDomainEvent(
          db,
          {
            eventType: "ops.schedule.run_completed",
            organizationId: schedule.organization_id,
            subject: { type: "schedule", id: schedule.schedule_id },
            actor: { actor_type: "system" },
            summary: `Schedule run completed: ${schedule.job_type}`,
            payload: {
              summary: `Schedule run completed: ${schedule.job_type}`,
              scheduleId: schedule.schedule_id,
              jobType: schedule.job_type,
              windowKey,
              runId: runId ?? null
            },
            visibility: "ops"
          },
          { dispatchNow: false }
        );
      }

      if (detail["skipped"]) {
        base.skipped += 1;
        base.jobs.push({ jobType: schedule.job_type, status: "skipped", detail });
      } else {
        base.completed += 1;
        base.jobs.push({ jobType: schedule.job_type, status: "completed", detail });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "schedule_run_failed";
      const finished = new Date().toISOString();
      await db
        .from("ops_scheduler_runs")
        .update({
          status: "failed",
          finished_at: finished,
          error: message.slice(0, 2000),
          result: { error: message.slice(0, 200) }
        })
        .eq("run_id", runId);

      const nxt = nextRunAt(schedule, now);
      await db
        .from("ops_schedules")
        .update({
          last_run_at: finished,
          next_run_at: nxt,
          updated_at: finished
        })
        .eq("schedule_id", schedule.schedule_id);

      if (schedule.organization_id) {
        await emitOpsDomainEvent(
          db,
          {
            eventType: "ops.schedule.run_failed",
            organizationId: schedule.organization_id,
            subject: { type: "schedule", id: schedule.schedule_id },
            actor: { actor_type: "system" },
            summary: `Schedule run failed: ${schedule.job_type}`,
            payload: {
              summary: `Schedule run failed: ${schedule.job_type}`,
              scheduleId: schedule.schedule_id,
              jobType: schedule.job_type,
              windowKey,
              reasonCode: message.slice(0, 100)
            },
            visibility: "ops"
          },
          { dispatchNow: false }
        );
      }

      base.failed += 1;
      base.jobs.push({
        jobType: schedule.job_type,
        status: "failed",
        detail: { error: message.slice(0, 200) }
      });
    }
  }

  return base;
}

export async function getSchedulerTelemetry(holderId?: string): Promise<SchedulerTelemetry> {
  const db = serviceClient();
  const nowIso = new Date().toISOString();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: leader } = await db
    .from("ops_scheduler_leader")
    .select("holder_id, leased_until")
    .eq("leader_key", "default")
    .maybeSingle();

  const leaderRow = leader as { holder_id?: string; leased_until?: string } | null;

  const { count: enabledCount } = await db
    .from("ops_schedules")
    .select("schedule_id", { count: "exact", head: true })
    .eq("enabled", true);

  const { count: dueCount } = await db
    .from("ops_schedules")
    .select("schedule_id", { count: "exact", head: true })
    .eq("enabled", true)
    .lte("next_run_at", nowIso);

  const { count: completed } = await db
    .from("ops_scheduler_runs")
    .select("run_id", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("started_at", since);

  const { count: failed } = await db
    .from("ops_scheduler_runs")
    .select("run_id", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("started_at", since);

  const { count: skipped } = await db
    .from("ops_scheduler_runs")
    .select("run_id", { count: "exact", head: true })
    .eq("status", "skipped")
    .gte("started_at", since);

  const { count: scheduledDue } = await db
    .from("ops_reminders")
    .select("reminder_id", { count: "exact", head: true })
    .eq("status", "scheduled")
    .lte("fire_at", nowIso);

  const { count: processing } = await db
    .from("ops_reminders")
    .select("reminder_id", { count: "exact", head: true })
    .eq("status", "processing");

  const { count: error } = await db
    .from("ops_reminders")
    .select("reminder_id", { count: "exact", head: true })
    .eq("status", "error");

  const outbox = await getOutboxLagMetrics();

  return {
    leader: {
      holderId: leaderRow?.holder_id ?? null,
      leasedUntil: leaderRow?.leased_until ?? null,
      isCurrentHolder: Boolean(holderId && leaderRow?.holder_id === holderId)
    },
    schedules: { enabled: enabledCount ?? 0, due: dueCount ?? 0 },
    runs24h: {
      completed: completed ?? 0,
      failed: failed ?? 0,
      skipped: skipped ?? 0
    },
    reminders: {
      scheduledDue: scheduledDue ?? 0,
      processing: processing ?? 0,
      error: error ?? 0
    },
    outbox
  };
}

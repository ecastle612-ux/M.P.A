-- FIN-003 Phase C R-C1: exclusive payout run execute lease
-- Prevents parallel executePayoutRun from over-committing transfers.
-- Crash recovery via lease expiry (no deadlock).

alter table public.payout_runs
  add column if not exists execute_lease_token text,
  add column if not exists execute_lease_expires_at timestamptz;

comment on column public.payout_runs.execute_lease_token is
  'FIN-003 R-C1: opaque token held by the single active execute worker';
comment on column public.payout_runs.execute_lease_expires_at is
  'FIN-003 R-C1: lease expiry; another worker may steal only after this instant';

create index if not exists payout_runs_lease_expires_idx
  on public.payout_runs (execute_lease_expires_at)
  where status = 'running';

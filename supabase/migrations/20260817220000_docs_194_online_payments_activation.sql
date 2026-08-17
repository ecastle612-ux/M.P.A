-- docs/194 — customer Online Payments activation (in-repo only).
-- Adds AutoPay pause reason only. Does not change any organization execution flag.

alter table public.financial_autopay_enrollments
  add column if not exists paused_reason text;

create index if not exists financial_autopay_enrollments_paused_reason_idx
  on public.financial_autopay_enrollments (organization_id, status, paused_reason);

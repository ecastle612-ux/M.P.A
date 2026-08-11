-- COM-002 Slice 4: pending capacity + declared units on organization_subscriptions.
-- Additive only. No Stripe / Vercel / Production env changes.

alter table public.organization_subscriptions
  add column if not exists declared_unit_count integer,
  add column if not exists pending_additional_blocks integer,
  add column if not exists pending_authorized_unit_capacity integer,
  add column if not exists last_capacity_authorized_at timestamptz;

comment on column public.organization_subscriptions.declared_unit_count is
  'Acquisition questionnaire declared units; billing metric remains property_units count.';
comment on column public.organization_subscriptions.pending_additional_blocks is
  'Next-period Additional Unit Capacity blocks scheduled with proration_behavior=none.';
comment on column public.organization_subscriptions.pending_authorized_unit_capacity is
  'Next-period authorized capacity ceiling after pending blocks apply.';
comment on column public.organization_subscriptions.last_capacity_authorized_at is
  'Timestamp of last explicit Additional Unit Capacity authorization.';

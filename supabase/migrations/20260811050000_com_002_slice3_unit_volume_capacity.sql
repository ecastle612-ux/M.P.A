-- COM-002 Slice 3: unit-volume capacity fields on organization_subscriptions.
-- Does not create Stripe Prices or Production env. Safe additive columns only.

alter table public.organization_subscriptions
  add column if not exists stripe_base_item_id text,
  add column if not exists stripe_additional_capacity_item_id text,
  add column if not exists managed_unit_count integer,
  add column if not exists authorized_additional_blocks integer,
  add column if not exists authorized_unit_capacity integer,
  add column if not exists quote_id text,
  add column if not exists trial_ends_at timestamptz;

comment on column public.organization_subscriptions.stripe_base_item_id is
  'Stripe subscription item id for module base Price (quantity 1).';
comment on column public.organization_subscriptions.stripe_additional_capacity_item_id is
  'Stripe subscription item id for Additional Unit Capacity Price; null when blocks=0.';
comment on column public.organization_subscriptions.managed_unit_count is
  'Declared or reconciled managed unit count (property_units metric).';
comment on column public.organization_subscriptions.authorized_additional_blocks is
  'Authorized Additional Unit Capacity blocks beyond included 500.';
comment on column public.organization_subscriptions.authorized_unit_capacity is
  'Authorized capacity ceiling = 500 * (1 + authorized_additional_blocks).';
comment on column public.organization_subscriptions.quote_id is
  'Acquisition commercial quote id used at Checkout.';
comment on column public.organization_subscriptions.trial_ends_at is
  'Stripe trial end timestamp when trial_period_days applied (≤500 units).';

-- docs/194 + docs/196 payment-method amendment (in-repo only).
-- Production has not applied this file. Amend in place rather than adding lineage.
-- Does not change any organization execution flag.

alter table public.financial_autopay_enrollments
  add column if not exists paused_reason text;

alter table public.financial_autopay_enrollments
  add column if not exists payment_method_type text;

alter table public.financial_autopay_enrollments
  drop constraint if exists financial_autopay_enrollments_payment_method_type_chk;

alter table public.financial_autopay_enrollments
  add constraint financial_autopay_enrollments_payment_method_type_chk
  check (
    payment_method_type is null
    or payment_method_type in ('card', 'us_bank_account')
  );

create index if not exists financial_autopay_enrollments_paused_reason_idx
  on public.financial_autopay_enrollments (organization_id, status, paused_reason);

alter table public.financial_module_settings
  add column if not exists tenant_ach_payments_enabled boolean not null default true;

alter table public.financial_module_settings
  add column if not exists tenant_card_payments_enabled boolean not null default true;

alter table public.financial_module_settings
  drop constraint if exists financial_module_settings_accepted_methods_chk;

alter table public.financial_module_settings
  add constraint financial_module_settings_accepted_methods_chk
  check (
    stripe_payment_execution_enabled is not true
    or tenant_ach_payments_enabled
    or tenant_card_payments_enabled
  );

alter table public.financial_payments
  drop constraint if exists financial_payments_status_check;

alter table public.financial_payments
  add constraint financial_payments_status_check
  check (
    status in (
      'pending',
      'processing',
      'succeeded',
      'failed',
      'refunded',
      'partially_refunded'
    )
  );

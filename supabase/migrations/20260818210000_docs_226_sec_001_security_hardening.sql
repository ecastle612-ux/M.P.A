-- docs/226 SEC-001 pre-onboarding security hardening
-- Additive / reversible. Does not delete webhook history or customer rows.
-- Safe on origin/main: Production-only tables are gated with to_regclass.
-- Do not apply to Production until Stage 2 Owner authorization.

-- ---------------------------------------------------------------------------
-- Durable shared rate-limit buckets (service role only)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_rate_limit_buckets (
  bucket_key text primary key,
  window_started_at timestamptz not null default timezone('utc', now()),
  count integer not null default 1 check (count >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.platform_rate_limit_buckets is
  'SEC-001 durable application rate-limit windows. No client policies. Service-role RPC only.';

alter table public.platform_rate_limit_buckets enable row level security;

revoke all on table public.platform_rate_limit_buckets from public, anon, authenticated;

create or replace function public.consume_platform_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_ms integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_window interval;
begin
  if p_bucket_key is null or length(trim(p_bucket_key)) = 0 then
    return false;
  end if;
  if p_limit is null or p_limit < 1 then
    return false;
  end if;
  if p_window_ms is null or p_window_ms < 1000 then
    return false;
  end if;

  v_window := make_interval(secs => p_window_ms / 1000.0);

  insert into public.platform_rate_limit_buckets (bucket_key, window_started_at, count, updated_at)
  values (trim(p_bucket_key), timezone('utc', now()), 1, timezone('utc', now()))
  on conflict (bucket_key) do update
  set
    count = case
      when public.platform_rate_limit_buckets.window_started_at <= timezone('utc', now()) - v_window then 1
      else public.platform_rate_limit_buckets.count + 1
    end,
    window_started_at = case
      when public.platform_rate_limit_buckets.window_started_at <= timezone('utc', now()) - v_window then timezone('utc', now())
      else public.platform_rate_limit_buckets.window_started_at
    end,
    updated_at = timezone('utc', now())
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_platform_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_platform_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- P0: SignWell webhook events — no client mutation
-- ---------------------------------------------------------------------------

drop policy if exists signwell_webhook_events_manage on public.signwell_webhook_events;
drop policy if exists signwell_webhook_events_operator_select on public.signwell_webhook_events;

revoke all on table public.signwell_webhook_events from public, anon, authenticated;

grant select on table public.signwell_webhook_events to authenticated;

create policy signwell_webhook_events_operator_select
  on public.signwell_webhook_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.platform_operators po
      where po.user_id = auth.uid() and po.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- Identical NULL-org FOR ALL write hole (Production-only table)
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.auth_support_escalations') is not null then
    execute 'drop policy if exists auth_support_escalations_manage_manager on public.auth_support_escalations';
    execute 'revoke all on table public.auth_support_escalations from public, anon, authenticated';
    execute 'grant select on table public.auth_support_escalations to authenticated';
    execute $policy$
      create policy auth_support_escalations_operator_or_manager_select
        on public.auth_support_escalations
        for select
        to authenticated
        using (
          organization_id is not null
          and (
            public.is_org_manager(organization_id)
            or exists (
              select 1 from public.platform_operators po
              where po.user_id = auth.uid() and po.status = 'active'
            )
          )
        )
    $policy$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Leftover client DML grants on other webhook-event tables
-- ---------------------------------------------------------------------------

do $$
declare
  webhook_table text;
begin
  foreach webhook_table in array array[
    'saas_stripe_webhook_events',
    'saas_webhook_events',
    'financial_stripe_webhook_events',
    'integrations_webhook_events'
  ]
  loop
    if to_regclass('public.' || webhook_table) is not null then
      execute format('revoke insert, update, delete, truncate, references, trigger on table public.%I from public, anon, authenticated', webhook_table);
      execute format('revoke all on table public.%I from public, anon', webhook_table);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- P1: PM plan + routing rule writes must match can_manage_facility_ops
-- Tables exist on Production / later FO-EFF branches; no-op on current main.
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.facility_pm_plans') is not null then
    execute 'drop policy if exists facility_pm_plans_org_all on public.facility_pm_plans';
    execute 'drop policy if exists facility_pm_plans_select_authorized on public.facility_pm_plans';
    execute 'drop policy if exists facility_pm_plans_write_authorized on public.facility_pm_plans';
    execute $policy$
      create policy facility_pm_plans_select_authorized
        on public.facility_pm_plans
        for select
        to authenticated
        using (
          public.can_manage_facility_ops(organization_id)
          or (
            public.is_maintenance_technician(organization_id)
            and public.org_allows_work_surface(organization_id, 'facility')
          )
        )
    $policy$;
    execute $policy$
      create policy facility_pm_plans_write_authorized
        on public.facility_pm_plans
        for all
        to authenticated
        using (public.can_manage_facility_ops(organization_id))
        with check (public.can_manage_facility_ops(organization_id))
    $policy$;
  end if;

  if to_regclass('public.facility_pm_occurrences') is not null then
    execute 'drop policy if exists facility_pm_occurrences_org_all on public.facility_pm_occurrences';
    execute 'drop policy if exists facility_pm_occurrences_select_authorized on public.facility_pm_occurrences';
    execute 'drop policy if exists facility_pm_occurrences_write_authorized on public.facility_pm_occurrences';
    execute $policy$
      create policy facility_pm_occurrences_select_authorized
        on public.facility_pm_occurrences
        for select
        to authenticated
        using (
          public.can_manage_facility_ops(organization_id)
          or (
            public.is_maintenance_technician(organization_id)
            and public.org_allows_work_surface(organization_id, 'facility')
          )
        )
    $policy$;
    execute $policy$
      create policy facility_pm_occurrences_write_authorized
        on public.facility_pm_occurrences
        for all
        to authenticated
        using (public.can_manage_facility_ops(organization_id))
        with check (public.can_manage_facility_ops(organization_id))
    $policy$;
  end if;

  if to_regclass('public.facility_assignment_rules') is not null then
    execute 'drop policy if exists facility_assignment_rules_org_all on public.facility_assignment_rules';
    execute 'drop policy if exists facility_assignment_rules_manage_authorized on public.facility_assignment_rules';
    execute $policy$
      create policy facility_assignment_rules_manage_authorized
        on public.facility_assignment_rules
        for all
        to authenticated
        using (public.can_manage_facility_ops(organization_id))
        with check (public.can_manage_facility_ops(organization_id))
    $policy$;
  end if;

  if to_regclass('public.facility_assignment_rule_evaluations') is not null then
    execute 'drop policy if exists facility_assignment_evals_org_all on public.facility_assignment_rule_evaluations';
    execute 'drop policy if exists facility_assignment_evals_select_authorized on public.facility_assignment_rule_evaluations';
    execute 'drop policy if exists facility_assignment_evals_insert_authorized on public.facility_assignment_rule_evaluations';
    execute $policy$
      create policy facility_assignment_evals_select_authorized
        on public.facility_assignment_rule_evaluations
        for select
        to authenticated
        using (public.can_manage_facility_ops(organization_id))
    $policy$;
    execute $policy$
      create policy facility_assignment_evals_insert_authorized
        on public.facility_assignment_rule_evaluations
        for insert
        to authenticated
        with check (public.can_manage_facility_ops(organization_id))
    $policy$;
  end if;
end $$;

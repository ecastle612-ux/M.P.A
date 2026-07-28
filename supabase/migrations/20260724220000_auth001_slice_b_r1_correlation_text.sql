-- AUTH-001 Slice B remediation (R1):
-- Allow non-UUID external correlation identifiers on the OPS outbox
-- (Stripe evt_…, idempotency keys) while preserving existing UUID values.

alter table public.event_domain_events
  alter column correlation_id drop default;

alter table public.event_domain_events
  alter column correlation_id type text using correlation_id::text;

alter table public.event_domain_events
  alter column correlation_id set default (gen_random_uuid())::text;

alter table public.event_domain_events
  alter column causation_id type text using causation_id::text;

comment on column public.event_domain_events.correlation_id is
  'Workflow / external event correlation. Accepts UUID or opaque strings (Stripe evt_…, idempotency keys). Not a uniqueness key — event_id remains PK.';

comment on column public.event_domain_events.causation_id is
  'Optional causing event / external id (UUID or opaque string).';

-- OA-02 RPC: parameter types must match column types.
drop function if exists public.ops_record_maintenance_activity_with_outbox(
  uuid, uuid, text, text, jsonb, uuid, text, uuid, integer, timestamptz, jsonb, jsonb, uuid, uuid, jsonb, text, text
);

create or replace function public.ops_record_maintenance_activity_with_outbox(
  p_organization_id uuid,
  p_work_order_id uuid,
  p_legacy_event_type text,
  p_summary text,
  p_details jsonb,
  p_actor_user_id uuid,
  p_catalog_event_type text,
  p_event_id uuid,
  p_event_version integer,
  p_occurred_at timestamptz,
  p_actor jsonb,
  p_subject jsonb,
  p_correlation_id text,
  p_causation_id text,
  p_payload jsonb,
  p_visibility text,
  p_sensitivity text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event_id uuid := coalesce(p_event_id, gen_random_uuid());
begin
  if p_catalog_event_type is null or length(trim(p_catalog_event_type)) = 0 then
    raise exception 'catalog event type is required for same-TX outbox emit';
  end if;

  insert into public.maintenance_activity_events (
    organization_id,
    work_order_id,
    event_type,
    summary,
    details,
    actor_user_id
  ) values (
    p_organization_id,
    p_work_order_id,
    p_legacy_event_type,
    p_summary,
    coalesce(p_details, '{}'::jsonb),
    p_actor_user_id
  );

  insert into public.event_domain_events (
    event_id,
    event_type,
    event_version,
    occurred_at,
    organization_id,
    actor,
    subject,
    correlation_id,
    causation_id,
    payload,
    visibility,
    sensitivity,
    dispatch_status
  ) values (
    v_event_id,
    p_catalog_event_type,
    coalesce(p_event_version, 1),
    coalesce(p_occurred_at, timezone('utc', now())),
    p_organization_id,
    coalesce(p_actor, '{}'::jsonb),
    coalesce(p_subject, '{}'::jsonb),
    coalesce(nullif(trim(p_correlation_id), ''), gen_random_uuid()::text),
    nullif(trim(p_causation_id), ''),
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_visibility, 'ops'),
    coalesce(p_sensitivity, 'normal'),
    'pending'
  );

  return v_event_id;
end;
$$;

comment on function public.ops_record_maintenance_activity_with_outbox is
  'OPS-001 Slice A OA-02: insert maintenance_activity_events + event_domain_events in one transaction. correlation_id/causation_id accept text.';

revoke all on function public.ops_record_maintenance_activity_with_outbox(
  uuid, uuid, text, text, jsonb, uuid, text, uuid, integer, timestamptz, jsonb, jsonb, text, text, jsonb, text, text
) from public;
grant execute on function public.ops_record_maintenance_activity_with_outbox(
  uuid, uuid, text, text, jsonb, uuid, text, uuid, integer, timestamptz, jsonb, jsonb, text, text, jsonb, text, text
) to authenticated, service_role;

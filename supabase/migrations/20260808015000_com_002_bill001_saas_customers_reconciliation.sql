-- COM-002 / BILL-001 compatibility reconciliation (additive only).
-- Authoritative: single public.saas_customers table.
-- Preserves BILL-001 columns and rows; adds COM-002 columns required by Slice D.
-- Does not drop tables, delete data, or recreate saas_customers.

-- ---------------------------------------------------------------------------
-- 1) Add COM-002 columns (nullable first)
-- ---------------------------------------------------------------------------
alter table public.saas_customers
  add column if not exists stripe_customer_id text,
  add column if not exists checkout_session_id text,
  add column if not exists user_id uuid references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 2) Backfill COM-002 stripe id from BILL-001 external id (Stripe only)
-- ---------------------------------------------------------------------------
update public.saas_customers
set stripe_customer_id = external_customer_id
where stripe_customer_id is null
  and provider = 'stripe'
  and external_customer_id is not null
  and length(external_customer_id) > 0;

-- Legacy BILL-001 rows have no COM-002 checkout session; leave checkout_session_id null.
-- Slice D indexes allow nulls; COM-002 writers always set checkout_session_id.

-- ---------------------------------------------------------------------------
-- 3) Allow COM-002 to upsert customer before org bind (BILL-001 rows keep org ids)
-- ---------------------------------------------------------------------------
alter table public.saas_customers
  alter column organization_id drop not null;

-- ---------------------------------------------------------------------------
-- 4) Enforce COM-002 stripe_customer_id uniqueness after backfill
-- ---------------------------------------------------------------------------
alter table public.saas_customers
  alter column stripe_customer_id set not null;

create unique index if not exists saas_customers_stripe_customer_id_uidx
  on public.saas_customers (stripe_customer_id);

-- ---------------------------------------------------------------------------
-- 5) Bidirectional sync so BILL-001 and COM-002 writers stay compatible
--     - BILL-001 writes provider + external_customer_id
--     - COM-002 writes stripe_customer_id (+ checkout_session_id, email, user_id)
-- ---------------------------------------------------------------------------
create or replace function public.saas_customers_compat_sync()
returns trigger
language plpgsql
as $$
begin
  if new.provider is null or btrim(new.provider) = '' then
    new.provider := 'stripe';
  end if;

  -- BILL-001 → COM-002
  if (new.stripe_customer_id is null or btrim(new.stripe_customer_id) = '')
     and new.provider = 'stripe'
     and new.external_customer_id is not null
     and btrim(new.external_customer_id) <> '' then
    new.stripe_customer_id := new.external_customer_id;
  end if;

  -- COM-002 → BILL-001
  if (new.external_customer_id is null or btrim(new.external_customer_id) = '')
     and new.stripe_customer_id is not null
     and btrim(new.stripe_customer_id) <> '' then
    new.external_customer_id := new.stripe_customer_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_saas_customers_compat_sync on public.saas_customers;
create trigger trg_saas_customers_compat_sync
before insert or update on public.saas_customers
for each row
execute function public.saas_customers_compat_sync();

-- ---------------------------------------------------------------------------
-- 6) Helpful indexes used by COM-002 (idempotent with Slice D)
-- ---------------------------------------------------------------------------
create index if not exists saas_customers_email_idx
  on public.saas_customers (lower(email));

create index if not exists saas_customers_checkout_idx
  on public.saas_customers (checkout_session_id);

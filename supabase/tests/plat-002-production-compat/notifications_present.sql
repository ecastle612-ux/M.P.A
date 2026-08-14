-- Overlay: table exists (local/J6-shaped). Successor must tighten insert, not recreate the table.

create table public.maintenance_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  user_id uuid,
  body text
);

alter table public.maintenance_notifications enable row level security;

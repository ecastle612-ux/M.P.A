-- 15 lease_residents / 15 pm_residents / 15 leases / 14 invitations / FIN-OPS 18/11/1/11 shape.

insert into public.organizations (id, name) values
  ('a11ce002-0001-4000-8000-0000000000c2', 'Property Demo'),
  ('f88ee244-5343-4ddf-be48-15e96b9380ee', 'Receipt Org'),
  ('f8232926-149d-46b3-829f-c84b55378718', 'Dev Org'),
  ('90af697c-461f-4652-8dc2-2ccf43346e11', 'Ended Org');

insert into public.property_properties (id, organization_id, name) values
  ('a11ce002-0001-4000-8000-000000000101', 'a11ce002-0001-4000-8000-0000000000c2', 'Demo Property'),
  ('f88ee244-5343-4ddf-be48-15e96b938011', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'Receipt Property'),
  ('f8232926-149d-46b3-829f-c84b55378711', 'f8232926-149d-46b3-829f-c84b55378718', 'Dev Property'),
  ('90af697c-461f-4652-8dc2-2ccf43346e21', '90af697c-461f-4652-8dc2-2ccf43346e11', 'Ended Property');

insert into public.property_units (id, organization_id, property_id, unit_label) values
  ('a11ce002-0001-4000-8000-000000000201', 'a11ce002-0001-4000-8000-0000000000c2', 'a11ce002-0001-4000-8000-000000000101', '1A'),
  ('f88ee244-5343-4ddf-be48-15e96b938021', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'f88ee244-5343-4ddf-be48-15e96b938011', '2A'),
  ('90af697c-461f-4652-8dc2-2ccf43346e31', '90af697c-461f-4652-8dc2-2ccf43346e11', '90af697c-461f-4652-8dc2-2ccf43346e21', '3A');

insert into public.property_units (id, organization_id, property_id, unit_label)
select gen_random_uuid(), 'f8232926-149d-46b3-829f-c84b55378718', 'f8232926-149d-46b3-829f-c84b55378711', 'D' || g
from generate_series(1, 12) g;

-- UAT portal tenant
insert into public.pm_residents (
  id, organization_id, property_id, unit_id, email, user_id, portal_status, display_name
) values (
  'a11ce002-0001-4000-8000-000000000301',
  'a11ce002-0001-4000-8000-0000000000c2',
  'a11ce002-0001-4000-8000-000000000101',
  'a11ce002-0001-4000-8000-000000000201',
  'uat.tenant.property.demo@my-property-assistant.com',
  '6cde6423-ad9b-49fb-aadd-3ea93ec8b040',
  'active',
  'UAT Tenant'
);

insert into public.lease_agreements (
  id, organization_id, property_id, unit_id, resident_id, status, start_date, end_date
) values (
  'a11ce002-0001-4000-8000-000000000401',
  'a11ce002-0001-4000-8000-0000000000c2',
  'a11ce002-0001-4000-8000-000000000101',
  'a11ce002-0001-4000-8000-000000000201',
  'a11ce002-0001-4000-8000-000000000301',
  'active',
  '2026-08-14',
  '2027-08-14'
);

update public.pm_residents
set lease_id = 'a11ce002-0001-4000-8000-000000000401'
where id = 'a11ce002-0001-4000-8000-000000000301';

insert into public.lease_residents (
  id, organization_id, lease_id, user_id, email, display_name
) values (
  '1275cb2e-be3c-4626-91ff-a3e1a8eee2fd',
  'a11ce002-0001-4000-8000-0000000000c2',
  'a11ce002-0001-4000-8000-000000000401',
  '6cde6423-ad9b-49fb-aadd-3ea93ec8b040',
  'uat.tenant.property.demo@my-property-assistant.com',
  'UAT Tenant'
);

-- Receipt org resident (no user_id)
insert into public.pm_residents (
  id, organization_id, property_id, unit_id, email, display_name
) values (
  'caf3630d-8f86-4087-82da-6c9a68b2e62c',
  'f88ee244-5343-4ddf-be48-15e96b9380ee',
  'f88ee244-5343-4ddf-be48-15e96b938011',
  'f88ee244-5343-4ddf-be48-15e96b938021',
  'ep016.resident+1784535122511@example.com',
  'EP016'
);

insert into public.lease_agreements (
  id, organization_id, property_id, unit_id, resident_id, status, start_date, end_date
) values (
  '6a620af4-03de-4292-9b83-acec48d7573c',
  'f88ee244-5343-4ddf-be48-15e96b9380ee',
  'f88ee244-5343-4ddf-be48-15e96b938011',
  'f88ee244-5343-4ddf-be48-15e96b938021',
  'caf3630d-8f86-4087-82da-6c9a68b2e62c',
  'active',
  '2026-07-01',
  '2027-06-30'
);

insert into public.lease_residents (
  id, organization_id, lease_id, email, display_name
) values (
  'caf3630d-8f86-4087-82da-6c9a68b2e62c',
  'f88ee244-5343-4ddf-be48-15e96b9380ee',
  '6a620af4-03de-4292-9b83-acec48d7573c',
  'ep016.resident+1784535122511@example.com',
  'EP016'
);

-- Ended lease
insert into public.pm_residents (
  id, organization_id, property_id, unit_id, email, display_name
) values (
  'c4ca99d7-2803-4218-8339-6eb7dd930b53',
  '90af697c-461f-4652-8dc2-2ccf43346e11',
  '90af697c-461f-4652-8dc2-2ccf43346e21',
  '90af697c-461f-4652-8dc2-2ccf43346e31',
  'maya.lopez@example.com',
  'Maya'
);

insert into public.lease_agreements (
  id, organization_id, property_id, unit_id, resident_id, status, start_date, end_date
) values (
  '296383e8-11c4-4951-a083-cab96f613ee3',
  '90af697c-461f-4652-8dc2-2ccf43346e11',
  '90af697c-461f-4652-8dc2-2ccf43346e21',
  '90af697c-461f-4652-8dc2-2ccf43346e31',
  'c4ca99d7-2803-4218-8339-6eb7dd930b53',
  'ended',
  '2026-08-01',
  '2027-07-31'
);

insert into public.lease_residents (
  id, organization_id, lease_id, email, display_name
) values (
  'c4ca99d7-2803-4218-8339-6eb7dd930b53',
  '90af697c-461f-4652-8dc2-2ccf43346e11',
  '296383e8-11c4-4951-a083-cab96f613ee3',
  'maya.lopez@example.com',
  'Maya'
);

-- 12 remaining active unlinked residents
insert into public.pm_residents (id, organization_id, property_id, unit_id, email, display_name)
select
  ('00000000-0000-4000-8000-0000000000' || lpad(g::text, 2, '0'))::uuid,
  'f8232926-149d-46b3-829f-c84b55378718',
  'f8232926-149d-46b3-829f-c84b55378711',
  (select id from public.property_units where organization_id = 'f8232926-149d-46b3-829f-c84b55378718' order by unit_label limit 1 offset g - 1),
  'dev.resident.' || g || '@dev.mpa.local',
  'Dev ' || g
from generate_series(1, 12) g;

insert into public.lease_agreements (id, organization_id, property_id, unit_id, resident_id, status, start_date, end_date)
select
  ('00000000-0000-4000-8000-0000000001' || lpad(g::text, 2, '0'))::uuid,
  'f8232926-149d-46b3-829f-c84b55378718',
  'f8232926-149d-46b3-829f-c84b55378711',
  (select id from public.property_units where organization_id = 'f8232926-149d-46b3-829f-c84b55378718' order by unit_label limit 1 offset g - 1),
  ('00000000-0000-4000-8000-0000000000' || lpad(g::text, 2, '0'))::uuid,
  'active',
  '2025-01-01',
  '2025-12-31'
from generate_series(1, 12) g;

insert into public.lease_residents (id, organization_id, lease_id, email, display_name)
select
  ('00000000-0000-4000-8000-0000000000' || lpad(g::text, 2, '0'))::uuid,
  'f8232926-149d-46b3-829f-c84b55378718',
  ('00000000-0000-4000-8000-0000000001' || lpad(g::text, 2, '0'))::uuid,
  'dev.resident.' || g || '@dev.mpa.local',
  'Dev ' || g
from generate_series(1, 12) g;

insert into public.organization_memberships (organization_id, user_id, roles, status) values
  ('a11ce002-0001-4000-8000-0000000000c2', '6cde6423-ad9b-49fb-aadd-3ea93ec8b040', array['tenant']::text[], 'active'),
  ('a11ce002-0001-4000-8000-0000000000c2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', array['property_manager']::text[], 'active'),
  ('f88ee244-5343-4ddf-be48-15e96b9380ee', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', array['tenant']::text[], 'active');

insert into public.organization_invitations (organization_id, email, roles, status)
select 'a11ce002-0001-4000-8000-0000000000c2', 'invitee.' || g || '@example.com', array['property_manager']::text[], 'pending'
from generate_series(1, 14) g;

-- FIN-OPS 18/11/1/11
insert into public.financial_charges (id, organization_id, lease_id, amount, status, due_at)
select gen_random_uuid(), 'f8232926-149d-46b3-829f-c84b55378718', '00000000-0000-4000-8000-000000000101', 10 + g, 'open', '2026-08-01'
from generate_series(1, 16) g;

insert into public.financial_charges (id, organization_id, lease_id, amount, status, due_at) values
  ('f2a6d161-ab4e-4ca3-923a-de0955d86c7b', 'a11ce002-0001-4000-8000-0000000000c2', 'a11ce002-0001-4000-8000-000000000401', 17.16, 'open', '2026-08-16'),
  ('dc6aeed1-a834-4f56-bc02-331c4bf09c86', 'f88ee244-5343-4ddf-be48-15e96b9380ee', '6a620af4-03de-4292-9b83-acec48d7573c', 1.00, 'paid', '2026-07-23');

insert into public.financial_payments (id, organization_id, lease_id, amount, status, created_at)
select gen_random_uuid(), 'f8232926-149d-46b3-829f-c84b55378718', '00000000-0000-4000-8000-000000000101', 5, 'succeeded', '2026-07-01'::timestamptz
from generate_series(1, 10) g;

insert into public.financial_payments (id, organization_id, lease_id, amount, status, created_at) values
  ('1c047e5e-d7b9-4a49-8b0d-0284d90aa80d', 'f88ee244-5343-4ddf-be48-15e96b9380ee', '6a620af4-03de-4292-9b83-acec48d7573c', 1.00, 'succeeded', '2026-07-23 01:35:59.608404+00');

insert into public.financial_receipts (
  id, organization_id, payment_id, lease_id, resident_id, receipt_number, amount, currency, issued_at
) values (
  'a602c6cf-bb6e-46fd-83dc-b5ea6bb9a3e7',
  'f88ee244-5343-4ddf-be48-15e96b9380ee',
  '1c047e5e-d7b9-4a49-8b0d-0284d90aa80d',
  '6a620af4-03de-4292-9b83-acec48d7573c',
  'caf3630d-8f86-4087-82da-6c9a68b2e62c',
  'RCPT-MRWUB646-BD75',
  1.00,
  'usd',
  '2026-07-23 01:36:00.500715+00'
);

insert into public.financial_payment_allocations (organization_id, payment_id, charge_id, amount)
select 'f8232926-149d-46b3-829f-c84b55378718', p.id, c.id, 1
from (select id from public.financial_payments where organization_id = 'f8232926-149d-46b3-829f-c84b55378718' limit 10) p
cross join lateral (
  select id from public.financial_charges where organization_id = 'f8232926-149d-46b3-829f-c84b55378718' limit 1
) c;

insert into public.financial_payment_allocations (organization_id, payment_id, charge_id, amount) values
  ('f88ee244-5343-4ddf-be48-15e96b9380ee', '1c047e5e-d7b9-4a49-8b0d-0284d90aa80d', 'dc6aeed1-a834-4f56-bc02-331c4bf09c86', 1.00);

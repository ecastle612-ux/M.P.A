-- docs/157 M3 money + persona seed. Apply after M1, before M3B.

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333'),
  ('44444444-4444-4444-4444-444444444444'),
  ('55555555-5555-5555-5555-555555555555'),
  ('66666666-6666-6666-6666-666666666666'),
  ('77777777-7777-7777-7777-777777777777'),
  ('88888888-8888-8888-8888-888888888888'),
  ('99999999-9999-9999-9999-999999999999'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into public.organizations (id, name) values
  ('c0c0c0c0-0000-4000-8000-000000000001', 'UAT Complete'),
  ('c0c0c0c0-0000-4000-8000-000000000002', 'UAT PM'),
  ('c0c0c0c0-0000-4000-8000-000000000003', 'UAT FO'),
  ('f88ee244-5343-4ddf-be48-15e96b9380ee', 'Canopy Property Partners'),
  ('90af697c-461f-4652-8dc2-2ccf43346e11', 'PMX Workflow Org'),
  ('f8232926-149d-46b3-829f-c84b55378718', 'M.P.A. Development');

insert into public.organization_subscriptions (organization_id, sku_code, status) values
  ('c0c0c0c0-0000-4000-8000-000000000001', 'mpa_complete_platform', 'active'),
  ('c0c0c0c0-0000-4000-8000-000000000002', 'mpa_property_manager', 'active'),
  ('c0c0c0c0-0000-4000-8000-000000000003', 'mpa_facility_operations', 'active');

insert into public.organization_memberships (organization_id, user_id, roles, operating_scope) values
  ('c0c0c0c0-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', array['organization_admin'], 'both'),
  ('c0c0c0c0-0000-4000-8000-000000000001', '22222222-2222-2222-2222-222222222222', array['property_manager'], 'property_operations'),
  ('c0c0c0c0-0000-4000-8000-000000000001', '33333333-3333-3333-3333-333333333333', array['property_manager'], 'facility_operations'),
  ('c0c0c0c0-0000-4000-8000-000000000001', '66666666-6666-6666-6666-666666666666', array['tenant'], null),
  ('c0c0c0c0-0000-4000-8000-000000000001', '77777777-7777-7777-7777-777777777777', array['vendor'], null),
  ('c0c0c0c0-0000-4000-8000-000000000002', '44444444-4444-4444-4444-444444444444', array['property_manager'], null),
  ('c0c0c0c0-0000-4000-8000-000000000003', '55555555-5555-5555-5555-555555555555', array['property_manager'], null);

insert into public.property_properties (id, organization_id, name) values
  ('d0d0d0d0-0000-4000-8000-000000000001', 'c0c0c0c0-0000-4000-8000-000000000001', 'Complete House'),
  ('d0d0d0d0-0000-4000-8000-000000000002', 'c0c0c0c0-0000-4000-8000-000000000002', 'PM House'),
  ('d0d0d0d0-0000-4000-8000-000000000003', 'c0c0c0c0-0000-4000-8000-000000000003', 'FO House'),
  ('d0d0d0d0-0000-4000-8000-0000000000ca', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'Canopy House'),
  ('d0d0d0d0-0000-4000-8000-0000000000f1', '90af697c-461f-4652-8dc2-2ccf43346e11', 'PMX House'),
  ('d0d0d0d0-0000-4000-8000-0000000000de', 'f8232926-149d-46b3-829f-c84b55378718', 'Dev House');

insert into public.property_units (id, organization_id, property_id, unit_label) values
  ('e0e0e0e0-0000-4000-8000-0000000000a1', 'c0c0c0c0-0000-4000-8000-000000000001', 'd0d0d0d0-0000-4000-8000-000000000001', 'A'),
  ('e0e0e0e0-0000-4000-8000-0000000000b1', 'c0c0c0c0-0000-4000-8000-000000000001', 'd0d0d0d0-0000-4000-8000-000000000001', 'B'),
  ('e0e0e0e0-0000-4000-8000-0000000000a2', 'c0c0c0c0-0000-4000-8000-000000000002', 'd0d0d0d0-0000-4000-8000-000000000002', '1'),
  ('e0e0e0e0-0000-4000-8000-0000000000a3', 'c0c0c0c0-0000-4000-8000-000000000003', 'd0d0d0d0-0000-4000-8000-000000000003', '1'),
  ('e0e0e0e0-0000-4000-8000-0000000000ca', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', '1'),
  ('e0e0e0e0-0000-4000-8000-0000000000f1', '90af697c-461f-4652-8dc2-2ccf43346e11', 'd0d0d0d0-0000-4000-8000-0000000000f1', '1'),
  ('e0e0e0e0-0000-4000-8000-0000000000de', 'f8232926-149d-46b3-829f-c84b55378718', 'd0d0d0d0-0000-4000-8000-0000000000de', '1');

insert into public.lease_agreements (id, organization_id, property_id, unit_id, rent_amount) values
  ('f0f0f0f0-0000-4000-8000-0000000000a1', 'c0c0c0c0-0000-4000-8000-000000000001', 'd0d0d0d0-0000-4000-8000-000000000001', 'e0e0e0e0-0000-4000-8000-0000000000a1', 100),
  ('f0f0f0f0-0000-4000-8000-0000000000b1', 'c0c0c0c0-0000-4000-8000-000000000001', 'd0d0d0d0-0000-4000-8000-000000000001', 'e0e0e0e0-0000-4000-8000-0000000000b1', 100),
  ('f0f0f0f0-0000-4000-8000-0000000000a2', 'c0c0c0c0-0000-4000-8000-000000000002', 'd0d0d0d0-0000-4000-8000-000000000002', 'e0e0e0e0-0000-4000-8000-0000000000a2', 100),
  ('f0f0f0f0-0000-4000-8000-0000000000a3', 'c0c0c0c0-0000-4000-8000-000000000003', 'd0d0d0d0-0000-4000-8000-000000000003', 'e0e0e0e0-0000-4000-8000-0000000000a3', 100),
  ('f0f0f0f0-0000-4000-8000-0000000000ca', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'e0e0e0e0-0000-4000-8000-0000000000ca', 100),
  ('f0f0f0f0-0000-4000-8000-0000000000f1', '90af697c-461f-4652-8dc2-2ccf43346e11', 'd0d0d0d0-0000-4000-8000-0000000000f1', 'e0e0e0e0-0000-4000-8000-0000000000f1', 100),
  ('f0f0f0f0-0000-4000-8000-0000000000de', 'f8232926-149d-46b3-829f-c84b55378718', 'd0d0d0d0-0000-4000-8000-0000000000de', 'e0e0e0e0-0000-4000-8000-0000000000de', 100);

insert into public.lease_residents (id, organization_id, lease_id, user_id, display_name, email) values
  ('a0a0a0a0-0000-4000-8000-0000000000a1', 'c0c0c0c0-0000-4000-8000-000000000001', 'f0f0f0f0-0000-4000-8000-0000000000a1', '88888888-8888-8888-8888-888888888888', 'Resident A', 'a@example.test'),
  ('a0a0a0a0-0000-4000-8000-0000000000b1', 'c0c0c0c0-0000-4000-8000-000000000001', 'f0f0f0f0-0000-4000-8000-0000000000b1', '99999999-9999-9999-9999-999999999999', 'Resident B', 'b@example.test');

insert into public.pm_residents (id, organization_id, email, user_id, display_name) values
  ('b0b0b0b0-0000-4000-8000-0000000000a1', 'c0c0c0c0-0000-4000-8000-000000000001', 'a@example.test', '88888888-8888-8888-8888-888888888888', 'Resident A');

insert into public.vendor_vendors (id, organization_id, user_id) values
  ('abababab-0000-4000-8000-0000000000ca', 'f88ee244-5343-4ddf-be48-15e96b9380ee', '77777777-7777-7777-7777-777777777777'),
  ('abababab-0000-4000-8000-000000000001', 'c0c0c0c0-0000-4000-8000-000000000001', '77777777-7777-7777-7777-777777777777');

-- Canopy 4 / 4951 / 1651 / 3300
insert into public.rent_charges (id, organization_id, property_id, lease_id, amount, amount_paid) values
  ('01000000-0000-4000-8000-0000000000c1', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'f0f0f0f0-0000-4000-8000-0000000000ca', 1651.00, 1651.00),
  ('01000000-0000-4000-8000-0000000000c2', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'f0f0f0f0-0000-4000-8000-0000000000ca', 1100.00, 0),
  ('01000000-0000-4000-8000-0000000000c3', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'f0f0f0f0-0000-4000-8000-0000000000ca', 1100.00, 0),
  ('01000000-0000-4000-8000-0000000000c4', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'f0f0f0f0-0000-4000-8000-0000000000ca', 1100.00, 0);

insert into public.financial_charges (
  id, organization_id, property_id, lease_id, charge_type, label, amount, amount_paid, currency, status, due_at
) values
  ('01000000-0000-4000-8000-0000000000c1', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'f0f0f0f0-0000-4000-8000-0000000000ca', 'rent', 'c1', 1651.00, 1651.00, 'USD', 'paid', current_date),
  ('01000000-0000-4000-8000-0000000000c2', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'f0f0f0f0-0000-4000-8000-0000000000ca', 'rent', 'c2', 1100.00, 0, 'USD', 'open', current_date),
  ('01000000-0000-4000-8000-0000000000c3', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'f0f0f0f0-0000-4000-8000-0000000000ca', 'rent', 'c3', 1100.00, 0, 'USD', 'open', current_date),
  ('01000000-0000-4000-8000-0000000000c4', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'f0f0f0f0-0000-4000-8000-0000000000ca', 'rent', 'c4', 1100.00, 0, 'USD', 'open', current_date);

-- PMX 1 / 1500 / 500 / 1000
insert into public.rent_charges (id, organization_id, property_id, lease_id, amount, amount_paid) values
  ('02000000-0000-4000-8000-0000000000aa', '90af697c-461f-4652-8dc2-2ccf43346e11', 'd0d0d0d0-0000-4000-8000-0000000000f1', 'f0f0f0f0-0000-4000-8000-0000000000f1', 1500.00, 500.00);

insert into public.financial_charges (
  id, organization_id, property_id, lease_id, charge_type, label, amount, amount_paid, currency, status, due_at
) values
  ('02000000-0000-4000-8000-0000000000aa', '90af697c-461f-4652-8dc2-2ccf43346e11', 'd0d0d0d0-0000-4000-8000-0000000000f1', 'f0f0f0f0-0000-4000-8000-0000000000f1', 'rent', 'p1', 1500.00, 500.00, 'USD', 'partially_paid', current_date);

-- Development 12 / 18240 / 8960 / 9280  (8 x 1120 paid + 4 x 2320 open)
insert into public.rent_charges (id, organization_id, property_id, lease_id, amount, amount_paid)
select
  ('03000000-0000-4000-8000-0000000000' || lpad(g::text, 2, '0'))::uuid,
  'f8232926-149d-46b3-829f-c84b55378718',
  'd0d0d0d0-0000-4000-8000-0000000000de',
  'f0f0f0f0-0000-4000-8000-0000000000de',
  case when g <= 8 then 1120.00 else 2320.00 end,
  case when g <= 8 then 1120.00 else 0 end
from generate_series(1, 12) g;

insert into public.financial_charges (
  id, organization_id, property_id, lease_id, charge_type, label, amount, amount_paid, currency, status, due_at
)
select
  ('03000000-0000-4000-8000-0000000000' || lpad(g::text, 2, '0'))::uuid,
  'f8232926-149d-46b3-829f-c84b55378718',
  'd0d0d0d0-0000-4000-8000-0000000000de',
  'f0f0f0f0-0000-4000-8000-0000000000de',
  'rent',
  'd' || g::text,
  case when g <= 8 then 1120.00 else 2320.00 end,
  case when g <= 8 then 1120.00 else 0 end,
  'USD',
  case when g <= 8 then 'paid' else 'open' end,
  current_date
from generate_series(1, 12) g;

-- 11 payments / 11111 (Canopy 1.00 + 1650.00, PMX 500.00, Development 8 x 1120.00)
insert into public.payments (id, organization_id, amount) values
  ('11000000-0000-4000-8000-0000000000c0', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 1.00),
  ('11000000-0000-4000-8000-0000000000c1', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 1650.00),
  ('11000000-0000-4000-8000-0000000000aa', '90af697c-461f-4652-8dc2-2ccf43346e11', 500.00);

insert into public.payments (id, organization_id, amount)
select
  ('11000000-0000-4000-8000-0000000000' || lpad(g::text, 2, '0'))::uuid,
  'f8232926-149d-46b3-829f-c84b55378718',
  1120.00
from generate_series(1, 8) g;

insert into public.financial_payments (
  id, organization_id, property_id, lease_id, amount, currency, status, method
) values
  ('11000000-0000-4000-8000-0000000000c0', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'f0f0f0f0-0000-4000-8000-0000000000ca', 1.00, 'USD', 'succeeded', 'manual_other'),
  ('11000000-0000-4000-8000-0000000000c1', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'd0d0d0d0-0000-4000-8000-0000000000ca', 'f0f0f0f0-0000-4000-8000-0000000000ca', 1650.00, 'USD', 'succeeded', 'manual_other'),
  ('11000000-0000-4000-8000-0000000000aa', '90af697c-461f-4652-8dc2-2ccf43346e11', 'd0d0d0d0-0000-4000-8000-0000000000f1', 'f0f0f0f0-0000-4000-8000-0000000000f1', 500.00, 'USD', 'succeeded', 'manual_other');

insert into public.financial_payments (
  id, organization_id, property_id, lease_id, amount, currency, status, method
)
select
  ('11000000-0000-4000-8000-0000000000' || lpad(g::text, 2, '0'))::uuid,
  'f8232926-149d-46b3-829f-c84b55378718',
  'd0d0d0d0-0000-4000-8000-0000000000de',
  'f0f0f0f0-0000-4000-8000-0000000000de',
  1120.00, 'USD', 'succeeded', 'manual_other'
from generate_series(1, 8) g;

insert into public.financial_payment_allocations (organization_id, payment_id, charge_id, amount) values
  ('f88ee244-5343-4ddf-be48-15e96b9380ee', '11000000-0000-4000-8000-0000000000c0', '01000000-0000-4000-8000-0000000000c1', 1.00),
  ('f88ee244-5343-4ddf-be48-15e96b9380ee', '11000000-0000-4000-8000-0000000000c1', '01000000-0000-4000-8000-0000000000c1', 1650.00),
  ('90af697c-461f-4652-8dc2-2ccf43346e11', '11000000-0000-4000-8000-0000000000aa', '02000000-0000-4000-8000-0000000000aa', 500.00);

insert into public.financial_payment_allocations (organization_id, payment_id, charge_id, amount)
select
  'f8232926-149d-46b3-829f-c84b55378718',
  ('11000000-0000-4000-8000-0000000000' || lpad(g::text, 2, '0'))::uuid,
  ('03000000-0000-4000-8000-0000000000' || lpad(g::text, 2, '0'))::uuid,
  1120.00
from generate_series(1, 8) g;

insert into public.vendor_invoices (id, organization_id, amount) values
  ('21000000-0000-4000-8000-0000000000ca', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 125.50);

insert into public.financial_vendor_invoices (
  id, organization_id, vendor_id, invoice_number, amount, currency, status
) values (
  '21000000-0000-4000-8000-0000000000ca',
  'f88ee244-5343-4ddf-be48-15e96b9380ee',
  'abababab-0000-4000-8000-0000000000ca',
  'july-canopy',
  125.50,
  'USD',
  'paid'
);

insert into public.financial_module_settings (organization_id) values
  ('c0c0c0c0-0000-4000-8000-000000000001'),
  ('c0c0c0c0-0000-4000-8000-000000000002');

insert into public.financial_connect_accounts (organization_id, status) values
  ('c0c0c0c0-0000-4000-8000-000000000001', 'not_started'),
  ('c0c0c0c0-0000-4000-8000-000000000002', 'not_started');

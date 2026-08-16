-- Production-shaped M.P.A. Development July snapshot for docs/152 M2D tests.
-- Uses the live Development UUIDs. Synthetic demo emails only.
-- Also seeds Canopy/PMX sentinel rows that M2D must not touch.

insert into public.organizations (id, name) values
  ('f8232926-149d-46b3-829f-c84b55378718', 'M.P.A. Development'),
  ('f88ee244-5343-4ddf-be48-15e96b9380ee', 'Canopy Property Partners'),
  ('90af697c-461f-4652-8dc2-2ccf43346e11', 'PMX Workflow Org');

insert into public.property_properties (id, organization_id) values
  ('737977ae-1f08-4e4e-8368-545e91f05fac', 'f8232926-149d-46b3-829f-c84b55378718'),
  ('d22cb503-eebf-436f-906d-503fe61207a4', 'f8232926-149d-46b3-829f-c84b55378718'),
  ('5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', 'f8232926-149d-46b3-829f-c84b55378718'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000001', 'f88ee244-5343-4ddf-be48-15e96b9380ee'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000001', '90af697c-461f-4652-8dc2-2ccf43346e11');

insert into public.units (
  id, organization_id, property_id, unit_number, unit_label, occupancy_status, status
) values
  ('766d0b17-5196-41e2-aa40-d0048bc33c87', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '001', 'Unit 1', 'occupied', 'active'),
  ('a8259856-39aa-42f4-9db3-43870243f790', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '002', 'Unit 2', 'occupied', 'active'),
  ('93033440-87eb-4919-93b8-c8b4b09b6f69', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '003', 'Unit 3', 'occupied', 'active'),
  ('fe82322c-d96f-4c43-94a9-13c8accedd5d', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '004', 'Unit 4', 'occupied', 'active'),
  ('9e345d47-1d11-4d5c-b4ff-164cfaf81eb0', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '005', 'Unit 5', 'occupied', 'active'),
  ('8f02b5b5-1935-4a84-8d28-237dcbabd38e', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '006', 'Unit 6', 'occupied', 'active'),
  ('09897ea5-e85f-423d-b8bf-d66f32d63e11', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '007', 'Unit 7', 'occupied', 'active'),
  ('61ddf528-832d-4730-b788-249344f4c9fb', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '008', 'Unit 8', 'occupied', 'active'),
  ('6c1cb9e3-fb36-474a-b600-ba13f7258dc2', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '001', 'Unit 1', 'occupied', 'active'),
  ('03dc55de-6395-41cf-b187-e36e18e2d307', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '002', 'Unit 2', 'occupied', 'active'),
  ('2649465e-1894-4c19-b699-457c8570a7f3', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '003', 'Unit 3', 'occupied', 'active'),
  ('e24d173b-bd7b-4b20-97f2-cc83d146d34e', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '004', 'Unit 4', 'occupied', 'active'),
  ('8e594a8a-fe21-4b71-8d3a-f0defcc460d4', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '005', 'Unit 5', 'vacant_ready', 'active'),
  ('21defc5d-0e55-4cf2-9606-f1f251127428', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '006', 'Unit 6', 'vacant_ready', 'active'),
  ('b3a62e2f-6780-4a3b-a57f-7f3af7678ac5', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '007', 'Unit 7', 'vacant_ready', 'active'),
  ('4f3dec63-bf0d-4a82-b45f-4f0e17fd3a62', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '008', 'Unit 8', 'vacant_ready', 'active'),
  ('9e88fc4f-c785-462f-98bb-770f0c5a4570', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '001', 'Unit 1', 'vacant_ready', 'active'),
  ('d88cbeb6-eaa6-46a2-a0c2-e5d7f237f05a', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '002', 'Unit 2', 'vacant_ready', 'active'),
  ('261524d5-c2d6-4d4b-9149-8b86ac3b5633', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '003', 'Unit 3', 'vacant_ready', 'active'),
  ('a87fb591-d655-4a85-9b65-e9788337417f', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '004', 'Unit 4', 'vacant_ready', 'active'),
  ('d2c1a9ed-a555-437b-90c5-032a0e2da3de', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '005', 'Unit 5', 'vacant_ready', 'active'),
  ('ef390c04-4586-430c-96fe-25b3df117f04', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '006', 'Unit 6', 'vacant_ready', 'active'),
  ('6724c270-ad9b-430c-8585-2b83e1d181de', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '007', 'Unit 7', 'vacant_ready', 'active'),
  ('3940ba85-f1c4-474b-8309-3a118c94d40e', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '008', 'Unit 8', 'vacant_ready', 'active'),
  ('cccccccc-cccc-4ccc-8ccc-000000000001', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', '101', 'Canopy 101', 'occupied', 'active'),
  ('dddddddd-dddd-4ddd-8ddd-000000000001', '90af697c-461f-4652-8dc2-2ccf43346e11', 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001', '201', 'PMX 201', 'occupied', 'active');

insert into public.property_units (id, organization_id, property_id, unit_label, status)
select id, organization_id, property_id, unit_label, 'available'
from public.units
where property_id = '737977ae-1f08-4e4e-8368-545e91f05fac';

insert into public.property_units (id, organization_id, property_id, unit_label, status) values
  ('cccccccc-cccc-4ccc-8ccc-000000000001', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', 'Canopy 101', 'occupied'),
  ('dddddddd-dddd-4ddd-8ddd-000000000001', '90af697c-461f-4652-8dc2-2ccf43346e11', 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001', 'PMX 201', 'occupied');

insert into public.tenants (
  id, organization_id, property_id, unit_id, first_name, last_name, email, status
) values
  ('2f443503-b901-4d96-bdf6-8fb04bb2cfef', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '766d0b17-5196-41e2-aa40-d0048bc33c87', 'Avery', 'Brooks', 'avery.brooks@dev.mpa.local', 'active'),
  ('b17e92f9-52ee-4a15-bb58-2a2da488decd', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', 'a8259856-39aa-42f4-9db3-43870243f790', 'Jordan', 'Chen', 'jordan.chen@dev.mpa.local', 'active'),
  ('ce8d6c0b-5128-44e9-bb8e-b5dc0772c68c', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '93033440-87eb-4919-93b8-c8b4b09b6f69', 'Taylor', 'Diaz', 'taylor.diaz@dev.mpa.local', 'active'),
  ('5d3c3afa-919c-4a93-8c12-9b74d8262741', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', 'fe82322c-d96f-4c43-94a9-13c8accedd5d', 'Morgan', 'Ellis', 'morgan.ellis@dev.mpa.local', 'active'),
  ('fc9b6cec-3f1f-4f17-9d31-ca07061899ac', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '9e345d47-1d11-4d5c-b4ff-164cfaf81eb0', 'Riley', 'Foster', 'riley.foster@dev.mpa.local', 'active'),
  ('281486d5-cfed-4ce9-bba4-4667401fd559', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '8f02b5b5-1935-4a84-8d28-237dcbabd38e', 'Casey', 'Garcia', 'casey.garcia@dev.mpa.local', 'active'),
  ('120e4ae2-ae2d-453e-a3af-ee22ee1db4a3', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '09897ea5-e85f-423d-b8bf-d66f32d63e11', 'Quinn', 'Hayes', 'quinn.hayes@dev.mpa.local', 'active'),
  ('7ffbf72c-0c65-4c6c-aa32-e21fd8de8d7a', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '61ddf528-832d-4730-b788-249344f4c9fb', 'Hayden', 'Ibrahim', 'hayden.ibrahim@dev.mpa.local', 'active'),
  ('51b047bb-3d55-4516-ad82-399c027dda03', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '6c1cb9e3-fb36-474a-b600-ba13f7258dc2', 'Parker', 'Johnson', 'parker.johnson@dev.mpa.local', 'active'),
  ('c88f5430-3dfb-4712-8731-47f43f315950', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '03dc55de-6395-41cf-b187-e36e18e2d307', 'Reese', 'Kim', 'reese.kim@dev.mpa.local', 'active'),
  ('da94f51a-3991-4948-8872-4ca2cfa2b772', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '2649465e-1894-4c19-b699-457c8570a7f3', 'Cameron', 'Lopez', 'cameron.lopez@dev.mpa.local', 'active'),
  ('3153d61e-5784-4fe8-b962-c70a4149e7be', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', 'e24d173b-bd7b-4b20-97f2-cc83d146d34e', 'Dakota', 'Martin', 'dakota.martin@dev.mpa.local', 'active'),
  ('4c0a32bc-81ea-468e-bc39-fc4f55e53d30', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '8e594a8a-fe21-4b71-8d3a-f0defcc460d4', 'Skyler', 'Nguyen', 'skyler.nguyen@dev.mpa.local', 'active'),
  ('523317a4-790b-4c1a-a6d0-70a489ad3548', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '21defc5d-0e55-4cf2-9606-f1f251127428', 'Emerson', 'Owens', 'emerson.owens@dev.mpa.local', 'active'),
  ('3e539d9b-f166-4029-ad95-566ab0d6838f', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', 'b3a62e2f-6780-4a3b-a57f-7f3af7678ac5', 'Finley', 'Patel', 'finley.patel@dev.mpa.local', 'active'),
  ('5b1964a0-e796-4d3c-8b60-e530b4ad46b8', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '4f3dec63-bf0d-4a82-b45f-4f0e17fd3a62', 'Harper', 'Reed', 'harper.reed@dev.mpa.local', 'active'),
  ('9c45a71e-f5b2-49a3-baa8-a2c64ee79fd2', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '9e88fc4f-c785-462f-98bb-770f0c5a4570', 'Logan', 'Singh', 'logan.singh@dev.mpa.local', 'active'),
  ('e1d394a6-db87-447c-add1-f2b22567535f', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', 'd88cbeb6-eaa6-46a2-a0c2-e5d7f237f05a', 'Sage', 'Turner', 'sage.turner@dev.mpa.local', 'active'),
  ('eeeeeeee-eeee-4eee-8eee-000000000001', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', 'cccccccc-cccc-4ccc-8ccc-000000000001', 'Canopy', 'Sentinel', 'canopy.sentinel@fixture.test', 'active'),
  ('ffffffff-ffff-4fff-8fff-000000000001', '90af697c-461f-4652-8dc2-2ccf43346e11', 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001', 'dddddddd-dddd-4ddd-8ddd-000000000001', 'Pmx', 'Sentinel', 'pmx.sentinel@fixture.test', 'active');

insert into public.leases (
  id, organization_id, property_id, unit_id, status, start_date, end_date, rent_amount
) values
  ('f2f0367c-2a6e-48c0-a8e2-21db322d6ac5', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '766d0b17-5196-41e2-aa40-d0048bc33c87', 'active', '2025-07-01', '2026-06-30', 1300.00),
  ('dcf2faa2-16bc-4bad-83da-5b05d84aba90', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', 'a8259856-39aa-42f4-9db3-43870243f790', 'active', '2025-07-01', '2026-06-30', 1340.00),
  ('35e5bda1-a404-4823-9b16-aa84c92a35c5', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '93033440-87eb-4919-93b8-c8b4b09b6f69', 'active', '2025-07-01', '2026-06-30', 1380.00),
  ('a3925747-b945-4da6-9442-a5e1c544c98f', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', 'fe82322c-d96f-4c43-94a9-13c8accedd5d', 'active', '2025-07-01', '2026-06-30', 1420.00),
  ('e0596f95-99ca-48c8-be94-16b19eb329b4', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '9e345d47-1d11-4d5c-b4ff-164cfaf81eb0', 'active', '2025-07-01', '2026-06-30', 1460.00),
  ('e348d409-be75-465e-bdba-8d1168a0de74', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '8f02b5b5-1935-4a84-8d28-237dcbabd38e', 'active', '2025-07-01', '2026-06-30', 1500.00),
  ('c9cebe89-f0e8-4c74-bd0a-598401973238', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '09897ea5-e85f-423d-b8bf-d66f32d63e11', 'active', '2025-07-01', '2026-06-30', 1540.00),
  ('78af7e29-629b-478a-bd3f-e249b8ba865e', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '61ddf528-832d-4730-b788-249344f4c9fb', 'active', '2025-07-01', '2026-06-30', 1580.00),
  ('ff4e7e91-b26d-407a-a94e-e7b71c4c8fad', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '6c1cb9e3-fb36-474a-b600-ba13f7258dc2', 'active', '2025-07-01', '2026-06-30', 1620.00),
  ('0c4f5b19-7d0b-41e2-ae23-bb692273a4f0', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '03dc55de-6395-41cf-b187-e36e18e2d307', 'active', '2025-07-01', '2026-06-30', 1660.00),
  ('2d92aa58-538b-4d6e-8f24-a309888c428f', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '2649465e-1894-4c19-b699-457c8570a7f3', 'active', '2025-07-01', '2026-06-30', 1700.00),
  ('085aff65-15dc-4753-b560-5eec2b1fd10e', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', 'e24d173b-bd7b-4b20-97f2-cc83d146d34e', 'active', '2025-07-01', '2026-06-30', 1740.00),
  ('aaaaaaaa-aaaa-4aaa-8aaa-0000000000c1', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', 'cccccccc-cccc-4ccc-8ccc-000000000001', 'active', '2025-07-01', '2026-06-30', 100.00),
  ('bbbbbbbb-bbbb-4bbb-8bbb-0000000000c1', '90af697c-461f-4652-8dc2-2ccf43346e11', 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001', 'dddddddd-dddd-4ddd-8ddd-000000000001', 'active', '2025-07-01', '2026-06-30', 200.00);

insert into public.rent_charges (
  id, organization_id, property_id, unit_id, lease_id, tenant_id,
  charge_type, status, amount, amount_paid, due_date
) values
  ('3631997e-256e-4269-a470-7ef873b5d76d', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '766d0b17-5196-41e2-aa40-d0048bc33c87', 'f2f0367c-2a6e-48c0-a8e2-21db322d6ac5', '2f443503-b901-4d96-bdf6-8fb04bb2cfef', 'monthly_rent', 'paid', 1300.00, 1300.00, '2025-07-01'),
  ('c38053b1-621f-49bb-a2fb-33d621279ff5', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', 'a8259856-39aa-42f4-9db3-43870243f790', 'dcf2faa2-16bc-4bad-83da-5b05d84aba90', 'b17e92f9-52ee-4a15-bb58-2a2da488decd', 'monthly_rent', 'partial', 1340.00, 670.00, '2025-07-01'),
  ('6405eeca-afba-42e7-a077-ceccec85b6bd', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '93033440-87eb-4919-93b8-c8b4b09b6f69', '35e5bda1-a404-4823-9b16-aa84c92a35c5', 'ce8d6c0b-5128-44e9-bb8e-b5dc0772c68c', 'monthly_rent', 'overdue', 1380.00, 0.00, '2025-07-01'),
  ('8b52602f-ab90-4362-93d3-4f8770f32ec8', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', 'fe82322c-d96f-4c43-94a9-13c8accedd5d', 'a3925747-b945-4da6-9442-a5e1c544c98f', '5d3c3afa-919c-4a93-8c12-9b74d8262741', 'monthly_rent', 'paid', 1420.00, 1420.00, '2025-07-01'),
  ('888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '9e345d47-1d11-4d5c-b4ff-164cfaf81eb0', 'e0596f95-99ca-48c8-be94-16b19eb329b4', 'fc9b6cec-3f1f-4f17-9d31-ca07061899ac', 'monthly_rent', 'partial', 1460.00, 730.00, '2025-07-01'),
  ('d4fadeac-adf8-4ba0-a84a-76c9a9b41633', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '8f02b5b5-1935-4a84-8d28-237dcbabd38e', 'e348d409-be75-465e-bdba-8d1168a0de74', '281486d5-cfed-4ce9-bba4-4667401fd559', 'monthly_rent', 'overdue', 1500.00, 0.00, '2025-07-01'),
  ('f26190e0-b961-44c0-a7fe-b57873e2a26b', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '09897ea5-e85f-423d-b8bf-d66f32d63e11', 'c9cebe89-f0e8-4c74-bd0a-598401973238', '120e4ae2-ae2d-453e-a3af-ee22ee1db4a3', 'monthly_rent', 'paid', 1540.00, 1540.00, '2025-07-01'),
  ('daa44657-291b-4e76-a7c5-a1a312ad647a', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '61ddf528-832d-4730-b788-249344f4c9fb', '78af7e29-629b-478a-bd3f-e249b8ba865e', '7ffbf72c-0c65-4c6c-aa32-e21fd8de8d7a', 'monthly_rent', 'partial', 1580.00, 790.00, '2025-07-01'),
  ('ca4288cb-ebe9-4a8d-b7e3-5a8ba6f96fdc', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', '6c1cb9e3-fb36-474a-b600-ba13f7258dc2', 'ff4e7e91-b26d-407a-a94e-e7b71c4c8fad', '51b047bb-3d55-4516-ad82-399c027dda03', 'monthly_rent', 'overdue', 1620.00, 0.00, '2025-07-01'),
  ('de460536-d3c9-45c6-bfcd-4f14c42f3991', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '03dc55de-6395-41cf-b187-e36e18e2d307', '0c4f5b19-7d0b-41e2-ae23-bb692273a4f0', 'c88f5430-3dfb-4712-8731-47f43f315950', 'monthly_rent', 'paid', 1660.00, 1660.00, '2025-07-01'),
  ('7e07b737-bcb6-495a-aefd-f787cdb159e2', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '2649465e-1894-4c19-b699-457c8570a7f3', '2d92aa58-538b-4d6e-8f24-a309888c428f', 'da94f51a-3991-4948-8872-4ca2cfa2b772', 'monthly_rent', 'partial', 1700.00, 850.00, '2025-07-01'),
  ('5fada492-d95f-492c-b612-8126fcf63cc9', 'f8232926-149d-46b3-829f-c84b55378718', '5ea87ad9-0d9b-4af3-9775-e02f8e3ac25a', 'e24d173b-bd7b-4b20-97f2-cc83d146d34e', '085aff65-15dc-4753-b560-5eec2b1fd10e', '3153d61e-5784-4fe8-b962-c70a4149e7be', 'monthly_rent', 'overdue', 1740.00, 0.00, '2025-07-01'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-0000000000c2', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', 'cccccccc-cccc-4ccc-8ccc-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-0000000000c1', 'eeeeeeee-eeee-4eee-8eee-000000000001', 'monthly_rent', 'paid', 100.00, 100.00, '2025-07-01'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-0000000000c2', '90af697c-461f-4652-8dc2-2ccf43346e11', 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001', 'dddddddd-dddd-4ddd-8ddd-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-0000000000c1', 'ffffffff-ffff-4fff-8fff-000000000001', 'monthly_rent', 'paid', 200.00, 200.00, '2025-07-01');

insert into public.payments (
  id, organization_id, property_id, unit_id, lease_id, tenant_id, rent_charge_id,
  amount, status, payment_method, payment_date, metadata
) values
  ('19a8f5b4-cec6-44ef-ad24-acf068dae796', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '766d0b17-5196-41e2-aa40-d0048bc33c87', 'f2f0367c-2a6e-48c0-a8e2-21db322d6ac5', '2f443503-b901-4d96-bdf6-8fb04bb2cfef', '3631997e-256e-4269-a470-7ef873b5d76d', 1300.00, 'completed', 'manual', '2026-07-23', '{}'),
  ('c7e30693-c735-4ff4-a695-e06e51c1b741', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', 'a8259856-39aa-42f4-9db3-43870243f790', 'dcf2faa2-16bc-4bad-83da-5b05d84aba90', 'b17e92f9-52ee-4a15-bb58-2a2da488decd', 'c38053b1-621f-49bb-a2fb-33d621279ff5', 670.00, 'completed', 'manual', '2026-07-23', '{}'),
  ('e3588c84-e166-443a-8a62-0761b08e9e3f', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', 'fe82322c-d96f-4c43-94a9-13c8accedd5d', 'a3925747-b945-4da6-9442-a5e1c544c98f', '5d3c3afa-919c-4a93-8c12-9b74d8262741', '8b52602f-ab90-4362-93d3-4f8770f32ec8', 1420.00, 'completed', 'manual', '2026-07-23', '{}'),
  ('7237c52c-d84b-4798-812d-4780e6e03b70', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '9e345d47-1d11-4d5c-b4ff-164cfaf81eb0', 'e0596f95-99ca-48c8-be94-16b19eb329b4', 'fc9b6cec-3f1f-4f17-9d31-ca07061899ac', '888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e', 730.00, 'completed', 'manual', '2026-07-23', '{}'),
  ('592c9563-f570-4826-b897-484aaa62891d', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '09897ea5-e85f-423d-b8bf-d66f32d63e11', 'c9cebe89-f0e8-4c74-bd0a-598401973238', '120e4ae2-ae2d-453e-a3af-ee22ee1db4a3', 'f26190e0-b961-44c0-a7fe-b57873e2a26b', 1540.00, 'completed', 'manual', '2026-07-23', '{}'),
  ('ba15d07c-b12e-486a-a91e-50b4ccd300b3', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '61ddf528-832d-4730-b788-249344f4c9fb', '78af7e29-629b-478a-bd3f-e249b8ba865e', '7ffbf72c-0c65-4c6c-aa32-e21fd8de8d7a', 'daa44657-291b-4e76-a7c5-a1a312ad647a', 790.00, 'completed', 'manual', '2026-07-23', '{}'),
  ('73ad0ce3-8ef0-4984-965a-a07e1db83fba', 'f8232926-149d-46b3-829f-c84b55378718', '737977ae-1f08-4e4e-8368-545e91f05fac', '03dc55de-6395-41cf-b187-e36e18e2d307', '0c4f5b19-7d0b-41e2-ae23-bb692273a4f0', 'c88f5430-3dfb-4712-8731-47f43f315950', 'de460536-d3c9-45c6-bfcd-4f14c42f3991', 1660.00, 'completed', 'manual', '2026-07-23', '{}'),
  ('563e238d-e0fa-4c73-8cab-7c1e63e98e9e', 'f8232926-149d-46b3-829f-c84b55378718', 'd22cb503-eebf-436f-906d-503fe61207a4', '2649465e-1894-4c19-b699-457c8570a7f3', '2d92aa58-538b-4d6e-8f24-a309888c428f', 'da94f51a-3991-4948-8872-4ca2cfa2b772', '7e07b737-bcb6-495a-aefd-f787cdb159e2', 850.00, 'completed', 'manual', '2026-07-23', '{}'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-0000000000c3', 'f88ee244-5343-4ddf-be48-15e96b9380ee', 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', 'cccccccc-cccc-4ccc-8ccc-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-0000000000c1', 'eeeeeeee-eeee-4eee-8eee-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-0000000000c2', 100.00, 'completed', 'manual', '2026-07-23', '{}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-0000000000c3', '90af697c-461f-4652-8dc2-2ccf43346e11', 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001', 'dddddddd-dddd-4ddd-8ddd-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-0000000000c1', 'ffffffff-ffff-4fff-8fff-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-0000000000c2', 200.00, 'completed', 'manual', '2026-07-23', '{}');

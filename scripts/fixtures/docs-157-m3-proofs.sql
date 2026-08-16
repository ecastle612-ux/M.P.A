-- docs/157 M3 scratch proofs. Run after M3A/M3B apply.

do $$
declare
  preflight jsonb;
begin
  preflight := public.finance_m3_preflight();
  if not coalesce((preflight->>'ready')::boolean, false) then
    raise exception 'preflight expected READY, got %', preflight;
  end if;
  perform public.finance_m3_assert_preflight();

  perform set_config('mpa.finance_ops_maintenance', 'on', true);
  delete from public.financial_charges where id = '01000000-0000-4000-8000-0000000000c4';
  perform set_config('mpa.finance_ops_maintenance', '', true);
  preflight := public.finance_m3_preflight();
  if coalesce((preflight->>'ready')::boolean, false) then
    raise exception 'preflight must STOP on drift';
  end if;
  begin
    perform public.finance_m3_assert_preflight();
    raise exception 'assert_preflight must raise on drift';
  exception
    when others then
      if sqlerrm not like '%finance_m3_reconciliation_drift%' then
        raise;
      end if;
  end;
  perform set_config('mpa.finance_ops_maintenance', 'on', true);
  insert into public.financial_charges (
    id, organization_id, property_id, lease_id, charge_type, label, amount, amount_paid, currency, status, due_at
  ) values (
    '01000000-0000-4000-8000-0000000000c4',
    'f88ee244-5343-4ddf-be48-15e96b9380ee',
    'd0d0d0d0-0000-4000-8000-0000000000ca',
    'f0f0f0f0-0000-4000-8000-0000000000ca',
    'rent', 'c4', 1100.00, 0, 'USD', 'open', current_date
  );

  insert into public.financial_charges (
    id, organization_id, property_id, lease_id, resident_id, charge_type, label, amount, amount_paid, currency, status, due_at
  ) values
    ('c1000000-0000-4000-8000-0000000000a1', 'c0c0c0c0-0000-4000-8000-000000000001', 'd0d0d0d0-0000-4000-8000-000000000001', 'f0f0f0f0-0000-4000-8000-0000000000a1', 'a0a0a0a0-0000-4000-8000-0000000000a1', 'rent', 'A', 250.00, 50.00, 'USD', 'partially_paid', current_date),
    ('c1000000-0000-4000-8000-0000000000b1', 'c0c0c0c0-0000-4000-8000-000000000001', 'd0d0d0d0-0000-4000-8000-000000000001', 'f0f0f0f0-0000-4000-8000-0000000000b1', 'a0a0a0a0-0000-4000-8000-0000000000b1', 'rent', 'B', 250.00, 0, 'USD', 'open', current_date),
    ('c1000000-0000-4000-8000-0000000000a2', 'c0c0c0c0-0000-4000-8000-000000000002', 'd0d0d0d0-0000-4000-8000-000000000002', 'f0f0f0f0-0000-4000-8000-0000000000a2', null, 'rent', 'PM', 80.00, 0, 'USD', 'open', current_date),
    ('c1000000-0000-4000-8000-0000000000a3', 'c0c0c0c0-0000-4000-8000-000000000003', 'd0d0d0d0-0000-4000-8000-000000000003', 'f0f0f0f0-0000-4000-8000-0000000000a3', null, 'rent', 'FO', 80.00, 0, 'USD', 'open', current_date);

  insert into public.financial_payments (
    id, organization_id, property_id, lease_id, resident_id, amount, currency, status, method
  ) values (
    'c1100000-0000-4000-8000-0000000000a1',
    'c0c0c0c0-0000-4000-8000-000000000001',
    'd0d0d0d0-0000-4000-8000-000000000001',
    'f0f0f0f0-0000-4000-8000-0000000000a1',
    'a0a0a0a0-0000-4000-8000-0000000000a1',
    50.00, 'USD', 'succeeded', 'manual_other'
  );
  insert into public.financial_payment_allocations (organization_id, payment_id, charge_id, amount) values
    ('c0c0c0c0-0000-4000-8000-000000000001', 'c1100000-0000-4000-8000-0000000000a1', 'c1000000-0000-4000-8000-0000000000a1', 50.00);
  insert into public.financial_receipts (
    organization_id, payment_id, lease_id, resident_id, receipt_number, amount, currency
  ) values (
    'c0c0c0c0-0000-4000-8000-000000000001',
    'c1100000-0000-4000-8000-0000000000a1',
    'f0f0f0f0-0000-4000-8000-0000000000a1',
    'a0a0a0a0-0000-4000-8000-0000000000a1',
    'R-A', 50.00, 'USD'
  );
  insert into public.financial_ledger_entries (
    organization_id, lease_id, entry_type, direction, amount, currency, source_type, source_id, description, idempotency_key
  ) values (
    'c0c0c0c0-0000-4000-8000-000000000001',
    'f0f0f0f0-0000-4000-8000-0000000000a1',
    'charge', 'debit', 250.00, 'USD', 'financial_charges', 'c1000000-0000-4000-8000-0000000000a1', 'A charge', 'uat-a-charge'
  );
  insert into public.financial_vendor_invoices (
    organization_id, vendor_id, invoice_number, amount, currency, status
  ) values (
    'c0c0c0c0-0000-4000-8000-000000000001',
    'abababab-0000-4000-8000-000000000001',
    'staff-only', 10.00, 'USD', 'submitted'
  );
  perform set_config('mpa.finance_ops_maintenance', '', true);
end;
$$;

-- Persona helper + RLS matrix
do $$
declare
  n int;
  helper boolean;
  cap boolean;
begin
  -- Erick
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  helper := public.member_has_finance_capability('c0c0c0c0-0000-4000-8000-000000000001', 'pm.finance:read');
  if helper is not true then
    raise exception 'Erick helper must be true';
  end if;

  -- Sarah
  perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
  helper := public.member_has_finance_capability('c0c0c0c0-0000-4000-8000-000000000001', 'pm.finance:read');
  if helper is not true then
    raise exception 'Sarah helper must be true';
  end if;

  -- Mike: capability true, surface false, helper false
  perform set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
  cap := public.has_org_capability('c0c0c0c0-0000-4000-8000-000000000001', 'pm.finance:read');
  helper := public.member_has_finance_capability('c0c0c0c0-0000-4000-8000-000000000001', 'pm.finance:read');
  if cap is not true then
    raise exception 'Mike has_org_capability must be true';
  end if;
  if helper is not false then
    raise exception 'Mike helper must be false, got %', helper;
  end if;
  if public.member_allows_work_surface('c0c0c0c0-0000-4000-8000-000000000001', 'residential') is not false then
    raise exception 'Mike residential surface must be false';
  end if;

  -- PM SKU
  perform set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
  if public.member_has_finance_capability('c0c0c0c0-0000-4000-8000-000000000002', 'pm.finance:read') is not true then
    raise exception 'PM manager helper must be true';
  end if;

  -- FO SKU
  perform set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
  if public.member_has_finance_capability('c0c0c0c0-0000-4000-8000-000000000003', 'pm.finance:read') is not false then
    raise exception 'FO manager helper must be false';
  end if;

  -- Tenant / vendor staff finance
  perform set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);
  if public.member_has_finance_capability('c0c0c0c0-0000-4000-8000-000000000001', 'pm.finance:read') is not false then
    raise exception 'tenant staff helper must be false';
  end if;
  perform set_config('request.jwt.claim.sub', '77777777-7777-7777-7777-777777777777', true);
  if public.member_has_finance_capability('c0c0c0c0-0000-4000-8000-000000000001', 'pm.finance:read') is not false then
    raise exception 'vendor staff helper must be false';
  end if;

  -- Unsubscribed Canopy is SKU-denied even for Erick
  perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  if public.member_has_finance_capability('f88ee244-5343-4ddf-be48-15e96b9380ee', 'pm.finance:read') is not false then
    raise exception 'unsubscribed Canopy must be SKU-denied';
  end if;
end;
$$;

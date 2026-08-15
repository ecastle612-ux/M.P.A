-- PLAT-006 Slice A — additive pm.finance:* catalog + approved role grants.
-- Successor after Production ledger tip 20260815170604 (PLAT-005).
-- Additive / idempotent. No subscription, SKU, customer, billing, or RLS writes.
-- Does not delete July financial:* catalog or grant rows.
-- Narrow revoke: tenant/vendor pm.finance:read only (S0 hole under ADR-026 org-SKU entitlement).

-- ---------------------------------------------------------------------------
-- Catalog: existing FINANCE_CAPABILITIES keys (packages/shared/src/finance/permissions.ts)
-- ---------------------------------------------------------------------------

insert into public.permission_capabilities (key, namespace, description)
values
  ('pm.finance:read', 'pm.finance', 'Read Financial Operations surfaces, queues, and summaries'),
  ('pm.finance:charge.write', 'pm.finance', 'Create and void resident charges (S1+)'),
  ('pm.finance:payment.refund', 'pm.finance', 'Issue payment refunds (post-S2; not in S2 scope)'),
  ('pm.finance:late_fee.manage', 'pm.finance', 'Configure and post late fees (S2)'),
  ('pm.finance:vendor_invoice.review', 'pm.finance', 'Approve or reject vendor invoices (S2)'),
  ('pm.finance:vendor_payment.release', 'pm.finance', 'Schedule and mark vendor payments paid (S2)'),
  ('pm.finance:reports.read', 'pm.finance', 'Read property and owner financial summaries (S3)'),
  ('pm.finance:settings.manage', 'pm.finance', 'Manage FO settings and Connect readiness')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Approved grant matrix (docs/121 A.5)
-- organization_admin / property_manager: all eight
-- leasing_agent: pm.finance:read only
-- property_owner: read + reports.read
-- technician / tenant / vendor: none
-- ---------------------------------------------------------------------------

insert into public.role_permission_grants (role, capability_key)
values
  ('organization_admin', 'pm.finance:read'),
  ('organization_admin', 'pm.finance:charge.write'),
  ('organization_admin', 'pm.finance:payment.refund'),
  ('organization_admin', 'pm.finance:late_fee.manage'),
  ('organization_admin', 'pm.finance:vendor_invoice.review'),
  ('organization_admin', 'pm.finance:vendor_payment.release'),
  ('organization_admin', 'pm.finance:reports.read'),
  ('organization_admin', 'pm.finance:settings.manage'),
  ('property_manager', 'pm.finance:read'),
  ('property_manager', 'pm.finance:charge.write'),
  ('property_manager', 'pm.finance:payment.refund'),
  ('property_manager', 'pm.finance:late_fee.manage'),
  ('property_manager', 'pm.finance:vendor_invoice.review'),
  ('property_manager', 'pm.finance:vendor_payment.release'),
  ('property_manager', 'pm.finance:reports.read'),
  ('property_manager', 'pm.finance:settings.manage'),
  ('leasing_agent', 'pm.finance:read'),
  ('property_owner', 'pm.finance:read'),
  ('property_owner', 'pm.finance:reports.read')
on conflict (role, capability_key) do nothing;

-- S0 seeded tenant/vendor pm.finance:read. Under ADR-026 entitlement is org SKU,
-- so those grants would open staff /api/finance/* to portal roles. Resident billing
-- and checkout keep their own routes. Do not touch financial:* rows.
delete from public.role_permission_grants
where capability_key = 'pm.finance:read'
  and role in ('tenant', 'vendor');

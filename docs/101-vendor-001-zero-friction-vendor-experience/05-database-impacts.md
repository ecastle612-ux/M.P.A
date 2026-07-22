# 05 — Database Impacts

**Package:** VENDOR-001  
**Status:** Draft — Ready for Approval

---

## New / extended tables (proposed)

| Table | Purpose |
|-------|---------|
| `vendor_work_order_tokens` | token_hash, work_order_id, organization_id, expires_at, revoked_at, created_at |
| `vendor_job_sessions` | work_order_id, started_at, completed_at, device_meta, profile_id nullable |
| `vendor_payment_profiles` | organization_id, vendor_id nullable, email, phone, business_name, preferred_method |
| `vendor_invoices` | work_order_id, profile_id, amount, currency, file_media_id, status, submitted_at |
| `vendor_payments` | invoice_id, amount, method, reference, status, paid_at, recorded_by |

## Existing reuse

| Existing | Use |
|----------|-----|
| `maintenance_work_orders` | Status fields / timestamps |
| `maintenance_activity_events` | Audit trail |
| `maintenance_vendor_assignments` | Assignment binding for token mint |
| `vendors` | Org vendor directory link |
| `expenses` | Optional mirror for owner reports |
| Media upload tables | Photos + invoice files |

## RLS sketch

- Token mutations: **service role / Edge** after token verify — not broad anon table grants.  
- PM reads: `has_org_capability` for maintenance + new `vendor_pay:manage` (or reuse financial capability).  
- Profiles: org-scoped; vendor sees own profile only via token or authenticated portal.

## Migration rule

No Phase A code without a single migration implementing the approved schema subset for that phase.

# Architecture Review — BILL-001 / COM-002 Schema Reconciliation

| Field | Value |
|-------|--------|
| Package | COM-002 / BILL-001 Compatibility Reconciliation |
| Status | Authorized Design + Implementation |
| Scope | Production commercial schema only |
| Not in scope | ADR-019, Slice F, Capital Projects, UI redesign, business-logic rewrites |

## Problem

Production already applied **BILL-001** (`saas_customers`, `saas_subscriptions`, …).  
COM-002 Slice D uses `CREATE TABLE IF NOT EXISTS public.saas_customers (...)` with a **different** column set. Postgres keeps the BILL-001 table, then Slice D fails:

```text
ERROR: 42703: column "checkout_session_id" does not exist
```

## Decision (authoritative)

**One table:** `public.saas_customers` remains the single customer identity table.

| Layer | Authority |
|-------|-----------|
| Table identity | BILL-001 name + row history (do not rename / recreate / duplicate) |
| Stripe customer key for COM-002 | `stripe_customer_id` (added), backfilled from `external_customer_id` |
| BILL-001 Stripe key | `provider` + `external_customer_id` (kept) |
| Checkout linkage (COM-002) | `checkout_session_id` (added, nullable for legacy rows) |
| Org entitlement (COM-002) | `organization_subscriptions` (Phase 1 / Slice E) — separate from BILL-001 `saas_subscriptions` |
| Provisioning | `provisioning_jobs` (Slice D) |
| Lifecycle events | `saas_lifecycle_events` (Slice E) |

## Dual commercial rails (intentional, not parallel customer stores)

| Rail | Tables | Role |
|------|--------|------|
| BILL-001 | `saas_customers`, `saas_subscriptions`, `saas_invoices`, `saas_webhook_events`, … | Existing SaaS billing mirror / portal path |
| COM-002 | `saas_checkout_sessions`, `organization_subscriptions`, `provisioning_jobs`, `saas_lifecycle_events`, extended `saas_customers` | Self-serve Checkout → provision → lifecycle |

They share **`saas_customers`** after reconciliation. They do **not** share subscription tables: `saas_subscriptions` (BILL-001) and `organization_subscriptions` (COM-002) both remain.

## Constraints honored

- No hand patches outside approved migration files
- No `DROP TABLE` / data deletes
- No duplicate customer tables
- No ADR-019 product/tier changes
- Slice D / Slice E SQL files unchanged; reconciliation is one additive migration placed before Slice D in file order

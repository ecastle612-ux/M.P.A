# Master Admin — Data Sources, API & Database

**Parent:** [70 Master Admin Command Center](./index.md)  
**Status:** Draft / Proposed

---

## Architecture review verdict

**Existing architecture reviewed: PASS**

Master Admin Command Center must be built as a **consumption + control layer** over systems that already exist after Production Stabilization / COM-002 / Owner Ops.

### Duplicate systems identified

| Temptation | Decision |
|------------|----------|
| New `admin_organizations` mirror | **Reject** — use `organizations` |
| New error/logging DB | **Reject** — use `platform_error_events` + observability module |
| New audit table for all MA actions | **Reject by default** — extend/use `platform_support_audit_events`; use `audit_events` for domain |
| New work-order admin store | **Reject** — query `maintenance_work_orders` |
| New units ledger | **Reject** — capacity on `organization_subscriptions` + property/unit inventory |
| New webhook mega-table | **Reject** — read existing per-provider webhook event tables |
| Parallel “admin entitlements” | **Reject** — reuse entitlement dictionary/overrides already in commercial model |

Additive tables are allowed **only** when a gap is proven (e.g. operator capability grants, error resolution state) and approved in an implementation slice.

---

## Existing data sources (reuse map)

### Core tenancy & identity

| Need | Source |
|------|--------|
| Organization directory | `organizations` |
| Setup / guided setup | `organization_setup_state` |
| Memberships / roles / status | `organization_memberships` |
| Invitations | `organization_invitations` |
| Platform operators | `platform_operators` |

### Commercial / Stripe / capacity

| Need | Source |
|------|--------|
| Plan/module, interval, status, trial | `organization_subscriptions` (`sku_code`, `billing_cycle`, `status`, `trial_ends_at`, …) |
| Stripe customer / subscription | `organization_subscriptions.stripe_*` + `saas_customers` |
| Subscription items / Price IDs / capacity items | `stripe_base_item_id`, `stripe_additional_capacity_item_id`, related checkout metadata |
| Managed units / capacity / next-period | `managed_unit_count`, `authorized_unit_capacity`, `authorized_additional_blocks`, `declared_unit_count`, `pending_*`, `last_capacity_authorized_at` |
| Lifecycle history | `saas_lifecycle_events` |
| Checkout sessions | `saas_checkout_sessions` |
| Provisioning jobs | existing provisioning job store / DB tables used by admin commerce APIs |
| SaaS Stripe webhooks | `saas_stripe_webhook_events` |
| Entitlements | existing entitlement tables/dictionary from commercial architecture (no new product model) |

### Properties, units, operations

| Need | Source |
|------|--------|
| Properties | `property_properties` (and related) |
| Units | existing unit tables used by PM inventory / capacity reconciliation |
| Work orders / backlog | `maintenance_work_orders` (+ `work_surface`) |
| Vendors | existing vendor / assignment tables |
| Notifications / email delivery | `maintenance_notifications` (+ Sprint 5 delivery columns) |

### Trust, leasing, finance webhooks (visibility)

| Need | Source |
|------|--------|
| SignWell webhooks | `signwell_webhook_events` |
| Financial Stripe webhooks | `financial_stripe_webhook_events` (ops visibility only; do not merge schemas) |

### Observability & audit

| Need | Source |
|------|--------|
| Critical errors | `platform_error_events` |
| Support / MA audit | `platform_support_audit_events` |
| Domain audit | `audit_events` |
| Domain events (context) | `event_domain_events` |

### Live loaders / APIs already present (extend, don’t replace)

- `apps/web/src/lib/admin/load-org-profile.ts`
- `apps/web/src/lib/admin/command-center-metrics.ts` (and related)
- `apps/web/src/lib/observability/*` (durable errors)
- `/api/admin/**` — organizations, search, support resend, claim link, provisioning retry, lifecycle enforce-grace, impersonation, launch certification

---

## API requirements

### Principles

1. All Master Admin APIs live under `/api/admin/**` (or clearly named admin routers).  
2. Every handler: auth → operator → capability → validate scope → execute → audit (mutations).  
3. Read APIs are paginated, filterable, and bounded (hard max page size).  
4. Responses are DTOs — never dump raw secrets or full provider payloads.  
5. Prefer aggregating in server loaders shared by UI (RSC) and JSON routes.

### Required read APIs (logical)

| API | Purpose |
|-----|---------|
| Overview snapshot | Health signals for Overview |
| Organizations list/detail | Directory + diagnostic sections |
| Users/memberships list/detail | Identity inspect |
| Subscriptions list/detail | Commercial inspect |
| Capacity list/detail | Units & capacity |
| Checkout sessions list/detail | Acquisition pipeline |
| Provisioning jobs list/detail | Job timeline |
| Webhook events list/detail | Per provider |
| Errors list/detail | `platform_error_events` |
| Operations queues | WO backlog, notification failures, auth denials summaries |
| Audit list/detail | Support + filtered domain audit |
| System health | Dependency probes |

### Required mutation APIs (logical)

| API | Status |
|-----|--------|
| Resend invitation | Exists — keep |
| Regenerate claim link | Exists — keep |
| Provisioning retry | Exists — keep |
| Lifecycle enforce-grace | Exists — keep |
| Impersonation start/stop | Exists — keep |
| Suspend / reactivate org | **Design now; implement only after approval + side-effect spec** |
| SKU assign / module enablement | Extend existing commercial admin only under capability |
| Error resolve/ack | Additive if column/table approved |
| Webhook replay / capacity manual edit | Deferred |

### Contract rules

- Mutations accept **target ids** but server loads canonical org and rejects mismatch.  
- Idempotency keys on retries.  
- Uniform error envelope: `unauthorized`, `forbidden`, `not_found`, `conflict`, `validation`, `upstream`.

---

## Database requirements

### Prefer zero new tables

First implementation slices should be **UI + API over existing tables**.

### Additive changes allowed only with slice approval

| Potential additive | Why | Default |
|--------------------|-----|---------|
| Operator capability grants | Fine-grained RBAC beyond boolean operator | Proposed later |
| Error resolution columns on `platform_error_events` | Ack/resolve state | Optional small alter |
| Materialized overview counters | Performance | Only if query cost proven |

### Explicitly forbidden without new ADR

- Parallel org/subscription/unit schemas  
- Parallel error event store  
- Storing webhook signing secrets in MA tables  
- Denormalized “admin cache” that can drift from commercial truth without reconciliation job  

---

## Observability requirements (consume Sprint 5)

- Writers continue to call existing `captureException` / log helpers.  
- Master Admin Errors + Overview critical tiles **read** `platform_error_events`.  
- Correlation: `request_id`, `organization_id`, `route`, `severity`, `source`.  
- Optional Sentry remains an external sink — MA does not require Sentry UI embedding.  
- Auth denial metrics: emit scrubbed structured events into the same observability path (category in metadata), not a new product database.

---

## Performance notes

- Fleet pages: indexed filters (`created_at`, `organization_id`, status).  
- Overview: parallel bounded queries with timeouts; show per-tile degradation.  
- Organization Detail: section-level streaming/parallel fetch; do not block entire page on WO history.  
- No cross-org unbounded table scans in request path — pre-aggregate if needed in a later slice.

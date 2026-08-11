# Master Admin — Information Architecture

**Parent:** [70 Master Admin Command Center](./index.md)  
**Status:** Draft / Proposed

---

## Target navigation

Recommended primary structure (may map to existing `/admin/**` routes; route remapping is an implementation detail after approval):

```
MASTER ADMIN
├── Overview
├── Organizations
├── Users & Memberships
├── Subscriptions
├── Units & Capacity
├── Checkout & Provisioning
├── Webhooks
├── Errors
├── Operations
├── Audit Log
└── System Health
```

### Mapping from live Owner Ops nav (today)

| Today (`MASTER_ADMIN_NAV`) | Target home |
|----------------------------|-------------|
| Command Center `/admin` | Overview (+ critical feed already started) |
| Support Center | Fold into Organizations detail + Operations queues |
| System Health `/admin/system` | System Health |
| Organizations | Organizations |
| Customers | Users & Memberships |
| Operators | System Health → Operators (or Users & Memberships → Operators) |
| View As | Operations → Impersonation (governed) |
| Billing / Subscriptions / Lifecycle | Subscriptions (+ Lifecycle subsection) |
| Provisioning / Checkout | Checkout & Provisioning |
| *(gap)* | Units & Capacity |
| *(gap)* | Webhooks |
| *(partial)* Critical errors on CC | Errors |
| *(gap)* Unified explorer | Audit Log |
| *(partial)* WO / vendor / notify | Operations |

**Rule:** Do not keep placeholder nav items. Every listed item must ship with at least read/inspect workflows when its slice is authorized.

---

## Surface catalog

Each surface below defines: purpose, key metrics, primary workflows, filters/search, detail views, allowed actions, authorization, empty states, error states.

---

### 1. Overview

**Purpose:** Executive operational health — answer “Is M.P.A. healthy right now?” in one viewport.

**Key metrics (tiles / signals):**

| Signal | Source family |
|--------|---------------|
| Organizations (total / active / suspended / pending setup) | `organizations`, setup, subscription status |
| Active subscriptions | `organization_subscriptions` |
| Trial organizations | `trial_ends_at` / trial status |
| Managed units (fleet) | `managed_unit_count` aggregates |
| Capacity events (recent authorize / pending) | capacity columns + lifecycle/capacity events |
| Checkout failures | `saas_checkout_sessions` |
| Provisioning failures | provisioning jobs |
| Webhook failures | Stripe + SignWell webhook event tables |
| Critical errors | `platform_error_events` |
| Notification / email failures | `maintenance_notifications` delivery fields |
| Authorization denials | observability metadata / structured denial logs |
| System health | existing system health checks |

**Primary workflows:**

1. Scan red/amber signals → open the owning surface.
2. Open recent critical error → Organization Detail or Errors detail.
3. Search org/user/email → Organization / User detail.

**Filters/search:** Global operator search (org name/slug, user email, Stripe customer/subscription id, checkout session id).

**Detail views:** N/A (hub); each tile deep-links.

**Allowed actions:** Read-only on Overview. Mutations happen on child surfaces.

**Authorization:** `platform_operator` active.

**Empty states:** “No critical issues in window” with time-window control (e.g. 24h / 7d).

**Error states:** Partial degradation banners when a data source fails (do not blank the whole Overview).

---

### 2. Organizations

**Purpose:** Organization directory and lifecycle visibility.

**Must expose:** directory, lifecycle status, active/inactive, module/SKU enablement, creation/provisioning state.

**Key metrics:** counts by lifecycle bucket (provisioning, setup, active, suspended, canceling/canceled, reactivating).

**Primary workflows:** find org → open Organization Detail; filter by SKU/status; spot stuck provisioning.

**Filters/search:** name, slug, id, SKU, subscription status, setup complete, created range.

**Detail views:** [Organization Detail](./organization-detail.md).

**Allowed actions (inspect default):** inspect org; open users/subscription/Stripe/units/provisioning tabs. Mutations per [mutation matrix](./permissions-and-mutations.md) (suspend/reactivate, module enablement if governed).

**Authorization:** operator read; mutations need specific capabilities.

**Empty states:** “No organizations match filters.”

**Error states:** directory load failure with retry; never invent rows.

---

### 3. Users & Memberships

**Purpose:** Identity, membership, roles, membership status, authorization visibility.

**Key metrics:** active users, pending invitations, memberships by role, recent auth denials (linked).

**Primary workflows:** find user → memberships → org detail; inspect invitation state; inspect View-As eligibility context (not grant via this list alone).

**Filters/search:** email, user id, org, role, membership status, invitation status.

**Detail views:** User profile; Membership row detail; deep-link to Organization Detail.

**Allowed actions:** inspect users/memberships/roles; resend invitation (already exists — keep audited); no free-form role escalation without capability.

**Authorization:** operator read; invitation resend = support capability + audit.

**Empty / error:** standard match-none / partial-failure patterns.

---

### 4. Subscriptions

**Purpose:** Commercial truth — plan/module (SKU), interval, status, trial, entitlements.

**Must expose:** current plan/module, billing interval, subscription status, trial status, managed units, capacity, next-period capacity, entitlement state, Stripe linkage summary.

**Key metrics:** active / past_due / canceled / trialing; SKU mix; entitlement override count (if overrides exist).

**Primary workflows:** inspect subscription → Stripe ids → capacity → org detail; assign SKU only if already governed by existing admin commerce flows.

**Filters/search:** SKU, status, billing cycle, Stripe customer/subscription id, trial ending soon, capacity pending.

**Detail views:** Subscription detail panel; Entitlement state panel; Stripe linkage panel.

**Allowed actions:** inspect; lifecycle enforce/retry only where existing safe admin APIs already define behavior; entitlement override UI only after explicit governance approval in a later slice.

**Authorization:** commercial.inspect; commercial.mutate for governed writes.

---

### 5. Units & Capacity

**Purpose:** Fleet and per-org unit volume / billing capacity visibility (COM-002 Slice 3/4 fields).

**Must expose:** total units, units by organization, unit capacity, additional capacity, current billing units, next-period billing units, reconciliation state.

**Key metrics:** orgs over capacity, pending next-period capacity, declared vs managed mismatch, unauthorized overage.

**Primary workflows:** find capacity risk → org detail Units tab → reconcile against properties/units inventory.

**Filters/search:** org, over-capacity, pending capacity, SKU.

**Detail views:** Org capacity breakdown; optional property/unit inventory summary (reuse property/unit tables — no duplicate inventory system).

**Allowed actions:** inspect only in first implement slices; capacity mutations only if Product Owner later authorizes explicit admin capacity tools (prefer Stripe/webhook-driven truth).

**Authorization:** capacity.inspect (read); capacity.mutate deferred by default.

---

### 6. Checkout & Provisioning

**Purpose:** Acquisition → checkout → bind/provision pipeline health.

**Must expose:** acquisition/quote sessions (where persisted), checkout sessions, provisioning state, failures, bind/provision status, anomalies.

**Key metrics:** open checkouts, failed checkouts, stuck provisioning jobs, claim-link regenerations, quote/checkout mismatches.

**Primary workflows:** inspect failed checkout → related Stripe session → provisioning job → retry safe checkpoint (existing retry API); regenerate claim link when governed.

**Filters/search:** email, session id, status, org id (when bound), failure class, time range.

**Detail views:** Checkout session detail; Provisioning job timeline; anomaly flags.

**Allowed actions:** inspect; retry provisioning (existing); regenerate claim link (existing); no arbitrary “force provision” without capability + confirmation.

**Authorization:** provisioning.inspect / provisioning.retry.

---

### 7. Webhooks

**Purpose:** Delivery health for Stripe and SignWell (and related SaaS webhook stores).

**Must expose:** deliveries, success/failure, retry state, idempotency, recent failures, last successful delivery.

**Key metrics:** last success per channel, failure rate window, signature failures, lag, duplicate/idempotent hits.

**Primary workflows:** inspect recent failures → correlated org/checkout/subscription → Errors / Org Detail.

**Filters/search:** provider, event type, success/fail, request id, time range.

**Detail views:** Event detail (scrubbed payload summary — never signing secrets).

**Allowed actions:** inspect; safe replay/retry only if an existing server-side idempotent handler supports it and capability is granted (default: inspect-only until approved).

**Authorization:** webhooks.inspect; webhooks.retry (optional later).

**Data sources (reuse):** `saas_stripe_webhook_events`, `signwell_webhook_events`, `financial_stripe_webhook_events` (finance plane — show only if operator needs FO billing ops; do not merge into a new mega-table).

---

### 8. Errors

**Purpose:** Critical error feed and triage.

**Must expose:** severity, timestamp, organization, user/request context where appropriate, route, error category, resolution state.

**Key metrics:** critical/error counts, top routes, orgs with repeated failures, unresolved count.

**Primary workflows:** triage → mark resolution state (when field exists / is added in authorized slice) → open org detail / request correlation.

**Filters/search:** severity, org, route, source (server/client/edge/job), request id, time range, unresolved.

**Detail views:** Error event detail (stack scrubbed for secrets).

**Allowed actions:** inspect; set resolution/ack if approved schema supports it; no delete of forensic history by default.

**Authorization:** errors.inspect; errors.resolve.

**Source of truth:** `platform_error_events` + observability module — **no second system**.

---

### 9. Operations

**Purpose:** Cross-org operational queues that are not purely commercial.

**Should expose (visibility):**

| Queue | Reuse |
|-------|-------|
| Properties / units inventory health | property + unit tables |
| Work-order backlog | `maintenance_work_orders` (+ `work_surface`) |
| Maintenance activity | WO transitions / notifications |
| Vendor health | vendor assignment/completion signals |
| Notification / email delivery | `maintenance_notifications` delivery fields |
| Commercial quote anomalies | quote/checkout stores |
| Checkout anomalies | checkout sessions |
| Authorization denials | observability |
| RLS/auth failures | observability |
| Webhook failures | webhook tables |

**Primary workflows:** open queue item → org-scoped detail → customer product deep-link only when View-As is explicitly started.

**Filters/search:** org, surface (PM/FO), severity/age, failure class.

**Allowed actions:** inspect; escalate via existing support tools; impersonation only under existing View-As governance.

**Authorization:** operations.inspect; impersonation.use (existing audited path).

---

### 10. Audit Log

**Purpose:** Unified operator-facing audit explorer for Master Admin mutations and support actions.

**Key metrics:** mutations last 24h, destructive actions, impersonation sessions.

**Primary workflows:** filter by actor/action/org → open target → verify result.

**Filters/search:** actor, action, org, target type/id, result, time range.

**Detail views:** Audit record (reason/context; scrubbed).

**Data sources (reuse, do not duplicate):**

- `platform_support_audit_events` (operator/support)
- `audit_events` (org-scoped domain audits — operator read via service role carefully)
- Domain event stream where useful (`event_domain_events`) as **context**, not a replacement for audit

**Allowed actions:** read-only explorer. Corrections happen via governed mutations that create new audit rows.

**Authorization:** audit.read.

---

### 11. System Health

**Purpose:** Platform dependency and operator-access health.

**Key metrics:** app/deploy identity (non-secret), database reachability, Stripe mode, email provider configured, job processing, incident banners, operator roster health.

**Primary workflows:** confirm dependency failure vs application bug; manage operator list (existing).

**Allowed actions:** inspect health; manage `platform_operators` via existing governed flows only.

**Authorization:** system.inspect; operators.manage (narrow).

---

## Responsive / mobile requirements

- Master Admin is **desktop-primary** (operator workstation).
- Tablet: usable read/inspect; dense tables may horizontally scroll.
- Phone: Overview signals + search + org detail summary required; full mutation consoles may be read-only or deferred.
- Touch targets and contrast must meet Canopy / a11y baselines already used in `/admin`.
- Do not build a separate mobile admin app in this phase.

---

## UX laws (Canopy-aligned)

- One job per section.
- Organization Detail is a connected diagnostic story, not a card dump.
- Prefer timelines and state machines over decorative charts.
- Empty and error states must be honest (never “healthy” when a source failed to load).

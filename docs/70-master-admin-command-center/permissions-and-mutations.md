# Master Admin — Permissions & Mutations

**Parent:** [70 Master Admin Command Center](./index.md)  
**Status:** Draft / Proposed

---

## Identity gate

Every Master Admin route and API must enforce, in order:

1. **Authentication** — valid session user  
2. **Platform operator** — active row in `platform_operators` (`isPlatformOperatorUser`)  
3. **Capability** — fine-grained capability for the action (see matrix)  
4. **Organization scope validation** — for org-targeted actions, resolve org server-side; never trust client org ids alone  
5. **Audit** — every mutation writes an audit record  
6. **Confirmation** — required for destructive or irreversible actions  

There is **no** broad “admin bypass” that skips product authorization models inside customer tenants except through explicitly designed operator tools (e.g. service-role reads for fleet inspect, View-As for read-only diagnosis).

---

## Capability model (proposed)

Capabilities are additive flags associated with platform operators (implementation may start as a single `active` operator = full read + existing mutations, then tighten). Target dictionary:

| Capability | Intent |
|------------|--------|
| `ma.overview.read` | Overview metrics |
| `ma.orgs.read` | Organization directory + detail |
| `ma.orgs.suspend` | Suspend organization |
| `ma.orgs.reactivate` | Reactivate organization |
| `ma.users.read` | Users & memberships inspect |
| `ma.users.support` | Resend invitation / claim-link style support |
| `ma.subscriptions.read` | Subscriptions & entitlements inspect |
| `ma.subscriptions.assign` | Assign/change SKU (governed) |
| `ma.capacity.read` | Units & capacity inspect |
| `ma.capacity.mutate` | Manual capacity correction (default **denied** until PO approves) |
| `ma.provisioning.read` | Checkout & provisioning inspect |
| `ma.provisioning.retry` | Retry safe provisioning checkpoints |
| `ma.webhooks.read` | Webhook health inspect |
| `ma.webhooks.retry` | Safe replay (default **denied** until approved) |
| `ma.errors.read` | Error feed |
| `ma.errors.resolve` | Ack / resolution state |
| `ma.operations.read` | Cross-org operations queues |
| `ma.impersonation.use` | View-As (existing governance) |
| `ma.audit.read` | Audit explorer |
| `ma.system.read` | System health |
| `ma.operators.manage` | Manage platform operators |

**Bootstrap rule:** Until a capability table ships, map existing operators to read-all + currently implemented mutations only; do not expand mutation power silently.

---

## Permissions matrix (surfaces × access)

| Surface | Read | Mutate | Notes |
|---------|------|--------|-------|
| Overview | `ma.overview.read` | — | Read-only hub |
| Organizations | `ma.orgs.read` | `ma.orgs.suspend` / `reactivate` | Module enablement via subscription/entitlement caps |
| Users & Memberships | `ma.users.read` | `ma.users.support` | No silent role god-mode |
| Subscriptions | `ma.subscriptions.read` | `ma.subscriptions.assign` | Constitution-safe SKUs only |
| Units & Capacity | `ma.capacity.read` | `ma.capacity.mutate` (deferred) | Prefer Stripe-driven capacity |
| Checkout & Provisioning | `ma.provisioning.read` | `ma.provisioning.retry` | Existing retry/claim APIs |
| Webhooks | `ma.webhooks.read` | `ma.webhooks.retry` (deferred) | Inspect first |
| Errors | `ma.errors.read` | `ma.errors.resolve` | No forensic delete |
| Operations | `ma.operations.read` | `ma.impersonation.use` | View-As audited |
| Audit Log | `ma.audit.read` | — | Append-only via other mutations |
| System Health | `ma.system.read` | `ma.operators.manage` | Narrow |

---

## Mutation matrix

| Action | Safe? | Capability | Confirmation | Audit fields | Notes |
|--------|-------|------------|--------------|--------------|-------|
| Inspect organization | Yes | `ma.orgs.read` | No | Optional read audit (high-volume: sample/omit) | Default |
| Inspect users / memberships | Yes | `ma.users.read` | No | Optional | |
| Inspect subscription / entitlement | Yes | `ma.subscriptions.read` | No | Optional | |
| Inspect Stripe linkage | Yes | `ma.subscriptions.read` | No | Optional | Display ids only |
| Inspect unit capacity | Yes | `ma.capacity.read` | No | Optional | |
| Inspect provisioning / checkout | Yes | `ma.provisioning.read` | No | Optional | |
| Inspect webhook state | Yes | `ma.webhooks.read` | No | Optional | Scrub secrets |
| Inspect errors | Yes | `ma.errors.read` | No | Optional | |
| Resend invitation | Yes (existing) | `ma.users.support` | Soft | Required | Existing API |
| Regenerate claim link | Yes (existing) | `ma.users.support` / provisioning | Soft | Required | Existing API |
| Retry provisioning checkpoint | Yes if idempotent | `ma.provisioning.retry` | Soft | Required | Existing retry route |
| Enforce grace / lifecycle tool | Conditional | commercial lifecycle cap | Yes | Required | Existing enforce-grace |
| Assign SKU / module enablement | Conditional | `ma.subscriptions.assign` | Yes | Required | Only PM / FO / Complete |
| Suspend organization | Destructive | `ma.orgs.suspend` | Yes + reason | Required | Define side effects before implement |
| Reactivate organization | Sensitive | `ma.orgs.reactivate` | Yes + reason | Required | |
| Manual capacity edit | Risky | `ma.capacity.mutate` | Yes | Required | **Deferred** — open question |
| Webhook replay | Risky | `ma.webhooks.retry` | Yes | Required | **Deferred** |
| Resolve/ack error | Yes | `ma.errors.resolve` | Soft | Required | Needs resolution fields if not present |
| View-As impersonation | Sensitive | `ma.impersonation.use` | Yes + reason | Required | **Only** existing governed path |
| Manage operators | Sensitive | `ma.operators.manage` | Yes | Required | Avoid lockout |

### Hard rules for every mutation

Audit record **must** include:

| Field | Description |
|-------|-------------|
| actor | Operator user id (+ email snapshot optional) |
| action | Stable action key |
| target | Entity type + id |
| organization | Server-resolved org id (nullable only if truly global) |
| timestamp | UTC |
| result | success / failure / rejected |
| reason/context | Operator-supplied reason when destructive; request id |

Sensitive payloads (tokens, raw card data, webhook secrets) must **never** be stored in audit context.

---

## Explicitly disallowed patterns

- Client-supplied `organizationId` trusted without server re-resolution  
- “Superuser” SQL from the browser  
- Impersonation without audit + reason  
- Silent entitlement grants without SKU/constitution checks  
- Building a second audit table when `platform_support_audit_events` can be extended  
- Deleting `platform_error_events` to “clean” the feed  

---

## CSRF, session, rate limits

| Control | Requirement |
|---------|-------------|
| Session | Same auth session hardening as app; operator cookie not special-cased insecurely |
| CSRF | Cookie-session mutating routes use existing CSRF/same-site patterns applicable to `/api/admin/**` |
| Rate limit | Mutating admin APIs rate-limited per operator (stricter on retry/resend/impersonation) |
| Step-up | Destructive actions require typed confirmation (org slug) in UI |

Details: [Security & Observability](./security-observability.md).

# 05 — Permissions

**Package:** OWNER-001  
**Status:** Approved · Phase 1 ✅ COMPLETE  
**Section:** §8 Permissions  
**Scope:** **Owner permissions only** (`property_owner`)

---

## Role

| Role | Portal |
|------|--------|
| `property_owner` | Owner Portal (`/portal/owner` family) |

Property managers, tenants, and vendors are out of scope for this permissions document except as producers of data owners consume.

---

## Permission philosophy

1. **Read-mostly commercial transparency** — owners see portfolio, financials, documents, maintenance status, and communications intended for them.  
2. **No day-to-day operations admin** — no team invites, org settings admin, ledger mutation, or Connect payout controls.  
3. **Least privilege** — grant only what MVP screens require.  
4. **Reuse existing RBAC** — extend grants only when Approve records a gap (e.g. reply, announcement read).

---

## Baseline capabilities (as-built today)

`property_owner` already commonly includes (from platform grants; authoritative source = RBAC migrations / capability tables):

| Capability area | Typical owner grant | MVP use |
|-----------------|---------------------|---------|
| Identity / org | `identity:read`, `organization:read`, `organization:switch`, `membership:read`, `invitation:read` | Shell, switcher |
| Profile | `profile:read`, `profile:update` | Settings |
| Navigation / dashboard | `navigation:access`, `dashboard:read` | Shell / Home |
| Portfolio read | `property:read`, `unit:read`, `tenant:read`, `lease:read` | Properties / Property View |
| Ops read | `maintenance:read`, `vendor:read` | Open maintenance, vendor expense context |
| Financial read | `financial:read` | Financials, statements, reports |
| Documents / media | `document:read`, `media:read` | Documents, PDFs, photos |
| Messaging | `message:read` | Inbox (read) |
| Notifications | `notification:read`, `notification:update` | Center + mark read |
| AI | `ai:read`, `ai:use` | Optional assistive only |
| Other read | `applicant:read`, `screening:read`, `signature:read` | Not primary MVP nav; do not expand UI around these unless needed for document context |

---

## MVP screen → permission matrix

| Screen | Required capabilities (minimum) | Notes |
|--------|----------------------------------|-------|
| Dashboard | `dashboard:read` / portal access + property/financial/document/message/notification reads | Compose from read models |
| Properties / Property View | `property:read`, `unit:read`, `tenant:read`, `lease:read`, `maintenance:read`, `vendor:read`, `financial:read`, `document:read` | Read-only |
| Financial Summary / Statements / Receipts | `financial:read` | No financial write |
| Statement PDF / Reports download | `financial:read` + `document:read` | Via ReportingService / Vault |
| Documents | `document:read` (+ `media:read` for photos) | No `document:create` required |
| Messages (read) | `message:read` | |
| Messages (reply) | **Gap** — see Proposed grants | US-E02 |
| Announcements (read) | **Gap** — see Proposed grants | Must not grant PM broadcast |
| Notifications | `notification:read`, `notification:update` | |
| Settings | `profile:*`, org read/switch, notification prefs | |
| Payouts placeholder | none beyond `financial:read` view | No payout mutate caps |

---

## Explicitly denied (Owner MVP)

Owners must **not** receive these for OWNER-001:

| Denied | Reason |
|--------|--------|
| Financial write / mutate / settle | Read-only financial portal |
| `document:create` (unless Approve says upload is required — default **no**) | Vault publish remains PM/system |
| Full `communication:*` PM broadcast suite | Owners receive, do not run org communications admin |
| Org admin / team management | Wrong role |
| Stripe Connect / payout execute / transfer | FIN-003 |
| Maintenance approve/reject capabilities | Future Release |
| Master Admin capabilities | Separate plane |

---

## Proposed grants (Draft — require Approve)

These close product gaps without redesigning RBAC architecture:

| Proposal | Capability | Decision needed |
|----------|------------|-----------------|
| **P-MSG-1** | Allow owner **reply** via `message:create` (and/or `message:update` if required by existing contracts) scoped to threads they can read | Approve yes/no |
| **P-ANN-1** | Allow owner **read** of announcements intended for owners without granting announcement create/publish | Approve mechanism (dedicated read cap vs scoped communication read) |
| **P-SCOPE-1** | Confirm property scoping: org-wide owner membership vs future `owner_property_access` filtering | See Open Questions |

Until Approve, treat P-MSG-1 and P-ANN-1 as **open**.

---

## Impersonation / Test Mode

| Mode | Permission behavior |
|------|---------------------|
| Master Admin Portal Test Mode (`portal=owner`) | May render demo fixtures; must not leak to real owner sessions |
| Master Admin impersonation of a real owner | Uses that user’s owner capabilities; audit required (ADMIN-001) |

---

## Authorization checks (design requirements)

1. Route/shell: authenticated + `property_owner` (or valid MA portal access).  
2. Data: organization isolation on every query.  
3. Data: property scope filtering once ownership scope model is confirmed.  
4. Documents/PDFs: signed URLs / existing vault download auth only.  
5. Deny-by-default for any mutate endpoint exposed near owner UI.

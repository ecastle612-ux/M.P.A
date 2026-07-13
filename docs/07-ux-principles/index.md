# 07 — UX Principles

## North Star

Every interaction must move a **workflow** forward or give a **decision-maker** confidence to act. If a screen does not do one of these, it should not ship.

---

## Principle 1: Workflow Continuity

Users always know:
- **Where they are** in the operational lifecycle
- **What happens next**
- **Who is waiting** on the current step

### Implementation
- Workflow Rail on all multi-stage processes (see **06 Design Language**)
- Stage badges on list items (e.g., "Screening — awaiting documents")
- Cross-links to upstream/downstream entities (lease ↔ work orders ↔ owner report)

### Anti-pattern
Isolated CRUD pages with no connection to the master lifecycle.

---

## Principle 2: Action Before Analytics

Default views show **what needs doing today**, not charts.

| Priority | View Content |
|----------|--------------|
| 1 | Action queue (approve, assign, review, respond) |
| 2 | Blocked items with reason |
| 3 | Today's schedule |
| 4 | Summary metrics |

Charts are secondary layers — accessed intentionally, not default landing.

---

## Principle 3: Context Stays Attached

When a user opens a work order, they see property, tenant, lease, owner, vendor, and related history **without navigating away**.

### Implementation
- Master-detail layout on desktop
- Context header pinned on all detail views
- Related entities as linked chips, not buried tabs

---

## Principle 4: Progressive Disclosure

Property management is complex. Show simplicity first, depth on demand.

| Level | Shows |
|-------|-------|
| Summary | Status, key dates, next action |
| Detail | Full record, editable fields |
| Expert | Audit log, raw financials, API metadata |

Do not dump every field on first open.

---

## Principle 5: AI Assists, Human Decides

High-stakes actions require explicit human confirmation:

| High-Stakes | AI Role |
|-------------|---------|
| Eviction notice | Draft only |
| Vendor hire on expensive job | Recommend only |
| Lease clause changes | Flag + suggest |
| Owner report publication | Draft + PM approve |

Low-stakes automation (reminders, categorization, search) may proceed without confirmation.

---

## Principle 6: Multi-Sided Clarity

Each persona sees **their** work, not the whole platform.

| Persona | Landing Experience |
|---------|-------------------|
| PM staff | Operations console — portfolio queue |
| Owner | Property performance + reports + approvals |
| Tenant | Home, pay rent, maintenance status |
| Vendor | Job inbox, bids, payment status |

Never show vendor marketplace admin UI to tenants.

---

## Principle 7: Failures Are Operational

Errors speak in property management language:

- ❌ "Error 422: validation failed"
- ✅ "Cannot assign vendor — liability insurance expired on March 12"

Every error suggests the **next action**.

---

## Principle 8: Speed Is UX

Desktop users process hundreds of items daily.

| Expectation | Target |
|-------------|--------|
| List view load | < 1s perceived |
| Detail panel open | < 300ms |
| Search results | < 500ms |
| Optimistic UI | On safe mutations |

See **15 Performance Standards** for engineering targets.

---

## Principle 9: Undo Where Safe

| Undo Allowed | Undo Forbidden |
|--------------|----------------|
| Draft edits | Executed payment |
| Status label changes | Signed lease modification |
| Assignment changes pre-acceptance | Screening decision log |

---

## Principle 10: Communication Is Contextual

Messages send **from** the entity they relate to:

- Message about work order #123 opens with that context attached
- Owner report discussion threads on the report record
- No generic "inbox" divorced from operational objects (inbox aggregates threads, not replaces context)

---

## Navigation Structure

### PM Organization Portal

```
Operations (default)
  ├── Queue (all actionable items)
  ├── Properties
  ├── Leasing
  ├── Maintenance
  ├── Financial
  ├── Owners
  └── Vendors (Marketplace)

Organization
  ├── Team
  ├── Settings
  └── Billing
```

### Vendor Portal

```
Jobs → Bids → Active → Completed → Payments → Profile
```

### Owner Portal

```
Properties → Reports → Approvals → Messages
```

### Tenant Portal

```
Home → Pay Rent → Maintenance → Documents → Messages
```

---

## Onboarding UX

New PM organizations guided through **workflow setup**, not feature tour:

1. Create organization
2. Add first property
3. Invite team
4. Connect Stripe
5. Add first vendor (marketplace or own)
6. Run first workflow end-to-end

---

## Empty State Rule

Every empty state answers: **"What workflow step creates the first record here?"**

- ❌ "No properties yet"
- ✅ "Add your first property to start the management lifecycle" → [Add Property]

---

## Document Relationships

- **06 Design Language (Canopy)** — visual execution of these principles
- **21 Experience Architecture** — emotional experience, role journeys, micro-interaction feelings
- **12 Component Standards** — component-level patterns
- **05 Business Workflows** — workflow definitions these principles serve

# 04 — Notification Event Model

**Package:** API-001  
**Status:** Draft — awaiting Approve

---

## Canonical notification record

Every notification (in-app + push correlation) must support:

| Field | Required | Notes |
|-------|----------|-------|
| Title | Yes | Short, actionable |
| Body | Yes | One or two sentences |
| Priority | Yes | `low` \| `normal` \| `high` \| `emergency` |
| Timestamp | Yes | `created_at` (UTC) |
| Category | Yes | See taxonomy below |
| Organization | Yes | `organization_id` |
| Property | Optional | `property_id` when applicable |
| Unit | Optional | `unit_id` when applicable |
| Entity link | Optional | `href` + `source_entity_type` / `source_entity_id` |
| Read status | Yes | `read_at` null = unread |
| Delivery status | Yes | In-app always `delivered`; push: `pending` \| `sent` \| `failed` \| `skipped` |

### Proposed payload (service input)

```typescript
type NotifyInput = {
  organizationId: string;
  category: NotificationCategory;
  priority: "low" | "normal" | "high" | "emergency";
  title: string;
  body: string;
  /** Stable key for idempotency: eventType + entityId + recipientUserId */
  eventKey: string;
  recipientUserIds: string[];
  propertyId?: string | null;
  unitId?: string | null;
  href?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  metadata?: Record<string, unknown>;
  /** Force channels; default = derive from preferences */
  channels?: { inApp?: boolean; push?: boolean };
};
```

### Proposed persisted extensions (design only — no migration yet)

Relative to current `in_app_notifications`:

| Extension | Purpose |
|-----------|---------|
| Expand `category` check constraint | Add vendors, residents, communications, inspections, emergency, system |
| `priority` column | Filter critical / emergency |
| `property_id`, `unit_id` | Property filter + Ops widgets |
| `archived_at`, `deleted_at` | Archive / soft delete |
| `push_delivery_status`, `push_external_id`, `push_last_error` | Provider correlation |
| `idempotency_key` unique per org | Deduplicate |

Exact DDL belongs to the implementation slice migration after Approve.

---

## Category taxonomy

| Category key | Label | Typical planes |
|--------------|-------|----------------|
| `maintenance` | Maintenance | Resident, PM, Vendor |
| `messages` | Messages | All planes with messaging |
| `announcements` | Announcements | Resident, PM |
| `residents` | Residents | PM |
| `applicants` | Applicants | PM |
| `leases` | Leases | Resident, PM |
| `financial` | Financial | Resident, PM, Owner |
| `vendors` | Vendors | PM, Vendor |
| `inspections` | Inspections | Resident, PM, Vendor |
| `emergency` | Emergency | All (override rules) |
| `ai_operations` | AI Operations | PM |
| `system` | System | PM / admins |

### Mapping from current code categories

| Existing (`in_app_notifications`) | API-001 category |
|-----------------------------------|------------------|
| `message` | `messages` |
| `maintenance` | `maintenance` |
| `lease` | `leases` |
| `financial` | `financial` |
| `announcement` | `announcements` |
| `applicant` | `applicants` |
| `ai` | `ai_operations` |

Implementation must migrate or alias existing values without breaking unread history.

---

## Event routing table

**Rule:** Do not invent placeholder triggers. Only route events that already exist (or will exist as real workflow completions) in M.P.A. modules.

| # | Workflow event (existing / in-product) | Category | Priority | Primary recipients | Deep link target |
|---|----------------------------------------|----------|----------|--------------------|------------------|
| 1 | Resident submits maintenance request | `maintenance` | `normal`/`high` | Property managers for property | Work order detail |
| 2 | Vendor accepts work order | `maintenance` | `normal` | Requesting resident + PM | Work order detail |
| 3 | Vendor completes work order | `maintenance` | `normal` | Resident + PM | Work order detail |
| 4 | Resident sends message | `messages` | `normal` | Thread participants (PM/vendor) | Thread |
| 5 | Property manager replies | `messages` | `normal` | Thread participants (resident/vendor) | Thread |
| 6 | Lease signed | `leases` | `high` | PM + resident parties | Lease detail |
| 7 | Lease renewal reminder | `leases` | `normal` | PM + resident | Lease detail |
| 8 | Rent overdue | `financial` | `high` | Resident + PM | Charge / financials |
| 9 | Payment received | `financial` | `normal` | Resident + PM (configurable) | Payment / charge |
| 10 | Announcement published | `announcements` | from announcement | Targeted residents (+ PM copy optional) | Announcement |
| 11 | Emergency announcement published | `emergency` | `emergency` | Targeted audience | Announcement |
| 12 | Applicant submitted | `applicants` | `normal` | PM | Applicant detail |
| 13 | Applicant approved | `applicants` | `high` | Applicant user (if account) + PM | Applicant detail |
| 14 | Applicant declined | `applicants` | `normal` | Applicant user (if account) + PM | Applicant detail |
| 15 | Background check completed | `applicants` | `high` | PM | Applicant / screening |
| 16 | Document requires signature | `leases` / `residents` | `high` | Signers | Document / signature |
| 17 | Document signed | `leases` / `residents` | `normal` | PM + counterparties | Document |
| 18 | Migration job completed | `system` | `normal`/`high` | Initiating PM / admins | Migration job |
| 19 | System alert (health / security) | `system` | `high`/`emergency` | Org admins | System / setup |
| 20 | AI recommendation generated | `ai_operations` | `normal` | PM (insight audience) | AI operations / insight |

### Routing notes

- **Messages** already create in-app notifications today; re-route through NotificationService so push applies.
- **Announcements** already have publish lifecycle + priority; emergency maps to `emergency` category and override policy.
- **AI recommendations** notify only when an insight/recommendation record is actually created — not speculative placeholders.
- **Inspections / vendors** rows activate when those workflows emit real completion events; until then, categories exist in taxonomy but have no dead triggers.
- Recipient resolution must respect org membership and plane roles.

---

## Idempotency

```
idempotency_key = hash(
  organizationId,
  eventType,
  sourceEntityId,
  recipientUserId,
  optionalOccurrenceKey  // e.g. reminder date
)
```

Unique constraint per organization prevents duplicate inbox rows on retry.

---

## Priority semantics

| Priority | Badge / Ops treatment | Quiet hours | Push aggressiveness |
|----------|----------------------|-------------|---------------------|
| `low` | History only | Honored | Optional / batched later |
| `normal` | Standard unread | Honored | Standard |
| `high` | Elevated in Ops | Honored unless org policy says otherwise | Immediate if push on |
| `emergency` | Critical + Emergency widgets | **Overridden** | Immediate; category opt-out overridden per 05 |

---

## Delivery status model

| Status | Meaning |
|--------|---------|
| `pending` | Queued for provider |
| `sent` | Accepted by provider |
| `delivered` | Confirmed (if webhook available) |
| `failed` | Provider or network failure |
| `skipped` | Preferences / no device / noop provider |

In-app presence is independent: a row can be unread in-app while push is `skipped`.

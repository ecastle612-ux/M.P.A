# PX-006.02 — Workflow Continuity (Eliminate Dead Ends)

**Status:** Proposed  
**Priority:** P0 (flows), P2 (polished success banners)

---

## Principle

Every successful create/update action must answer **what happened** and **what to do next**. Never return the user to a blank list with no guidance.

---

## Required workflow chains

### Organization created

**Current:** Inline text notice only.

**Required:**

```
Organization Created ✓

Immediate next steps:
  • Create your first Property     [Continue →]
  • Invite Your Team               [Invite →]
  [Skip for now]
```

Presentation: modal or inline success panel on dashboard — not a separate route.

---

### Property created

**Current:** Redirect to unit create with small banner.

**Required:**

```
Property Created ✓

Recommended next steps:
  • Add Units
  • Invite Team
  • Create First Tenant

Progress:
  Organization ✓  Property ✓  Units ○  Tenant ○  Lease ○  Maintenance ○  Financials ○

[Add Units →]   [Skip]
```

Also handle `from=property-created` on property detail page.

---

### Unit created

**Required:**

```
Unit Created ✓

  • Assign Tenant        [Create Tenant →]
  • Leave Vacant         [View Unit →]
```

---

### Tenant created

**Current:** Detail page success card; no lease continuation.

**Required:**

```
Tenant Created ✓

  • Assign to Unit       (if unassigned)
  • Create Lease         [Create Lease →]
  • View Tenant Profile  [View →]
```

---

### Lease created

**Required chain continuation:**

```
Lease Created ✓

  • Activate Lease       (if draft)
  • Generate Rent Charge [Create Charge →]
  • Record Payment       [Record Payment →]
```

Use existing lease status and financial routes — presentation only.

---

## Shared component: `WorkflowSuccessPanel`

Replace duplicated `?from=` Card patterns with one presentation component.

**Props (presentation):**

```typescript
type WorkflowSuccessPanelProps = {
  title: string;                    // "Property Created"
  description?: string;
  steps?: SetupProgressStep[];      // optional progress rail
  actions: WorkflowAction[];        // primary + secondary CTAs
  onDismiss?: () => void;
};
```

**Locations to migrate:**

- `units/new/page.tsx` (property-created banner)
- `tenants/new/page.tsx` (unit-created banner)
- `tenants/[tenantId]/page.tsx` (tenant-created)
- `leases/[leaseId]/page.tsx` (lease-created)
- `maintenance/[workOrderId]/page.tsx` (work-order-created)
- `organization-foundation-panel.tsx` (org-created)

---

## P2 — Polished success experiences

Upgrade from toast-only or minimal banners to:

- Checkmark header with brand accent
- One-line confirmation ("Everything looks good.")
- Single primary recommended action
- Secondary skip/dismiss

No new toast library — use existing `@mpa/ui` Card/Badge/Button patterns.

---

## Non-goals

- Do not change form submission logic or API payloads
- Do not add new entity types or workflow states
- Do not auto-create related records (user must confirm each step)

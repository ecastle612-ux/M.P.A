# 03 — Workflow Test Library

**Package:** QA-001  
**Status:** Draft — Ready for Approval

---

## Purpose

Reusable **scenario helpers** compose Page Objects into role workflows. Tests stay thin; library owns multi-step business paths. Future AI personas call the same workflow APIs ([08](./08-ai-test-personas.md)).

```
workflows/
  pm/
    onboard-org.ts
    create-property-with-units.ts
    create-tenant-and-lease.ts
    publish-announcement.ts
    triage-work-order.ts
  resident/
    read-messages.ts
    submit-maintenance.ts
    read-announcement.ts
  vendor/
    accept-and-complete-work-order.ts
  owner/
    review-property-and-comms.ts
  shared/
    login.ts
    assert-nav-permissions.ts
```

---

## Priority tiers

| Tier | When it runs | Criteria |
|------|--------------|----------|
| **P0 Smoke** | Every PR + main | Broken = block merge; < 15 min |
| **P1 Regression** | Nightly + RC | Core money/ops/comms paths |
| **P2 Expansion** | Nightly / weekly | Depth, edge portals, visual matrix |

---

## Property Manager scenarios

| ID | Scenario | Tier | Steps (summary) |
|----|----------|------|-----------------|
| WF-PM-01 | New user setup | P0 | Signup → Complete Profile → Create Org → land dashboard/setup progress |
| WF-PM-02 | Create property | P0 | Login → Properties → New → save → detail visible |
| WF-PM-03 | Add units | P0 | Property → add unit(s) → list shows units |
| WF-PM-04 | Add tenant | P0 | Tenants → create → linked property/unit |
| WF-PM-05 | Create lease | P1 | Lease form → bind tenant/unit → active/draft state |
| WF-PM-06 | Send announcement | P1 | Communications → create → publish → listed |
| WF-PM-07 | Maintenance triage | P1 | Open WO → update status / assign path available |
| WF-PM-08 | Vendor create | P2 | Vendors → create → detail |
| WF-PM-09 | Financial charge smoke | P1 | Create charge (test) → appears in list |
| WF-PM-10 | Ops / Command shells | P0 | Load Operations Center + Command Center without error |
| WF-PM-11 | Profile / settings | P0 | Update profile fields → persist on reload |
| WF-PM-12 | Permissions | P1 | Restricted role denied forbidden route |

---

## Resident scenarios

| ID | Scenario | Tier | Steps |
|----|----------|------|-------|
| WF-RE-01 | Portal login | P0 | Login → resident shell |
| WF-RE-02 | Read announcement | P1 | Announcements inbox → open item |
| WF-RE-03 | Messages | P1 | Open messages / thread list |
| WF-RE-04 | Submit maintenance | P0 | New request → submit → confirmation |
| WF-RE-05 | Upload maintenance photo | P2 | Attach image via MediaUpload when API-002A shipped |
| WF-RE-06 | Preferences | P2 | Notification preferences save |

---

## Vendor scenarios

| ID | Scenario | Tier | Steps |
|----|----------|------|-------|
| WF-VE-01 | Accept work order | P1 | Open assigned WO → accept |
| WF-VE-02 | Upload completion photos | P2 | Attach photos (media foundation) |
| WF-VE-03 | Complete work order | P1 | Mark complete → status reflected |

---

## Owner scenarios

| ID | Scenario | Tier | Steps |
|----|----------|------|-------|
| WF-OW-01 | Portal login | P1 | Owner shell loads |
| WF-OW-02 | View property | P1 | Property summary visible |
| WF-OW-03 | Read communications | P2 | Announcements / messages as exposed |
| WF-OW-04 | Review reports / statements | P2 | Owner statement list/detail when available |

---

## Cross-cutting scenarios

| ID | Scenario | Tier |
|----|----------|------|
| WF-X-01 | Auth session expiry / logout | P1 |
| WF-X-02 | Navigation IA smoke (primary nav links) | P0 |
| WF-X-03 | Responsive shell (mobile nav) | P1 |
| WF-X-04 | Dark/light if supported | P2 |

---

## Coverage map (modules → workflows)

| Module | Primary workflows |
|--------|-------------------|
| Authentication | shared/login, WF-X-01 |
| Setup Wizard | WF-PM-01 |
| Organizations | WF-PM-01 |
| Properties / Units | WF-PM-02, 03 |
| Tenants / Leases | WF-PM-04, 05 |
| Maintenance | WF-PM-07, WF-RE-04, WF-VE-* |
| Vendors | WF-PM-08, WF-VE-* |
| Communications | WF-PM-06, WF-RE-02 |
| Financials | WF-PM-09, WF-OW-04 |
| Notifications | preferences + center smoke |
| Resident / Owner portals | WF-RE-*, WF-OW-* |
| Command / Ops | WF-PM-10 |
| Profile / Settings | WF-PM-11 |
| Permissions | WF-PM-12 |

---

## Assertion philosophy

- Assert **user-visible outcomes** (URL, headings, table rows, toasts), not implementation details
- Prefer role/name queries
- Soft-assert console errors: fail on unexpected `pageerror` / 5xx in critical suites
- Do not assert AI-generated prose content

---

## Extensibility for AI personas

Each workflow exports:

```ts
export async function createPropertyWithUnits(ctx: WorkflowContext, input: CreatePropertyInput): Promise<CreatePropertyResult>
```

Personas later orchestrate these functions with LLM planning; humans write the deterministic primitives now.

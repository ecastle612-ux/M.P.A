# 03 — User Personas

## Overview

M.P.A. serves a **multi-sided operational graph**: property managers run the platform, but owners, tenants, and vendors are first-class participants — not secondary portals bolted on later.

Each persona has different permissions, workflows, and success criteria. Architecture and UX must account for all of them from day one.

---

## Primary Personas

### 1. Portfolio Property Manager (Primary Buyer)

**Role:** Operations lead at a property management company managing 50–500+ doors.

| Attribute | Detail |
|-----------|--------|
| Goals | Maximize occupancy, minimize owner churn, control maintenance spend, stay compliant |
| Pain | Context switching across tools; owner reporting labor; vendor reliability |
| Tech comfort | High on desktop; expects software to match professional workflow speed |
| M.P.A. value | Unified OS, AI-assisted reporting, vendor marketplace, workflow visibility |

**Key workflows:** Owner reporting, maintenance oversight, leasing pipeline, vendor management, rent collection monitoring.

**Permission model:** Organization `admin` or `manager`.

---

### 2. Leasing Coordinator

**Role:** Handles marketing, applications, screening, lease execution, move-in.

| Attribute | Detail |
|-----------|--------|
| Goals | Fill vacancies fast with qualified tenants; error-free leases |
| Pain | Application scatter; screening delays; document version chaos |
| Tech comfort | Moderate; lives in lists, calendars, and document flows |
| M.P.A. value | Connected leasing pipeline, screening integration, AI lease review |

**Key workflows:** Application → screening → lease signing → move-in.

**Permission model:** Organization `manager` or `member` with leasing scope.

---

### 3. Maintenance Coordinator

**Role:** Triage, assign, and verify maintenance across portfolio.

| Attribute | Detail |
|-----------|--------|
| Goals | Fast resolution, cost control, owner/tenant satisfaction |
| Pain | Vendor no-shows; unclear priorities; invoice reconciliation |
| Tech comfort | Moderate; mobile/tablet for field coordination |
| M.P.A. value | Prioritized queue, vendor matching, photo/document trail |

**Key workflows:** Work order → vendor assignment → completion → invoice → owner visibility.

**Permission model:** Organization `manager` or `member` with maintenance scope.

---

### 4. Property Owner (External Stakeholder)

**Role:** Investor who hires the PM company; wants transparency, not software labor.

| Attribute | Detail |
|-----------|--------|
| Goals | Return on investment, low vacancy, clear financial picture |
| Pain | Infrequent opaque reports; surprise expenses; slow communication |
| Tech comfort | Low to moderate; checks reports on phone |
| M.P.A. value | Automated owner summaries, approval flows, document access |

**Key workflows:** Review reports, approve expenses, view property performance.

**Permission model:** `owner` role scoped to specific properties — **not** organization members.

**Architectural implication:** Owner access is a separate authorization dimension from PM org membership.

---

### 5. Tenant (External Stakeholder)

**Role:** Resident under lease; interacts for payments, maintenance, notices.

| Attribute | Detail |
|-----------|--------|
| Goals | Responsive maintenance, clear rent obligations, easy communication |
| Pain | Unanswered requests; unclear status; payment confusion |
| Tech comfort | Mobile-first expectations |
| M.P.A. value | Status visibility, self-service maintenance requests, payment clarity |

**Key workflows:** Pay rent, submit maintenance, receive notices, move-out.

**Permission model:** `tenant` role scoped to active lease.

---

### 6. Vendor (Marketplace Participant)

**Role:** Maintenance, cleaning, landscaping, or specialty contractor in the M.P.A. marketplace.

| Attribute | Detail |
|-----------|--------|
| Goals | Steady job flow, fast payment, clear scope |
| Pain | Chasing PMs for details; payment delays; scope disputes |
| Tech comfort | Mobile; wants minimal admin |
| M.P.A. value | Job inbox, structured scope, marketplace reputation, Stripe payouts |

**Key workflows:** Accept job → complete → invoice → get paid.

**Permission model:** `vendor` identity linked to marketplace profile; may serve multiple PM organizations.

**Architectural implication:** Vendors are **cross-tenant marketplace entities**, not sub-records of a single PM org.

---

## Secondary Personas

### 7. Bookkeeper / Accountant
Integrates with accounting; needs export integrity and audit trails. Read-heavy, export-focused.

### 8. Portfolio Owner / Executive
Multi-market oversight; cares about KPIs, staff efficiency, owner retention — not individual work orders.

### 9. M.P.A. Internal Admin (Platform Operator)
SaaS operator for support, billing, vendor verification, abuse prevention. Distinct from PM org admins.

---

## Persona × Workflow Matrix

| Workflow | PM | Leasing | Maintenance | Owner | Tenant | Vendor |
|----------|:--:|:-------:|:-----------:|:-----:|:------:|:------:|
| Property setup | ● | ○ | ○ | ○ | — | — |
| Marketing / leasing | ○ | ● | — | ○ | ○ | — |
| Rent collection | ● | ○ | — | ● | ● | — |
| Maintenance | ○ | — | ● | ○ | ● | ● |
| Owner reporting | ● | — | — | ● | — | — |
| Vendor marketplace | ● | — | ● | — | — | ● |

● = primary actor · ○ = involved · — = not applicable

---

## Implications for Architecture

1. **Four authorization planes:** PM organization, owner property scope, tenant lease scope, vendor marketplace identity.
2. **Separate portal experiences** with shared backend — not one dashboard with hidden buttons.
3. **Vendor domain is cross-org** — marketplace data model must not be nested inside a single PM `organization_id`.
4. **AI outputs differ by persona** — owner summaries ≠ internal ops briefings.

See **09 Database Architecture** and **14 Security Standards** for enforcement details.

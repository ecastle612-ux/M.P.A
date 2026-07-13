# 08 — Software Architecture

## System Overview

M.P.A. is a multi-sided, workflow-connected SaaS platform built on:

| Layer | Technology |
|-------|------------|
| Web client | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Payments | Stripe Connect |
| AI | OpenAI API (via Edge Functions) |
| Deployment | Vercel (web), Supabase (backend) |
| Version control | GitHub |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Applications                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  PM Portal   │  │ Owner Portal │  │Tenant Portal │  │Vendor Portal│ │
│  │  (desktop+)  │  │  (responsive)│  │   (mobile+)  │  │  (mobile+)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────┘
          │                 │                 │                 │
          └─────────────────┴────────┬────────┴─────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Next.js (Vercel)                                 │
│  App Router · SSR/SSG · Middleware (session) · Thin BFF routes          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────┐
│ Supabase Auth   │   │ PostgreSQL + RLS    │   │ Edge Functions  │
│ (multi-role)    │   │ (operational graph) │   │ (business logic)│
└─────────────────┘   └──────────┬──────────┘   └────────┬────────┘
                                 │                       │
                                 ▼                       ▼
                    ┌─────────────────────┐   ┌─────────────────────┐
                    │  Supabase Storage  │   │ External Services   │
                    │  (documents)       │   │ Stripe · OpenAI ·   │
                    └─────────────────────┘   │ Email · Screening   │
                                            └─────────────────────┘
```

---

## Architectural Principles

1. **Workflow-first** — capabilities serve business workflows, not module menus
2. **API-first** — all clients call the same backend contracts
3. **RLS-enforced security** — authorization in PostgreSQL, not application hope
4. **Events connect workflows** — domain events drive automation and AI triggers
5. **Edge Functions own business rules** — mutations with logic live server-side
6. **Thin clients** — UI renders and orchestrates; does not decide business outcomes
7. **Extract later** — start simple repo; monorepo when mobile justifies it

---

## Repository Structure (Phase 1 — Pre-Monorepo)

```
mpa/
├── docs/                         # MPA Blueprint (this system)
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed.sql
│   └── config.toml
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   ├── (auth)/
│   │   ├── (pm)/                 # PM organization portal
│   │   ├── (owner)/              # Owner portal
│   │   ├── (tenant)/             # Tenant portal
│   │   ├── (vendor)/             # Vendor marketplace portal
│   │   └── api/                  # Thin BFF only
│   ├── workflows/                # Workflow-stage code (primary organization)
│   │   ├── property-setup/
│   │   ├── leasing/
│   │   ├── rent-collection/
│   │   ├── maintenance/
│   │   ├── vendor-marketplace/
│   │   ├── owner-reporting/
│   │   └── move-out/
│   ├── domains/                  # Shared domain models, queries, validators
│   │   ├── property/
│   │   ├── lease/
│   │   ├── work-order/
│   │   ├── marketplace/
│   │   └── financial/
│   ├── components/
│   │   ├── layout/               # Operations console, portals shells
│   │   ├── patterns/             # Workflow rail, timeline, command palette
│   │   └── providers/
│   ├── design-system/            # Tokens, primitives (extract to package later)
│   ├── lib/
│   │   ├── supabase/
│   │   ├── stripe/
│   │   └── events/
│   ├── hooks/
│   └── middleware.ts
├── public/                       # PWA manifest, icons
├── .github/workflows/
└── package.json
```

**Note:** `workflows/` is the primary organizational unit. `domains/` holds shared data access and types used across workflow stages.

---

## Layer Responsibilities

| Layer | Responsibility | Does NOT |
|-------|----------------|----------|
| **React UI** | Render workflow state, collect input, show AI suggestions | Enforce authorization, apply business rules |
| **TanStack Query** | Cache, sync, invalidate server state | Replace event-driven workflows |
| **Next.js Middleware** | Session refresh, portal routing guard | Business logic |
| **Server Components** | Initial data fetch via RLS | Complex mutations |
| **Edge Functions** | Business mutations, integrations, event processing | Simple reads better done via RLS |
| **PostgreSQL + RLS** | Data authority, authorization | UI concerns |
| **Storage** | Documents, photos, signed PDFs | Metadata without DB records |

---

## Domain Event Architecture

### Event Flow

```
Mutation (Edge Function)
        │
        ▼
  Write business data
        │
        ▼
  Insert domain_event (same transaction)
        │
        ▼
  Event consumer (Edge Function / cron)
        │
        ├── Trigger downstream workflow step
        ├── Enqueue notification
        ├── Invoke AI pipeline
        └── Update materialized views
```

### Event Schema (Conceptual)

```typescript
type DomainEvent = {
  id: string
  event_type: string          // e.g. 'lease.signed'
  aggregate_type: string      // e.g. 'lease'
  aggregate_id: string
  organization_id: string | null
  actor_id: string
  payload: Record<string, unknown>
  created_at: string
  processed_at: string | null
}
```

### Core Event Taxonomy (Initial)

| Event | Triggers |
|-------|----------|
| `property.activated` | Enable leasing workflow |
| `lease.signed` | Move-in tasks, rent schedule |
| `rent.overdue` | Reminder sequence, risk signal |
| `work_order.created` | Prioritization, notification |
| `work_order.assigned` | Vendor notification, SLA clock |
| `vendor.job_completed` | Invoice workflow, owner update |
| `owner_report.draft_ready` | PM review queue |
| `move_out.completed` | Turnover workflow |

---

## Multi-Portal Architecture

Each portal is a Next.js route group with:
- Dedicated layout shell
- Portal-specific navigation
- Middleware auth guard checking actor type
- Shared `domains/` and `design-system/`

| Portal | Primary Actor | Auth Check |
|--------|---------------|------------|
| `(pm)` | Organization member | `organization_members` + role |
| `(owner)` | Property owner | `owner_property_access` |
| `(tenant)` | Resident | `tenant_lease_access` |
| `(vendor)` | Marketplace vendor | `marketplace_vendor_profiles` |

---

## State Management

| State | Tool |
|-------|------|
| Server/async data | TanStack Query v5 |
| Auth session | Supabase SSR + context |
| Active organization | URL param + context (PM portal) |
| UI ephemeral | `useState` |
| Cross-component UI | Zustand (minimal) |
| URL/filter state | `nuqs` |

---

## PWA Strategy

- `manifest.json` + icons in `public/`
- Service worker: cache app shell and static assets
- No offline mutations in v1
- Install prompt on supported desktop browsers
- Push notifications: deferred to native mobile phase; architecture leaves event hooks

---

## Environments

| Environment | Web | Supabase | Stripe |
|-------------|-----|----------|--------|
| Local | localhost | CLI Docker | Test |
| Preview | Vercel preview | Staging project | Test |
| Staging | staging.mpa.app | Staging | Test |
| Production | app.mpa.app | Production | Live |

---

## CI/CD Pipeline

```
PR opened
  → lint + typecheck
  → unit tests
  → RLS integration tests (Supabase local)
  → preview deploy (Vercel)

Merge to main
  → staging deploy
  → migration apply (staging)
  → E2E smoke tests

Release tag
  → production deploy (approval gate)
  → migration apply (production)
```

---

## Supplementary Documents

- [Architecture Review (Critical)](./architecture-review.md)
- [Architecture Improvements Before Development](./architecture-improvements.md)

## Related Blueprint Docs

- **09** Database Architecture
- **10** API Standards
- **13** AI Strategy
- **14** Security Standards
- **18** Decision Log

# Architecture Review (Critical)

## Purpose

Honest assessment of the initial architecture proposal (pre-Blueprint). This review challenges assumptions and identifies risks before any production code is written.

**Reviewer stance:** Prepare for thousands of property managers, multi-sided marketplace, embedded AI, and years of maintenance — not a weekend MVP.

---

## Executive Summary

The initial proposal established a **solid baseline** (Supabase + RLS, API-first Edge Functions, feature folders, TanStack Query, monorepo path). However, it was **module-oriented** when the product is **workflow-oriented**, **under-specified** on the Vendor Marketplace and multi-sided auth, and **premature** in some structural complexity (multi-schema PostgreSQL, full monorepo) while **under-investing** in event-driven workflow infrastructure that a connected OS requires.

**Verdict:** Foundation is directionally correct. Material revisions required before development — see [Architecture Improvements](./architecture-improvements.md).

---

## Architectural Weaknesses

### 1. Module-First Thinking (Critical)

**Issue:** Initial structure organized code by domain modules (`features/properties`, `features/leases`) mirroring traditional PM software silos.

**Why it matters:** M.P.A. product philosophy demands workflow continuity. Module boundaries encourage duplicate models, disconnected navigation, and "which app am I in?" UX — the exact problem we are solving.

**Correction:** Organize product and engineering around **workflows** (05) with a shared **operational graph** data model. Code may still use domain folders, but they serve workflow stages — not product silos.

---

### 2. Vendor Marketplace Treated as Secondary (Critical)

**Issue:** Initial proposal mentioned maintenance and vendors but did not define marketplace as a first-class domain. Vendor as a contact on a work order is insufficient.

**Why it matters:** Marketplace introduces **cross-organization identity**, reputation, compliance, bidding, and Stripe Connect payouts — a different tenancy shape than PM org data.

**Correction:** Dedicated `marketplace` schema/domain with vendor identity decoupled from any single PM organization. See **09 Database Architecture**.

---

### 3. Single-Dimension Tenancy (Critical)

**Issue:** Initial proposal used `organization_id` on all tables with org-member roles. This models PM company staff but not **owners** (property-scoped), **tenants** (lease-scoped), or **vendors** (marketplace-scoped).

**Why it matters:** Four authorization planes exist (03 Personas). Forcing owners and tenants into `organization_members` creates security risk and conceptual confusion.

**Correction:** Separate authorization models per actor type with property/lease scoping. RLS policies per plane.

---

### 4. Missing Workflow Event Layer (High)

**Issue:** Initial proposal mentioned Edge Functions and Server Actions but no **domain event** system for workflow handoffs (`lease.signed` → schedule move-in → activate rent).

**Why it matters:** Without events, workflow connections become brittle point-to-point calls. Adding automation and AI triggers becomes spaghetti.

**Correction:** Introduce `domain_events` table + outbox pattern. Edge Functions as event consumers. Do not over-engineer with Kafka at v1 — Postgres-backed events are sufficient.

---

### 5. AI as Schema Afterthought (High)

**Issue:** Initial proposal included an `ai` schema for conversations/logs — implying chatbot storage.

**Why it matters:** M.P.A. AI is embedded across workflows, not a sidebar chat. AI needs **suggestion records**, **embedding storage**, **feedback loops**, and **audit** — not chat history tables.

**Correction:** See **13 AI Strategy** — `ai_suggestions`, `ai_feedback`, `embeddings` with workflow entity references.

---

## Scalability Concerns

### Database / RLS

| Concern | Detail |
|---------|--------|
| RLS policy performance | At thousands of orgs with millions of rows, per-query policy joins on `organization_members` must be indexed and benchmarked |
| Multi-schema overhead | Five PostgreSQL schemas add migration and join complexity before we have scale problems — premature |
| Full-text search | PostgreSQL FTS won't carry natural language search at scale — plan pgvector + embedding index early |
| Document storage | Supabase Storage without lifecycle rules → unbounded cost. Need retention, tiering, and org quotas |

### Application

| Concern | Detail |
|---------|--------|
| Edge Function cold starts | Workflow automations sensitive to latency need warm strategies or critical path in DB triggers |
| TanStack Query cache | Large portfolios need pagination, virtualized lists, and server-side filtering — not client fetch-all |
| Realtime subscriptions | Supabase Realtime on high-churn tables (work orders) needs channel scoping per org — avoid broadcast storms |

### Marketplace

| Concern | Detail |
|---------|--------|
| Cross-org vendor queries | Marketplace search is inherently multi-tenant — needs different indexing strategy than org-scoped CRUD |
| Reputation integrity | Fraudulent ratings at scale require verification rules and anomaly detection |

---

## Unnecessary Complexity (Challenge Initial Recommendations)

### Disagree: Full Monorepo on Day One

**Initial recommendation:** Turborepo with `apps/web`, `apps/mobile`, `packages/ui`, `packages/shared`, etc.

**Challenge:** Mobile does not exist. Empty `apps/mobile` and multi-package tooling impose CI overhead, version coordination, and slower onboarding for every engineer — before we have shared code to justify it.

**Revised recommendation:** Start with a **well-structured single Next.js repository** with `src/` boundaries that *extract cleanly* into a monorepo when mobile development begins (est. 6–12 months). Pre-define package boundaries in folder structure without Turborepo machinery.

**Exception:** If team is 3+ engineers from day one, monorepo may be justified earlier.

---

### Disagree: PostgreSQL Multi-Schema on Day One

**Initial recommendation:** Separate schemas (`property`, `leasing`, `maintenance`, `billing`, `integrations`, `ai`).

**Challenge:** Cross-workflow queries constantly join across domains (lease + work order + invoice). Multi-schema adds `search_path` friction, harder local debugging, and complicates Supabase type generation — without isolation benefits (we are not multi-service).

**Revised recommendation:** Single `public` schema with **table prefix namespacing** (`property_units`, `lease_agreements`, `marketplace_vendors`) until true separation need emerges. Use Postgres schemas only for `audit` and `internal` if required.

---

### Agree: RLS Everywhere

Non-negotiable for multi-tenant SaaS on Supabase. Keep this.

---

### Disagree: Server Actions for Significant Mutations

**Initial recommendation:** Server Actions for web form mutations.

**Challenge:** Server Actions are Next.js-specific. Mobile cannot call them. Any mutation mobile will need must live in Edge Functions or direct Supabase with RLS anyway.

**Revised recommendation:** **Edge Functions for all workflow mutations** that involve business rules, third-party APIs, or multi-table transactions. Server Actions only as thin wrappers for web-specific ergonomics where they call the same underlying function. Prefer direct RLS-guarded inserts only for trivial CRUD.

---

## Future Maintenance Risks

| Risk | Mitigation |
|------|------------|
| Supabase vendor lock-in | Abstract Stripe/OpenAI behind internal service interfaces; document escape routes in ADR |
| RLS policy sprawl | Policy templates per entity type; mandatory integration tests per policy |
| Edge Function duplication | Shared `_shared/` module; single validation source in Zod schemas |
| Type drift | Generated DB types in CI; fail build on migration without regen |
| Workflow logic in UI | Lint rule: no business rules in React components — enforce in review |
| AI prompt sprawl | Centralized prompt registry with version numbers |

---

## Security Concerns

| Concern | Severity | Notes |
|---------|----------|-------|
| Owner/tenant data leakage via RLS gaps | Critical | Separate policy suites per actor type; pen-test checklist |
| Service role key exposure | Critical | Edge Functions only; never in Next.js client bundle |
| Stripe webhook replay | High | Idempotency keys; event dedup table |
| Vendor PII across orgs | High | Marketplace profiles expose limited fields; full PII only post-assignment |
| AI prompt injection via tenant messages | High | Sanitize user content before LLM; scope retrieval to authorized data |
| Document access via Storage URLs | High | Signed URLs with short TTL; path policies mirror RLS |
| Org invitation hijacking | Medium | Time-limited tokens; email verification |

---

## Database Improvements

1. **Operational graph model** — properties, units, leases, work orders, invoices as nodes; relationships explicit
2. **Domain events table** — workflow automation backbone
3. **Marketplace schema separation** — vendor identity cross-org
4. **Actor-scoped access tables** — `owner_property_access`, `tenant_lease_access` distinct from `organization_members`
5. **Soft delete + audit** on all financial and legal entities
6. **Idempotency table** for webhooks and payment operations
7. **pgvector** for document and operational search
8. **Materialized views** for owner reports (performance at scale)

---

## UI Architecture Improvements

1. **Workflow Rail component** — first-class shared pattern, not per-feature hack
2. **Operations Console layout** — master-detail with action queue
3. **Command palette** — global from v1
4. **Portal separation** — route groups per persona (`(pm)`, `(owner)`, `(tenant)`, `(vendor)`)
5. **Design token package** before feature components
6. **Virtualized data tables** for portfolio-scale lists

---

## API Improvements

1. **Workflow-oriented Edge Functions** named by business action (`assign-vendor`, `publish-owner-report`) not entity (`update-work-order`)
2. **Event consumers** for async workflow steps
3. **Versioned API contract** (`/v1/`) even for Edge Functions
4. **Webhook ingress** unified through `integrations_webhook_events` with replay support
5. **BFF minimization** — Next.js `app/api` only for SSR cookie bridging and Vercel-specific needs

---

## Technical Debt Prevention Opportunities

| Opportunity | Impact |
|-------------|--------|
| ADR before every structural decision | Prevents silent drift |
| RLS integration tests in CI | Prevents security debt |
| Zod schemas shared between client/server/Edge | Prevents validation drift |
| Workflow event log from day one | Prevents automation spaghetti |
| Prompt registry for AI | Prevents unversioned prompt debt |
| Feature flags (e.g., LaunchDarkly or simple DB flags) | Safe rollout for AI and marketplace |

---

## What the Initial Proposal Got Right

- Supabase as unified backend (auth, DB, storage, functions) — correct for multi-client strategy
- RLS as authorization enforcement — non-negotiable, keep
- TanStack Query for server state — correct
- Stripe Connect at boundary — correct (don't build payments)
- PWA-first with desktop optimization — correct
- Environment variable discipline — correct
- Testing pyramid with RLS integration tests — correct instinct
- API-first for mobile future — correct principle (execution needs refinement)

---

## Conclusion

The initial architecture is a **competent SaaS starter template** but **not yet** an AI Property Operations Platform architecture. Revisions are required in tenancy model, marketplace domain, workflow events, AI data model, and simplification of premature structural complexity.

**Development gate:** All P0 items in [Architecture Improvements](./architecture-improvements.md) must be approved before scaffolding.

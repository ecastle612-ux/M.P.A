# Architecture Improvements Before Development

## Status: Required Before Production Code

Prioritized changes identified during critical architecture review. **P0 items are development blockers.**

---

## P0 — Development Blockers

### 1. Adopt Workflow-First Architecture
**Impact:** Critical  
Replace module-first thinking with workflow-stage organization. Every schema table, API endpoint, and UI route must map to a defined business workflow (see **05**).  
**Action:** Add workflow ID to engineering templates and PR checklist.

### 2. Define Four-Plane Authorization Model
**Impact:** Critical  
PM org members, owners (property-scoped), tenants (lease-scoped), and vendors (marketplace-scoped) require separate access tables and RLS policy suites. A single `organization_members` model is insufficient.  
**Action:** Document in **09** and **14**; design `owner_property_access`, `tenant_lease_access`, `marketplace_vendor_profiles`.

### 3. Elevate Vendor Marketplace to First-Class Domain
**Impact:** Critical  
Vendor identity, compliance, reputation, bidding, and payouts are cross-org — not nested records inside a PM organization.  
**Action:** Dedicated marketplace data model; vendor portal route group; Stripe Connect payout flow designed before maintenance workflow ships.

### 4. Introduce Domain Event System
**Impact:** Critical  
Workflow handoffs (`lease.signed`, `work_order.created`, `vendor.assigned`) require an event log and async consumers — not point-to-point function calls.  
**Action:** `domain_events` table + outbox pattern; Edge Function consumers; event taxonomy document.

### 5. Redesign AI Data Model (No Chatbot Core)
**Impact:** Critical  
Replace chat-centric `ai` schema concept with embedded AI artifacts: suggestions, drafts, rankings, feedback, embeddings — all linked to workflow entities.  
**Action:** Implement **13 AI Strategy** data structures before any AI feature code.

### 6. Simplify Initial Repository Structure
**Impact:** High (blocker for team velocity)  
Defer Turborepo monorepo until mobile development begins. Use single repo with clean extraction boundaries.  
**Action:** ADR-001 revision; folder structure with future package boundaries noted in comments/docs.

### 7. Simplify Database Schema Strategy
**Impact:** High  
Defer multi-schema PostgreSQL. Use single schema with consistent table prefix namespacing.  
**Action:** Update **09** naming conventions; reserve schemas for `audit` only if needed.

---

## P1 — High Impact (Address During Foundation Sprint)

### 8. Edge Functions Own Business Mutations
All workflow mutations with business rules go through Edge Functions — not Server Actions alone. Server Actions become thin web wrappers where ergonomics help.  
**Rationale:** Mobile parity; auditable business logic.

### 9. Unified Webhook Ingress
Stripe, screening providers, eSignature — all ingress through `integrations_webhook_events` with idempotency and replay.  
**Rationale:** Payment and integration bugs are company-killing events.

### 10. Portal-Separated Route Architecture
Distinct Next.js route groups: `(pm)`, `(owner)`, `(tenant)`, `(vendor)` with separate layouts and auth gates.  
**Rationale:** Multi-sided product; prevents permission UI leakage.

### 11. Design Token System Before Components
Semantic tokens and typography finalized in design system package before feature UI.  
**Rationale:** Prevents generic template drift (06 Design Language).

### 12. Operational Console as Default PM Landing
Action queue first, analytics second.  
**Rationale:** UX principles; differentiates from dashboard-template SaaS.

### 13. pgvector for Search Foundation
Add embedding column infrastructure and indexing strategy before AI search features.  
**Rationale:** Retrofitting vector search is expensive.

### 14. RLS Integration Test Gate in CI
No migration merges without RLS policy tests per affected table.  
**Rationale:** Security regression prevention at scale.

### 15. Document Retention and Storage Quotas
Supabase Storage lifecycle per organization — retention policy, max storage, signed URL TTL.  
**Rationale:** Unbounded storage is a margin killer.

---

## P2 — Medium Impact (Early Production Phase)

### 16. Materialized Views for Owner Reports
Pre-aggregated financial/operational summaries per property per period.  
**Rationale:** Report generation at 500+ doors must not be live-join queries.

### 17. Feature Flag System
Progressive rollout for AI and marketplace features.  
**Rationale:** Safe commercial launch.

### 18. Centralized Prompt Registry
Versioned AI prompts with changelog — not inline strings.  
**Rationale:** AI behavior drift is a support nightmare.

### 19. Command Palette (⌘K)
Global search and action launcher in v1.  
**Rationale:** Premium desktop SaaS expectation; natural language search entry point.

### 20. Virtualized List Components
All portfolio-scale tables use virtualization.  
**Rationale:** Performance at 1000+ row lists.

### 21. Observability Stack
Sentry + structured JSON logging in Edge Functions + uptime monitoring before production launch.  
**Rationale:** Commercial SLA expectations.

### 22. ADR Process Formalized
Every architectural decision recorded in **18 Decision Log** before implementation.  
**Rationale:** Onboarding and accountability.

---

## P3 — Lower Impact (Scale Phase)

### 23. Extract Monorepo When Mobile Begins
Migrate to Turborepo with `apps/mobile`, shared packages — when iOS/Android development starts.

### 24. Read Replicas / Caching Layer
When report queries or marketplace search stress primary DB.

### 25. Background Job Runner Evaluation
If Edge Function timeouts or cron granularity become limiting — evaluate Inngest, Trigger.dev, or equivalent.

### 26. Multi-Region Consideration
When customer base expands beyond primary geography — Supabase region strategy.

---

## Explicitly Rejected (Do Not Pursue)

| Proposal | Reason |
|----------|--------|
| Redux / global client state store | TanStack Query + minimal Zustand sufficient |
| Microservices split | Supabase monolith correct for current scale |
| Custom payment processing | Stripe Connect is the boundary |
| AI chatbot as primary interface | Violates product philosophy |
| Module-based product navigation | Violates workflow-first principle |
| Building full accounting GL | Integrate QuickBooks etc. |

---

## Approval Checklist

Before development begins, stakeholders must confirm:

- [ ] P0 items 1–7 reviewed and accepted
- [ ] Four-plane authorization model approved
- [ ] Vendor Marketplace domain model approved
- [ ] Domain event taxonomy draft approved
- [ ] AI embedded strategy approved (not chatbot-first)
- [ ] Repository and schema simplification accepted
- [ ] Development Roadmap (17) sequencing accepted

**Gate owner:** Lead Software Architect  
**Next step after approval:** Foundation scaffold only (auth, org, events, design tokens)

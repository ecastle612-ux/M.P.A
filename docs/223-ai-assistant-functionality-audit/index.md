# 223 — Final AI Assistant Functionality Audit

**Canonical number:** **223** (reconciled). This record was first written as docs/222 on a parallel branch while FO-EFF Slice 6 Production Release also used docs/222. **Certification meaning is unchanged.** Slice 6 Production remains canonical docs/222.

**Status:** **AI ASSISTANT FULL FUNCTIONALITY AUDIT PASS — READY FOR ONBOARDING**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — Final AI Assistant Functionality Audit. Audit first. Do not invent a new AI product. Do not deploy.  
**Design / ADRs:** [ADR-006](../18-decision-log/adr-006-embedded-ai-not-chatbot.md) (**Accepted** — embedded AI, not chatbot) · [docs/13](../13-ai-strategy/index.md) (designed, not implemented) · [docs/31](../31-bug-003-004-landing-acquisition/landing-page-verification.md) (generative assistant **not advertised**) · [ADR-019](../18-decision-log/adr-019-product-constitution.md) · [ADR-033](../18-decision-log/adr-033-complete-operating-scope.md)  
**Preserves:** docs/204–206 public intake · Slice 1–5 Production · docs/214 sidebar · Slice 4 Search/Create/Recent · [docs/220](../220-fo-eff-slice5-production-release/index.md) Production · [docs/221](../221-fo-eff-slice6-deterministic-routing/index.md) in-repo routing  
**Production baseline:** docs/220 · SHA `eb81b07f7f073b411668ae7eb504868097474df6` · deploy `dpl_HQpPuRD3TknzY177TEqqKRMk2NBE`  
**In-repo line:** docs/221 · implement SHA `cf94c1b4984f87cb84781deab70bfe06a0e25426` · **not deployed**  
**Mode:** AUDIT + necessary in-repo P1 authz/honesty fix only. **Do not deploy. Do not create a chatbot. Do not process payments. Do not change Stripe, prices, M5, or July.**

---

## Verdict

**AI ASSISTANT FULL FUNCTIONALITY AUDIT PASS — READY FOR ONBOARDING**

The certified product does **not** ship a generative / conversational AI assistant. What exists is a **rule-based next-action briefing** labeled “M.P.A. Assistant,” plus Facility Mission Control **Needs Attention** (Slice 2) and staff **Global Search** (Slice 4). Those surfaces are authorized by the same server pipeline as the rest of the app.

Onboarding is **not** blocked by a missing chatbot. A chatbot was never an authorized, marketed, or implemented v1 capability (ADR-006, docs/13 foundation-not-built, docs/31 “Generative AI Assistant” explicitly not advertised).

This package does **not** invent a new AI product. It certifies the shipped briefing, closes one P1 permission gap in that briefing, and records Owner decisions for any future generative work.

**STOP.** Do not deploy from this package. Do not start a chat assistant.

---

## 1. AI architecture inventory

| Item | What exists today |
|------|-------------------|
| AI assistant route(s) | **None.** No `/api/ai`, `/api/assistant`, or chat page. Property briefing loads from `GET /api/pm/mission-control`. Facility attention loads from `GET /api/facility/mission-control`. |
| UI surface(s) | Property Mission Control card (`aria-label="M.P.A. Assistant briefing"`). Inline next-action cards on Property / Resident / Lease command centers. Finance desks show a rule-based “Assistant recommendation.” Demo has a static `assistantBrief`. Facility Mission Control is **Needs Attention**, not a chat. |
| Provider / model | **None.** No OpenAI, Anthropic, or AI SDK dependency. No `OPENAI_*` in `.env.example`. |
| Server services | `getMissionControlState` → `buildDailyOperationsBriefing` + `buildMissionControlNextAction`. Facility: `getFacilityMissionControlSnapshot`. Finance copy: `buildCommandCenterAssistantRecommendation`. All deterministic. |
| System prompts | **None.** Copy is TypeScript string builders (`packages/shared/src/property/journey.ts`, `daily-ops.ts`). |
| Tools / functions / actions | **None.** No tool loop. No mutations initiated by a model. |
| Data sources | Org-scoped Supabase reads: residential `maintenance_work_orders`, and — only when authorized — finance report, leases, residents, applications. Facility snapshot reads `work_surface = facility`. |
| Retrieval / context | Counts and lists from those queries. No embeddings, no pgvector, no `ai_suggestions` table. |
| Conversation persistence | **None.** No `ai_conversations`. Org switch re-fetches Mission Control (`activeOrganization.id` in the client effect). |
| Org / session | `requireAuthorizedAction`: auth → cookie org → membership → SKU entitlement → `effectiveSurfaces` → capability. |
| Role / permission filtering | After this package: briefing finance requires `pm.finance:read`; resident/lease queues require admin / property_manager / leasing_agent. Technicians do not receive those queues. |
| Write capabilities | Briefing is **read-only**. `markDailyOpsReviewed` is a manager-only journey flag, not an AI action. |
| Audit / logging | No AI-specific logger. Normal API auth failures return JSON `{ error }` without secrets. |
| Rate limits | No LLM loop to rate-limit. Standard Next.js route. |
| Failure / fallback | Mission Control shows “Mission Control could not load recommendations for this organization.” No stack, key, or provider internals. |

Designed-but-not-built (docs/13 / ADR-006): `ai_suggestions`, `ai_feedback`, `ai_embeddings`, `ai_prompt_registry`, Edge Function OpenAI calls. **No migrations exist for those tables.**

---

## 2. Current provider / model config

| Field | Production / repo |
|-------|-------------------|
| Provider | **None** |
| Model identifier | **None** |
| Required env names | **None required** for the shipped briefing. Repo examples do not define `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_MODEL`, or `AI_PROVIDER`. |
| Fallback | Workflows do not depend on a model. If Mission Control fails, the page shows a safe error and next-action fallbacks. |

Vercel MCP was not authenticated in this environment; secrets were not inspected. Classification: **not P0** — generative AI is not marketed as available (docs/31). Missing model config would be P0/P1 only if a chat were live.

---

## 3. Assistant surfaces

| Surface | Kind | Audience |
|---------|------|----------|
| `/pm/mission-control` | Rule-based briefing + daily ops lists | Property-entitled staff (`pm.properties:read` + `pm.mission_control`) |
| Property / Resident / Lease command centers | Next-action copy | Same PM staff APIs as those pages |
| Finance / collections / reporting desks | Rule-based money copy | Finance-capable users only |
| `/facility/mission-control` | Needs Attention (managers) / counts + My Work CTA (technicians) | Facility-entitled staff |
| Tenant portal | **No AI** | — |
| Master Admin | **No AI** | Operator nav is `/admin/*` only |
| Public landing | Product name “My Property Assistant”; generative assistant **not advertised** | Public |

---

## 4. Current capabilities

Classify the **shipped** assistant:

| Class | Supported? |
|-------|------------|
| A. Informational Q&A only | **No chat Q&A.** Briefing summarizes authorized counts. |
| B. Navigation / help | **Yes — scripted.** Next-action hrefs and quick actions. |
| C. Record lookup / search | **Not via AI.** Staff use Slice 4 Global Search. |
| D. Operational summaries | **Yes — rule-based** daily ops / Needs Attention. |
| E. Drafting | **No.** |
| F. Suggested actions | **Yes — scripted CTAs**, not model suggestions. |
| G. Actual mutations / actions | **No AI mutations.** |

Do **not** advertise write/action or natural-language lookup.

Questions such as “Find Unit 204,” “Find FR-2026-00002,” or “Who is the current resident?” are answered by **Global Search / record pages**, not by a model.

---

## 5. Current write / action capabilities

**Read-only.** The briefing never writes work orders, charges, payments, residents, assets, or routing rules.

The only nearby write is `markDailyOpsReviewed` (J7), restricted to `organization_admin` / `property_manager` when maintenance readiness is already true. That is a journey flag, not an assistant tool.

Financial and work-order mutations remain on their existing APIs with confirmation in the normal UI.

---

## 6. PM behavior

Authorized Property Operations managers get:

- Role-appropriate J0–J8 next action (`buildMissionControlNextAction`)
- Daily ops briefing from **residential** `work_surface` only
- Finance / delinquency / vendor payables **only if** `pm.finance:read`
- Resident / lease / application queues **only if** admin, property_manager, or leasing_agent

FO-only records are not queried (`work_surface = residential`). FO-only SKU / Complete FO-only scope cannot call `/api/pm/mission-control` (`pm.properties` entitlement stripped by `effectiveSurfaces`).

---

## 7. FO manager behavior

Facility managers use `/facility/mission-control` + `requireFacilityOperation(..., "facility.mission_control")`. Snapshot filters `work_surface = facility`. Needs Attention uses canonical Slice 2 categories (overdue, urgent, new public requests, unassigned, due today).

There is **no FO chat**. “Find FR-2026-00002” / “Find UAT-CHAIR-14” belong to **Global Search** and the Asset / Operations pages. Routing remains the Slice 6 service (in-repo; not Production). **No AI routing.**

---

## 8. Technician behavior

- Home: `/facility/my-work` (FO / Complete FO) or `/pm/maintenance` (PM-only).
- Facility Mission Control: viewers other than managers get **empty** attention sections (`viewerMode: "technician"`).
- Property Mission Control remains in technician nav (existing SKU nav). **Before this package**, that page’s briefing loaded finance + resident/lease queues because RLS allows non-tenant staff to `SELECT` those tables. **That was P1.** After this package, technicians receive maintenance signals only — no outstanding rent, delinquency, vendor invoices, resident names, or lease queues, and no Financial Operations / Residents / Leasing quick actions.

Technicians do not receive Request Form admin, Assignment Rules, or finance entitlements through this briefing.

---

## 9. Complete scoped behavior

`entitlementsForMember` ∩ `effectiveSurfaces`:

| Scope | PM briefing API | FO MC API |
|-------|-----------------|-----------|
| Complete both | Allowed | Allowed |
| Complete PM-only | Allowed | **403** (no facility entitlement) |
| Complete FO-only | **403** (no `pm.properties`) | Allowed |
| PM SKU | Allowed | **403** |
| FO SKU | **403** | Allowed |

SKU alone does not grant the other product. “Show residents” is not a chat question; Complete FO-only users do not get PM nav or the PM briefing API.

---

## 10. Tenant boundary

**No tenant AI exists. None was created.**

Tenant billing / Pay Once / AutoPay remain portal pages. Tenant must not — and this audit does not add a path to — staff operations, other residents, assets, or org finance internals.

---

## 11. Master Admin boundary

**No Master Admin AI exists. None was created.**

Master Admin nav is operator-only (`/admin/*`). It does not include `/pm/mission-control`.

---

## 12. Global Search reuse

There is no NL assistant to wire to search.

Slice 4 Global Search remains the **authoritative** staff record-discovery path: server-authorized, org-scoped, entitlement-filtered. The briefing does **not** query raw tables for free-text lookup and does **not** invent a parallel discovery index.

Preferred future pattern (if Owner later approves embedded NL): assistant → existing search service → authorized results. **Not authorized in this package.**

---

## 13. Navigation knowledge

Scripted hrefs in the PM journey are current PM routes (`/pm/maintenance`, `/pm/financial-operations`, `/pm/residents`, `/setup`).

FO navigation is **not** taught by the PM journey helper. FO uses sidebar / My Work / Facility Assets / Preventive Maintenance / Assignment Rules (Slice 6 in-repo).

Stale-name risk is limited because there is no model inventing routes. Technician PM next action remains “Start assigned work” → `/pm/maintenance` (correct for Property Operations technicians).

---

## 14. Current product capability knowledge

The briefing **does not claim**:

- automatic late-fee assessment as a product promise
- M5 collections automation
- AI routing
- inventory
- vendor auto-dispatch
- native mobile app
- predictive maintenance

docs/13 still *designs* predictive maintenance and NL search as future phases. Those pages are **not** live product claims.

Finance recommendation copy can mention late fees as something a **user** may assess. That is not automatic M5. No change in this package (would be copy-scope if Owner wants tighter language).

Certified live capabilities remain: Property Operations, Facility Operations, Complete, complimentary access, public QR intake, Request Forms, Work Templates, My Work, Mission Control Needs Attention, Asset Registry / QR, Global Search, Quick Create, Recent, Preventive Maintenance, deterministic routing (**in-repo only**), Stripe tenant payments / ACH / cards / tenant-authorized AutoPay.

---

## 15. Hallucination tests

| Case | Result |
|------|--------|
| Real authorized record | Briefing only emits titles/counts from the signed-in org query. No invented WO/resident/vendor. |
| Nonexistent record | No lookup assistant. Search returns empty authorized results. Briefing cannot fabricate a miss. |
| Similar names | Not applicable to chat; Search returns authorized matches. |
| Cross-org | Queries always `.eq("organization_id", organizationId)` from the cookie org. |
| Inaccessible record | Complete FO-only cannot hit PM briefing. Technician briefing no longer loads resident/finance rows. |

Conversational hallucination tests (prompt the model to invent FR-… / residents) **do not apply** — there is no model.

---

## 16. Record-id leakage

List keys and some hrefs use database ids (existing pattern). Visible copy prefers titles, resident display names (when authorized), and money formatting. Facility Search/Operations prefer `FR-…` / asset codes.

This package does not expose Stripe tokens or add UUID display in the briefing card. Internal ids in React keys / lease hrefs are unchanged.

---

## 17. Org isolation

`requireAuthorizedAction` binds the cookie org. Briefing queries filter `organization_id`. Cross-org chat context cannot persist because there is no conversation store.

---

## 18. Surface isolation

PM daily ops: `work_surface = "residential"` (source-contract test).  
FO snapshot: `work_surface = "facility"` (source-contract test).  
Complete scoped entitlements strip the other family.

---

## 19. Multi-turn context

**None.** Each Mission Control load is a fresh GET. There is no “it” / “open the latest one” resolver.

---

## 20. Org-switch context reset

`mission-control-page.tsx` refetches when `activeOrganization?.id` changes. No prior org names, assets, or finance figures are stored in an assistant session.

---

## 21. Prompt-injection handling

No system prompt and no model. Record titles (including public-request text that later appears on FO WOs) render as **data** in Needs Attention / lists. They cannot override authorization.

---

## 22. Public-request injection handling

Public free text is stored on the canonical facility work order. FO UI / briefing-equivalent lists show it as title/detail. There is no instruction channel to jailbreak.

---

## 23. Financial safety

The briefing **cannot** initiate tenant payments, enable Online Payments, enroll AutoPay, change methods, create Connect accounts, change SaaS subscription or prices, assess automated late fees, or trigger M5.

Finance **display** is now gated on `pm.finance:read` (same capability as Financial Operations S0).

---

## 24. Action / mutation safety

No AI → tool → mutation path exists. Destructive / financial actions stay on existing UI + services.

---

## 25. Error handling

Unauthenticated PM Mission Control → **401**. Missing org → **400**. Wrong SKU/scope/capability → **403**. Load failure → safe user string. No API keys or env dumps.

Provider timeout / tool-loop / rate-limit UI for an LLM **N/A**.

---

## 26. Rate / cost controls

No token spend. No agent loop. Existing Search already caps result size. No new limiter required for a briefing GET.

---

## 27. Audit / logging

No dedicated AI audit table (and none should be added just to log prompts that do not exist). Authz failures are standard HTTP. Do not start logging full briefing payloads with resident finance in a new store.

---

## 28. Privacy / legal findings

`public-legal-copy.ts` lists Stripe, Supabase, Resend, Vercel, optional SignWell. It does **not** claim a generative-model subprocessor.

That matches the live architecture. **No legal update is required** for this audit. Do not publish OpenAI/Anthropic language unless Owner later approves a real model integration **and** a legal review.

---

## 29. UX

Entry point is an inline Mission Control card — not a floating chatbot and not a huge overlay. After this package the card states **“Rule-based next-action briefing.”** Demo already says “Next-action guidance from demo signals.”

Suggested-prompt chips for a chat **do not exist** (and must stay role-aware if ever designed).

---

## 30. Mobile / accessibility

The briefing is a static section with `aria-label="M.P.A. Assistant briefing"`. Open/close chat, live-region streaming, and tool-result cards **do not exist**. Mission Control already uses focus rings on attention links. This package does not block technician My Work or tenant Billing.

Phone-width chat overflow tests **N/A**. Residual P2: command-center cards could share the same honesty line (Property / Resident / Lease now do; finance desks still say “Assistant recommendation” on finance-authorized pages only).

---

## 31. Performance

No assistant bundle or eager model context on every page. Data loads when Mission Control (or the relevant command center API) is opened.

---

## 32. Tests

Added / extended:

- `packages/shared/src/property/daily-ops.test.ts` — technician denial; `pm.finance:read` required; honesty label
- `apps/web/src/lib/property/work-surface-isolation.test.ts` — finance/resident gates + permissions passed from the API
- `apps/web/src/lib/property/assistant-functionality-audit.test.ts` — no chat routes, no OpenAI client/env, no tenant/admin AI, no `ai_*` migrations, legal copy has no model processor

Existing isolation / nav / Complete / technician home tests remain authoritative for SKU and surfaces.

---

## 33. Typecheck / lint / build

| Check | Result |
|-------|--------|
| `packages/shared` `tsc --noEmit` | Pass |
| `apps/web` `tsc --noEmit` | Pass |
| ESLint on edited files | Pass |
| Targeted vitest (shared daily-ops + Complete/home; web isolation + audit) | Pass |
| Full `apps/web` `pnpm test` | Not used as the gate — many suites require local server env (Sentry, etc.) unrelated to this change |

No Production build/deploy was run (forbidden by this authorization).

---

## 34. Slice 1–6 regression

This package does **not** change templates, My Work, Needs Attention math, assets/QR, Search/Create/Recent, PM generation, or routing services. Public request architecture is untouched.

Source contracts for residential vs facility `work_surface` remain.

---

## 35. Production safety

**IN-REPO ONLY.**

Did **not**: deploy, apply SQL, process payments, change Stripe, enable Online Payments, enroll AutoPay, change prices, enable M5, unfreeze July, create Production customer data, or start a new AI feature.

---

## 36. P0

**None remaining.**

No cross-org model leak, no unsafe AI mutation, no marketed-but-broken generative assistant.

---

## 37. P1

**Closed in this package:**

| ID | Finding | Fix |
|----|---------|-----|
| P1-1 | Property Mission Control briefing called `getCommandCenterReport` and resident/lease tables for any caller with `pm.properties:read`, including technicians (who have that grant but **no** `pm.finance:*`). RLS still allows non-tenant staff to read residents/leases. | `resolveDailyOpsBriefingAccess` — finance only with `pm.finance:read`; resident/lease queues only for admin / property_manager / leasing_agent. API passes `authz.permissions`. |

**None remaining** that block onboarding of the **shipped** assistant.

---

## 38. P2

| ID | Note |
|----|------|
| P2-1 | Root `package.json` description still says “AI Property Operations Platform.” Branding only; landing does not sell a generative assistant. Optional cleanup in a copy pass. |
| P2-2 | Finance desk “Assistant recommendation” copy can mention late fees / Pay now. Tighten if Owner wants zero late-fee wording outside FIN-OPS. |
| P2-3 | Technician can still open PM Mission Control (existing nav). Briefing is now maintenance-safe; hiding the nav item is a separate nav-scope decision. |
| P2-4 | docs/13 still describes future OpenAI/embeddings. Keep treating it as design, not live. |
| P2-5 | `manifest.ts` description: “M.P.A. AI Property Operations Platform.” Same branding note as P2-1. |

Do not invent work from these.

---

## 39. Exact fixes implemented

1. `resolveDailyOpsBriefingAccess` + honesty constants in `packages/shared/src/property/daily-ops.ts`
2. `buildDailyOperationsBriefing` skips finance report and resident/lease/application queries unless access allows; filters quick actions
3. `GET /api/pm/mission-control` passes `authz.permissions`
4. In-product honesty line: “Rule-based next-action briefing” on Mission Control and PM command-center assistant cards
5. Audit / isolation tests listed in §32

No new write capability. No chatbot. No schema.

---

## 40. Remaining Owner decisions

1. **Do not authorize a generative / chat assistant** without a new Design → Document → Approve package (ADR-006 still rejects chatbot-first).
2. Optional later **embedded** AI per docs/13 (drafts, ranking) — separate gate; would require legal/subprocessor review.
3. Whether technicians should **lose** `/pm/mission-control` in nav (P2-3).
4. Slice 6 Production remains a **separate** Owner package (docs/221). This audit does not release routing.
5. Whether to soften root/manifest “AI Platform” branding (P2-1 / P2-5).

---

## 41. Exact Production release gate

This audit **does not authorize Production deploy**.

If Owner later includes the P1 briefing gate in a normal release train:

1. Deploy the application revision that contains this branch (no migration).
2. Do **not** add `OPENAI_API_KEY` or advertise chat.
3. Do not apply extra SQL.
4. Hold: no chatbot, no AI routing, no Stripe/M5/July/price change.

Live Production without this commit still has P1-1 for technicians who open Property Mission Control. That is a briefing over-read, not a generative leak. Ship the gate on the next authorized app deploy. It is **not** a reason to block onboarding of the product as certified (no chat to fail).

---

## 42. Final verdict

**AI ASSISTANT FULL FUNCTIONALITY AUDIT PASS — READY FOR ONBOARDING**

The existing M.P.A. Assistant is a **rule-based, read-only, org- and surface-scoped briefing**. It cannot hallucinate records, call a model, or mutate data. After the P1 gate, it cannot show finance or resident/lease queues to users who cannot use those modules in the normal app.

A conversational assistant that answers “Find Unit 204” / “Find FR-2026-00002” **does not exist** and **must not be invented from this audit**. Staff already have Global Search, Mission Control, and My Work for that work.

**STOP.**

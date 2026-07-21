# 04 — Floating AI Operational Copilot (Priority 5 + Amendment D)

**Package:** UX-009  
**Constraint:** Presentation + context wiring only. No new AI product capabilities, no new `ai_conversations` / schema (AI Strategy). Reuse existing AI Ops prompts, permissions (`ai:read` / `ai:use`), and server actions.  
**Amendment D:** This is an **operational copilot**, not “just chat.”

---

## Problem with current placement

AI is embedded in page bodies (e.g. operations/dashboard widgets, dedicated AI Ops sidebar occupying layout). That interrupts content and trains users to treat AI as a “page” rather than an always-available OS assistant.

## Target experience

| Requirement | Spec |
| --- | --- |
| Role | Operational copilot — understands page context automatically |
| Entry | Small, premium floating button, **bottom-right** |
| Consistency | Present across authenticated PM app shell (permission-gated) |
| Non-blocking | Never covers primary toolbelt CTAs or UX-008 ＋ New; offset above safe-area / above sticky bars |
| Expand | Opens conversational panel / sheet (desktop: docked panel; mobile: bottom sheet ~70–90vh) |
| Collapse | One tap / Esc returns to page; page scroll position preserved |
| Context | Auto-derived from route + entity ids already in the URL/loader |
| Command-first | Prefer suggested copilot actions over adding new page buttons (Amendment E) |

## Context prompts (examples — wire to existing prompt keys where possible)

| Location | Copilot framing / suggestions |
| --- | --- |
| Resident detail | “Ask about this resident” |
| Property detail | “Ask about this property” |
| Maintenance / WO | “Summarize this work order” · “Suggest vendor” · “Draft response” |
| Accounting / Reports | “Explain financials” / “Explain this report” |
| Dashboard | “What requires attention today?” |
| Generic app route | “Ask about your portfolio” |

Context payload (client → existing AI APIs): `{ route, entityType?, entityId?, organizationId }` — **no free-floating chat storage**. Conversations remain entity/workflow-referenced per AI Strategy.

## What moves

| From | To |
| --- | --- |
| Embedded AI sidebar / large dashboard AI column | Floating launcher + expandable panel |
| AI Ops dedicated route | Remains for power users / full library; launcher can deep-link “Open AI Ops” in More |

## Visual / a11y

- Canopy tokens; no purple-glow / novelty chrome  
- `aria-label` reflects context (“Ask about this property”)  
- Focus trap in expanded panel; restore focus to launcher on close  
- Respect `prefers-reduced-motion`  
- Hide launcher when `ai:read` false; disable send when `ai:use` false with clear explanation  

## Explicit non-goals

- New LLM features or autonomous actions  
- AI that blocks workflows when unavailable  
- Persisting novel conversation schema  
- Replacing Command Center / Search M.P.A.

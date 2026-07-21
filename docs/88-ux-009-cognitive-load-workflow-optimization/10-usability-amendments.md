# 10 — Usability Amendments (Approved Scope)

**Package:** UX-009  
**Status:** Approved — binding on every implementation decision  
**Source:** Gate owner approval chat, 2026-07-20  
**Nature:** Usability principles, not extra features

These amendments refine the approved scope. They do not expand product surface area. Every PR and layout choice must satisfy them.

---

## Amendment A — 80/20 Rule

Every page must identify:

- Top **20%** of actions used **80%** of the time  
- Remaining actions  

Top actions must always be immediately visible.  
Everything else belongs in **More** / **Advanced** / **Overflow** / **Accordion**.  
Never overwhelm the user.

## Amendment B — One Glance Rule

A property manager should understand every page in under three seconds.

Every page header must answer:

- Where am I?  
- What needs attention?  
- What can I do immediately?  

If those answers are not obvious, the page **fails** UX certification.

## Amendment C — Zero-Hunt Experience

The user should never have to remember where something lives.

If a feature requires navigating multiple menus simply because the user knows it exists, the workflow should be reconsidered.

**Search and AI should eliminate hunting.**

## Amendment D — Contextual AI (Operational Copilot)

The floating AI assistant is not “just chat.” It is the user’s **operational copilot**.

It must automatically understand page context.

| Context | Copilot framing / suggestions |
| --- | --- |
| Resident | Ask about this resident |
| Property | Ask about this property |
| Maintenance | Summarize work order · Suggest vendor · Draft response |
| Accounting | Explain financials |
| Dashboard | What requires attention today? |

Users must not need to explain where they are.

Still constrained by AI Strategy: no new conversation schema; reuse existing prompts/permissions; graceful when AI unavailable.

## Amendment E — Command First

Before creating another button, ask:

> Can Search or AI perform this action faster?

Whenever appropriate, users should be able to **Find · Open · Create · Navigate** using natural language (via Search M.P.A. / ⌘K and the copilot).

Buttons remain for the 80% visible actions; do not multiply chrome when command surfaces already cover the path.

## Amendment F — Progressive Disclosure

Never present every tool simultaneously.

Show only what users need now. Reveal advanced functionality only when requested.

Reduce visual noise without reducing capability.

## Amendment G — Mobile First

Every page must be evaluated from thumb reach.

- Primary actions remain reachable  
- Avoid excessive upward scrolling  
- Prefer sticky contextual actions over repeated navigation  

**Target:** Majority of common workflows completable comfortably with one hand.

## Amendment H — Adaptive Workspace

Design layouts so they can evolve with usage.

Frequently used tools should be able to become more prominent over time.

**Reserve architecture** for future personalization (e.g. toolbelt slot frequency, pinned actions) without redesigning pages in this sprint. Prefer data attributes / stable slot ids over hard-coded one-off layouts.

## Amendment I — Remove Friction

During implementation, actively identify:

- Repeated clicks  
- Repeated scrolling  
- Repeated navigation  
- Repeated confirmations  
- Repeated searches  

Whenever repetition exists, propose a simpler interaction (prefer Search/AI/toolbelt deep links over extra hops).

## Amendment J — Design Partner Test

Before declaring PASS, evaluate every major workflow as if a property manager has never seen M.P.A.

If they must stop and ask:

- “Where is that?”  
- “What does this do?”  
- “Why is this here?”  

the workflow **fails**.

---

## Success criteria (amended)

UX-009 is complete only when:

- The interface feels calm instead of overwhelming  
- Primary actions are always obvious  
- Mobile scrolling is significantly reduced  
- AI acts as an operational assistant instead of a page widget  
- Search becomes a primary navigation method  
- Users spend more time managing properties than navigating software  

**Objective:** Make M.P.A. feel like the fastest, most intuitive property operations platform available — not merely “more usable.”

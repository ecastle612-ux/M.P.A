# 07 — Mobile Requirements

**Package:** OWNER-001  
**Status:** Approved · Phase 1 ✅ COMPLETE  
**Section:** §10 Mobile Requirements

---

## Intent

Owners often check portfolios on phones between meetings. Mobile must make money and communication effortless; everything else is secondary.

---

## Mobile-first priorities (binding)

| Rank | Surface | Mobile treatment |
|------|---------|------------------|
| 1 | **Financial Summary** | Near-immediate access after login; Income / Expenses / Net readable without horizontal scroll |
| 2 | **Messages** | One tap from Home / pinned nav; full reply flow usable one-handed |
| 3 | **Statements** | Latest statement shortcut + list; download/open reliable on iOS/Android browsers / PWA |
| 4 | **Documents** | Category list optimized for thumb; Statements category first |
| 5+ | Properties, full Reports, Settings, dense Home modules | Reachable, not first-viewport dominant |

---

## Behavioral requirements

1. **One composition** — First mobile viewport is not a PM dashboard clone.  
2. **Attention without clutter** — Outstanding balance, unread messages, pending-payout placeholder as compact signals.  
3. **Thumb reach** — Primary CTAs (latest statement, messages, documents) within comfortable reach (DPX-003 / UX-008).  
4. **Reduced scroll tax** — Collapse secondary Property View sections; progressive disclosure.  
5. **No new mobile architecture** — Reuse approved shell/drawer patterns; do not invent a parallel native app.  
6. **Offline** — No new offline sync requirement in MVP; standard resilient loading/error only.  
7. **Push** — Use existing notification enrollment when available; OWNER-001 does not replace PUSH-001 certification.

---

## Breakpoints (certification targets)

| Device class | Target | Expectation |
|--------------|--------|-------------|
| Phone | ~390×844 | P0 surfaces pass; no overlap; usable composer |
| Tablet | ~768–1024 | Hybrid layout; nav remains owner IA |
| Desktop | ≥1280 | Full desktop nav per [02](./02-navigation.md) |

---

## Mobile empty / loading / error

Same semantics as screen specs, with:

- Larger tap targets for retry  
- Non-blocking module errors on Home  
- Download failures explained in plain language  

---

## Explicit mobile non-goals

| Non-goal | Why |
|----------|-----|
| Bottom-tab redesign as a new product pattern without Approve | UX-008 drawer chassis is the approved default unless Approve selects tabs |
| Owner field-ops tooling | Wrong role |
| Investment chart playground | Future analytics |
| Full report-builder on phone | Statements first |

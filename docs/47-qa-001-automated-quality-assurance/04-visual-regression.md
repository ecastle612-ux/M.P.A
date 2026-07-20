# 04 — Visual Regression

**Package:** QA-001  
**Status:** Draft — Ready for Approval

---

## Goal

Catch layout shifts, broken spacing, missing images, overflow, color regressions, and responsive defects **before** release by comparing screenshots to approved baselines.

---

## Viewports

| Name | Width | Height (default) | Intent |
|------|-------|------------------|--------|
| mobile | **390** | 844 | iPhone-class |
| tablet | **768** | 1024 | Tablet |
| laptop | **1024** | 768 | Small laptop |
| desktop | **1440** | 900 | Standard desktop |
| wide | **1920** | 1080 | Large desktop |

Height may scroll-capture full page for long views; prefer **above-the-fold** for shells + **full-page** for critical marketing/auth only.

---

## Tooling options

| Option | Notes |
|--------|-------|
| **Playwright `toHaveScreenshot`** (recommended Phase 1) | Built-in; baselines in-repo; simple CI |
| Percy / Chromatic / Argos | Strong review UX; cost; later if needed |

**Recommendation:** Start with Playwright screenshots; revisit hosted visual SaaS if review friction is high.

---

## Baseline policy

| Rule | Detail |
|------|--------|
| Storage | `qa/e2e/baselines/**` (consider Git LFS if large) |
| Approval | Updating baselines requires intentional PR (`chore(qa): update visual baselines`) |
| Platform | Linux CI baselines are source of truth; local macOS diffs may vary — update from CI artifacts or Docker |
| Threshold | Small antialiasing allowance; fail on meaningful pixel delta |
| Masking | Timestamps, live clocks, avatars, maps, charts, unread badges |

---

## Capture set (Phase 1 candidates)

| Surface | Viewports | Notes |
|---------|-----------|-------|
| Auth / login | all | Brand + form |
| Setup wizard (profile step) | 390, 1440 | Active step styling (BUG-001 class) |
| PM dashboard / ops shell | 390, 1440, 1920 | |
| Properties list + detail | 768, 1440 | |
| Resident portal home | 390, 1440 | |
| Command Center | 1440, 1920 | |

Expand nightly; keep PR visual set tiny (auth + one shell).

---

## Defect classes detected

- Layout shift / CLS-like jumps between runs (stabilize fonts/network)
- Missing images (broken `img` → empty region)
- Spacing / overflow / horizontal scroll
- Color token regressions (Canopy)
- Responsive collapse failures (nav, tables)

---

## Flake control

- Wait for `networkidle` or specific test ids — not fixed sleeps alone
- Disable animations via `prefers-reduced-motion` or CSS inject in visual project
- Seed deterministic data
- Font loading: wait for `document.fonts.ready`

---

## Review workflow

1. CI fails visual → upload diff images as artifacts
2. Engineer inspects expected vs actual vs diff
3. If intentional UI change → update baselines in same or follow-up PR
4. If defect → file bug; do not update baseline

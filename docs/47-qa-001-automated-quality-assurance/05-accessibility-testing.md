# 05 — Accessibility Testing

**Package:** QA-001  
**Status:** Draft — Ready for Approval  
**Aligns with:** Canopy / Experience a11y expectations · WCAG 2.2 AA target for product UI

---

## Goal

Automate detection of contrast, ARIA, label, and structure issues on critical surfaces, plus scripted keyboard paths for primary workflows.

Automation does **not** replace human screen-reader spot checks — it catches regressions early.

---

## Automated checks

| Layer | Tooling | Scope |
|-------|---------|-------|
| Rules engine | `@axe-core/playwright` (or equivalent) | Per-page scan |
| Keyboard | Playwright keyboard.press sequences | Login, setup, create property, submit maintenance |
| Focus | Assert focus visible + order on dialogs/wizards | Modals, setup steps |
| Landmarks | axe + role queries | Nav, main, complementary |

---

## axe configuration

- Run on: login, setup profile, dashboard shell, property form, resident portal home
- Fail CI on: `critical` + `serious` for `@smoke` a11y set
- Report `moderate`/`minor` in nightly summary (non-blocking initially)
- Disable noisy rules only with documented justification

---

## Manual-assisted (still in library as stubs)

| Check | Approach |
|-------|----------|
| Screen reader compatibility | Document checklist for VoiceOver/NVDA on RC; not fully automated Phase 1 |
| Color contrast edge cases | axe + spot visual |
| Dynamic live regions | Assert `aria-live` on toasts/upload progress when MediaUpload lands |

---

## Keyboard scenarios (P0)

| Flow | Expectation |
|------|-------------|
| Login | Tab through fields; submit with Enter |
| Setup wizard | Advance via keyboard; active step readable (contrast) |
| Primary nav | Skip link / focus order sane |
| Dialog | Focus trap; Esc closes; restore focus |

---

## Reporting

A11y summary section in [07](./07-test-reporting.md): violation count by impact, top rules, URLs.

---

## Relationship to BUG-001

Active step black-on-black would fail contrast expectations; visual + a11y suites should include setup wizard chrome once stable.

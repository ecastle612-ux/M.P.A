# 09 — Implementation Slices

**Package:** QA-001  
**Status:** Approved · Implemented (slices 0–9)  
**Constraint:** No customer-facing features. AI personas deferred to QA-001B.

---

## Slice overview

| Slice | Name | Deployable outcome |
|-------|------|--------------------|
| 0 | Playwright scaffold | `qa/e2e` package, config, scripts, CI stub job (manual/optional) |
| 1 | Auth fixtures + seed users | Role storage states; login suite |
| 2 | P0 smoke workflows | Setup, property/unit, resident maintenance, shells |
| 3 | Reporting + PR gate | HTML/summary artifacts; required `e2e-smoke` on PR |
| 4 | Visual regression MVP | Viewports + baselines for auth/shells |
| 5 | Accessibility MVP | axe on smoke pages + keyboard paths |
| 6 | P1 workflow expansion | Leases, announcements, vendor, financials smoke |
| 7 | Performance probes | LCP/load budgets + nightly Lighthouse |
| 8 | Nightly + RC pipelines | Full regression schedule; RC workflow |
| 9 | Hardening & docs closeout | Flake policy, README status → Implemented |

AI personas = **not in these slices** (future QA-001B).

---

## Slice 0 — Playwright scaffold

**Includes:** workspace package, `playwright.config.ts`, folder layout, `pnpm qa:e2e*` scripts, sample health check hitting `/login`.

**Done when:** Local `pnpm qa:e2e:smoke` runs one passing test against local app.

---

## Slice 1 — Auth fixtures + seed

**Includes:** test users in seed/bootstrap; `asPm` / `asResident` / etc.; auth storage states.

**Done when:** Authenticated smoke opens dashboard without UI login each test.

---

## Slice 2 — P0 smoke workflows

**Includes:** WF-PM-01 (or partial if signup hard), WF-PM-02/03, WF-PM-10/11, WF-RE-01/04, WF-X-02.

**Done when:** Critical happy paths green locally; tagged `@smoke`.

---

## Slice 3 — Reporting + PR gate

**Includes:** Playwright HTML report upload; markdown job summary; GitHub Actions `e2e-smoke` job (preview or CI app boot strategy finalized).

**Done when:** PR check required; failures block merge.

---

## Slice 4 — Visual MVP

**Includes:** `@visual` project; baselines for login + one shell at 390 & 1440 (expand to full viewport set nightly).

**Done when:** Intentional UI change requires baseline update PR path.

---

## Slice 5 — Accessibility MVP

**Includes:** axe on smoke pages; keyboard login + setup step; CI fail on serious+.

**Done when:** Documented a11y summary in report.

---

## Slice 6 — P1 expansion

**Includes:** WF-PM-05/06/07/09, WF-VE-01/03, WF-OW-01/02, WF-RE-02/03 as product-ready.

**Done when:** Nightly suite covers P1 list or explicitly skips with ticket if feature incomplete.

---

## Slice 7 — Performance probes

**Includes:** Route timings; budget deltas; optional Lighthouse nightly.

**Done when:** Perf section appears in nightly summary.

---

## Slice 8 — Nightly + RC

**Includes:** `schedule` workflow; `workflow_dispatch` RC; artifact retention.

**Done when:** Matches docs/16 CI intent (e2e-full + performance-check).

---

## Slice 9 — Hardening

**Includes:** Flake quarantine process; owner rotation; update [16](../16-testing-standards/index.md) with pointer to live `qa/e2e`; package status Implemented.

---

## Dependency notes

- WF-RE-05 / photo uploads wait on [API-002A](../46-api-002a-universal-media-foundation/README.md) Approve + implement.
- Payment smokes need Stripe test mode credentials in CI secrets.
- Push enrollment E2E needs valid OneSignal test app (ops) — keep mocked/skipped until ready.

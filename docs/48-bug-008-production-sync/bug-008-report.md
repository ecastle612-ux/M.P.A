# BUG-008 Report

**Date:** 2026-08-08  
**Live domain:** https://www.my-property-assistant.com  
**Authoritative constitution:** ADR-019 / `docs/00-governance/product-constitution.md`

---

## 1. Production SHA

`58dc4a8af2f3c98591a2f88b075872b1b66a982b`  
(= current `origin/main`, includes BUG-006 restore + ADR-019 Product Constitution)

Evidence: GitHub deployment `5805145021` environment `Production`, state **success** (2026-08-08T03:33:03Z). Live HTML matches BUG-006 / ADR-019 surfaces (Choose Your Platform; no Professional/Business copy).

Note: Legacy environment label `Production – m-p-a-web` last listed older SHAs; the serving Production deployment for tip `58dc4a8` is recorded as environment `Production` and www content confirms sync. No additional redeploy was required for this audit.

---

## 2. Deployment status

| Check | Result |
|-------|--------|
| `origin/main` tip | `58dc4a8` |
| Production deploy for tip | **success** (`5805145021`) |
| www reflects tip commercial model | **Yes** |
| Additional deploy action needed | **No** (already synchronized) |

---

## 3. Constitution compliance — **PASS**

### Landing

| Required | Live |
|----------|------|
| Hero | Pass |
| Choose Your Platform | Pass |
| Property Manager | Pass |
| Facility Operations | Pass |
| Complete Platform | Pass |
| Feature comparison | Pass |
| FAQ | Pass |
| Enterprise Solutions (once) | Pass — single section near bottom |
| Footer | Pass |

### Navigation

Home · Live Demo · Modules · Pricing · Confirm Plan · Enterprise · Sign In · Get Started — **Pass** (all resolve; Get Started → `/modules`).

### Pricing

| Forbidden | Live |
|-----------|------|
| Professional / Business / Starter / Teams / Pro | **Absent** from customer-facing pricing UI |
| Products | Only Property Manager · Facility Operations · Complete Platform |
| Enterprise as product/tier card | **Absent** |
| Monthly / Annual | Present |

### Commercial flow (public path exercised)

```
Landing → Choose Product → Monthly/Annual → Confirm Plan → Stripe CTA
```

Matches ADR-019 through Stripe entry. Post-payment Create Account → Guided Setup → Mission Control not fully exercised in this public walkthrough (requires completed Stripe purchase); Confirm Plan copy preserves payment-before-account.

Internal query still includes `plan=professional` on some Confirm Plan URLs (not shown as customer tier label) — backlog P3.

---

## 4. Demo verification — **FAIL**

| Demo | Result |
|------|--------|
| Property Manager | **FAIL** — blank page at `/demo/mpa_property_manager/mission-control` |
| Facility Operations | **FAIL** — blank page at `/demo/mpa_facility_operations/fo-mission-control` |
| Complete Platform | **FAIL** — blank page at `/demo/mpa_complete_platform/mission-control` |

**Root cause (audit observation, not fixed):** HTTP redirect loop:

1. `GET /demo/{product}/{surface}` → `307` → `/api/demo/start?product=…&surface=…`
2. `GET /api/demo/start?…` → `307` → `/demo/{product}/{surface}`

Browser ends on a blank document. Session create via `POST /api/demo/session` returns `200` with snapshot `v1.0.0`, so snapshots exist; launch routing is broken.

Evidence screenshots: `/opt/cursor/artifacts/bug-008/a559e.webp`, `320f9.webp`, `83bdc.webp`.

---

## 5. Production Polish Backlog

See [production-polish-backlog.md](./production-polish-backlog.md).

---

## 6. Failure screenshots

| Failure | Artifact |
|---------|----------|
| PM demo blank | `/opt/cursor/artifacts/bug-008/a559e.webp` |
| FO demo blank | `/opt/cursor/artifacts/bug-008/320f9.webp` |
| Complete demo blank | `/opt/cursor/artifacts/bug-008/83bdc.webp` |

Constitution-pass references: hero `7a8a6.webp`, platform cards `efcbd.webp`, pricing `0d298.webp`, Enterprise once `d63ba.webp`, Confirm Plan `0ffcb.webp`.

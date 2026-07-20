# 09 — Implementation Slices

**Package:** API-003  
**Status:** Approved · Implemented (Phase 1)

---

## Slice overview

| Slice | Name | Deployable outcome |
|-------|------|--------------------|
| 0 | Domain foundation | Schema + RLS + ScreeningService skeleton + noop |
| 1 | Consent & authorization | Electronic consent, vault artifacts, gates |
| 2 | Checkr adapter | Live orders + webhooks + normalized reports |
| 3 | Applicant progress UX | Portal consent/progress + notifications |
| 4 | PM review & decisions | Approve/reject/conditional + audit |
| 5 | Adverse action | Notices, delivery, hard gates |
| 6 | Multi-party | Guarantors, co-apps, adult occupants |
| 7 | Ops + Command Center | Widgets + index providers |
| 8 | Lease / e-sign handoff | Decision → lease → signature bridge |
| 9 | Retention & hardening | Expiry jobs, retry/DLQ, QA workflows |

**Deferred packages:** Income verification · auto-rules · provider failover · AI summary (API-003B)

---

## Slice 0 — Domain foundation

**Includes:** Extend `screening_cases` (and related tables) for parties, components, states; permissions; ScreeningService API; keep noop provider.

**Done when:** Create case + list cases works with RLS; no external calls.

---

## Slice 1 — Consent

**Includes:** Versioned disclosure/auth text; consent capture; vault PDF; block provider order without consent.

**Done when:** Case stuck in `awaiting_consent` until grant; audit written.

---

## Slice 2 — Checkr

**Includes:** `CheckrProvider`; secrets; webhook Edge Function; artifact pull to vault; retry.

**Done when:** Sandbox order reaches `ready_for_review` with normalized components.

---

## Slice 3 — Applicant UX

**Includes:** Consent screens, progress, deep links, notification events.

**Done when:** Happy path consent→in progress visible on mobile + desktop.

---

## Slice 4 — PM review

**Includes:** Review workspace, flags, decisions, timeline events.

**Done when:** PM can approve/reject/conditional with audit.

---

## Slice 5 — Adverse action

**Includes:** Templates, send pipeline, state gates.

**Done when:** Reject with consumer report cannot close without packet (default policy).

---

## Slice 6 — Multi-party

**Includes:** Party roles, per-party consent/reports, rollup status.

**Done when:** Primary + guarantor flow completes.

---

## Slice 7 — Ops / Command

**Includes:** Six Ops widgets; Command Center screening providers.

**Done when:** Widgets match live counts; search returns cases.

---

## Slice 8 — Lease handoff

**Includes:** Gates into lease create; resident conversion summary fields.

**Done when:** Approved applicant can enter lease/e-sign path without re-keying screening outcome.

---

## Slice 9 — Hardening

**Includes:** Expiration job, purge, DLQ UI, QA-001 P1 screening journey, docs status → Implemented.

**Done when:** Expiry blocks lease use; CI fixtures green.

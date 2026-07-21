# 09 — Approval

**Package:** EP-019 — Performance & Speed Certification  

---

## What Approve unlocks

1. Baseline measurement on Production + local production build (Lighthouse, Playwright `@perf` extension, bundle analyze, Supabase query sampling, real-device checklist).  
2. Evidence-gated optimizations logged in `06-optimization-log.md` (reason · before · after).  
3. Re-measurement and final PASS/FAIL in `08-final-verdict.md`.

## What Approve does not unlock

- UI redesign or feature removal  
- Speculative refactors without metrics  
- Security/CSP weakening  
- Schema changes unrelated to proven slow queries (those need their own design note if material)

## Optimization discipline (binding after Approve)

Every code change must cite a measured bottleneck ID from `07-bottleneck-register.md` and record before/after in `06-optimization-log.md`.

---

## Sign-off

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Product / Gate owner | | | ☐ Approve · ☐ Reject · ☐ Revise |
| Architecture | | | ☐ Approve · ☐ Reject · ☐ Revise |

**Chat shortcut:** `APPROVE EP-019`

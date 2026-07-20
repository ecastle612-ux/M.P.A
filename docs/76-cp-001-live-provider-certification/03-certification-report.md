# 03 — Live Provider Certification Report

**Package:** CP-001 · EP-012  
**Date:** 2026-07-19  

---

## Verdict

**Commercial Pilot: CONDITIONAL / NO-GO for paid live rails**

| Cohort | Recommendation |
| --- | --- |
| Expanded Design Partner (sandbox payments/screening/sign + push + Supabase) | **GO** when Integrations shows intended statuses |
| Commercial Pilot with live rent collection + transactional email | **NO-GO** until blockers below close |

Existing payment, screening, signature, and push **workflows are unchanged**. This sprint certifies providers and expands the Provider Health Dashboard only.

---

## Scores

Baseline after PM-001: Design Partner **9.95**, Production **7.8**, Commercial **7.5**

| Score | Previous | CP-001 | Delta |
| --- | ---: | ---: | ---: |
| **Design Partner Readiness** | 9.95 | **9.95 / 10** | 0 |
| **Production Readiness** | 7.8 | **8.1 / 10** | +0.3 |
| **Commercial Readiness** | 7.5 | **7.7 / 10** | +0.2 |

### Rationale

- **Design Partner:** Already high; provider honesty prevents false confidence (no DP regression).  
- **Production:** Health dashboard + webhook readiness + read-only probes raise operational clarity.  
- **Commercial:** Clearer certification path; still blocked by live credentials and missing email/SMS adapters.

---

## Per-provider outcome (this environment)

Operator must re-check Settings → Integrations after loading production secrets. Typical Design Partner posture:

| Provider | Expected DP status | Notes |
| --- | --- | --- |
| Supabase | Connected / Production Ready | Dedicated prod project |
| Stripe | Sandbox (or Configuration Required) | Acceptable for DP demos |
| OneSignal | Connected / Production Ready | Prod origin + App API Key |
| Dropbox Sign | Sandbox | Lease workflow unchanged |
| Checkr | Sandbox | Applicant workflow unchanged |
| Resend | Disabled | INT-303 not shipped — use Auth SMTP / waive |
| Twilio | Disabled | INT-302 not shipped — communicate clearly |
| Google Maps | Disabled or Connected | Optional |

---

## Remaining blockers (Commercial Pilot)

| ID | Blocker | Severity |
| --- | --- | --- |
| CP-01 | Live Stripe keys + webhook delivery verified on prod host | **P0** |
| CP-02 | Transactional email (INT-303 Resend adapter **or** proven Supabase Auth SMTP for invite/reset) | **P0** |
| CP-03 | OneSignal production origin + subscription UX verified on prod | P1 |
| CP-04 | Dropbox Sign / Checkr live mode only if pilot requires live e-sign/screening | P1 |
| CP-05 | Twilio SMS (INT-302) if pilot promises SMS | P2 (waive by keeping Disabled) |

---

## Verification

| Check | Result |
| --- | --- |
| TypeScript | Run in delivery |
| ESLint (touched) | Run in delivery |
| Provider certification unit test | Updated for Resend/Twilio/Maps |
| Architecture constraints | Preserved |
| Secrets exposure | Sanitized probe strings; no keys in UI |

---

## Operator checklist

1. Open **Settings → Integrations** on production.  
2. Confirm each provider status matches cohort intent.  
3. For enabled adapters, confirm **Last success** probe and webhook secret rows.  
4. Capture screenshots of the Provider Health Dashboard.  
5. Re-run `pnpm trust:certify` with production env loaded (never paste secrets into chat).

# 02 — Launch Blocker Matrix

**Package:** CORE-001  
**Date:** 2026-07-22

Effort key: **S** ≤3 days · **M** 1–2 weeks · **L** 3–6 weeks · **XL** 6+ weeks (design+build+cert)

---

## P0 — Launch blockers

Must close before onboarding unsupervised paying PM companies.

### P0-01 — Live rent collection certification

| Field | Detail |
|-------|--------|
| Problem | Stripe live supervised payment + webhook re-cert still open (EP-017). Sandbox path works; live money path not closed. |
| Business impact | Cannot truthfully sell “collect rent in M.P.A.” to paying customers. |
| Recommended solution | Operator-approved ≤$1 live charge on production; verify webhook → ledger → resident/PM UI; record EP-017 closeout. |
| Dependencies | Live Stripe keys already present; explicit operator approval for live charge |
| Effort | **S** (ops + cert) |
| Risk | Medium (live money) — mitigate with tiny amount + reverse/refund procedure |
| Certification | EP-017 Stripe Live row → **PASS** |

### P0-02 — Restore FIN-003 design package (docs)

| Field | Detail |
|-------|--------|
| Problem | ADR-023 Accepted points at `docs/98-fin-003-owner-payout-stripe-connect/`, but the folder is **missing on disk**. Implementation cannot proceed under the gate. |
| Business impact | Owner payout work is blocked at Document stage even though ADR is Accepted. |
| Recommended solution | Restore or re-author FIN-003 package from ADR-023 + any backups; re-Approve if content material-changed. |
| Dependencies | ADR-023; Implementation Gate |
| Effort | **S–M** (documentation) |
| Risk | Low–Medium (doc drift vs ADR) |
| Certification | Gate review: package present + checklist aligned with ADR-023 |

### P0-03 — Owner Connect payouts (FIN-003 Phase A minimum)

| Field | Detail |
|-------|--------|
| Problem | No `OwnerPayoutService` / Connect Express implementation found in app code. Owners cannot be paid through M.P.A. |
| Business impact | Core reason many PMs switch platforms — “collect rent → pay owners” — is incomplete. Dead-end after rent. |
| Recommended solution | Implement approved FIN-003 Phase A only: org settlement Express + owner Express + allocate/transfer + audit + failure handling. Never hold customer float (ADR-023 amendment). |
| Dependencies | P0-02 docs restored + Approved; ADR-023; separate from BILL-001 SaaS rail |
| Effort | **L–XL** |
| Risk | High (money movement) |
| Certification | FIN-003 Phase A commercial cert (sandbox then supervised live) |

### P0-04 — Owner visibility (Portal MVP or explicit PM-mediated path)

| Field | Detail |
|-------|--------|
| Problem | `/portal/owner` shows FutureReleaseNotice. Statements exist for PM but owners have no self-serve surface. |
| Business impact | Owners are stakeholders in every PM sale; “no owner login” is a switch blocker for many firms. |
| Recommended solution | **Option A (preferred):** Owner Portal MVP — statements, payout history, documents. **Option B:** Launch with written limitation “PM shares statements only” (downgrades this to P1). |
| Dependencies | Statements (exists); payouts (P0-03) for payout history |
| Effort | **M–L** (Option A) · **S** (Option B docs/sales) |
| Risk | Medium (scope creep into full owner app) |
| Certification | Owner Portal smoke + permission cert; or signed Known Limitations if Option B |

### P0-05 — Commercial claim control / Known Limitations vLaunch

| Field | Detail |
|-------|--------|
| Problem | SMS disabled; push not PASS; vendor pay locked; owner rail incomplete — sales risk of overclaim. |
| Business impact | Refunds, churn, reputation damage if sold as AppFolio parity. |
| Recommended solution | Publish Launch Known Limitations + sales script; wire into onboarding; update stale `docs/00-project-state.md`. |
| Dependencies | This matrix |
| Effort | **S** |
| Risk | Low |
| Certification | Commercial review sign-off |

---

## P1 — Strongly recommended before launch

### P1-01 — PUSH-001 real-device PASS

| Field | Detail |
|-------|--------|
| Problem | Push approved but not commercially PASS without physical-device evidence. |
| Business impact | “Real-time ops” promise fails; PM/vendor/resident urgency suffers. |
| Recommended solution | Execute PUSH-001 device matrix (iOS PWA, Android Chrome); deep links; failure diagnostics. |
| Dependencies | OneSignal prod; enrolled devices |
| Effort | **M** |
| Risk | Medium (platform quirks) |
| Certification | PUSH-001 = **PASS** |

### P1-02 — DPX-003 commercial polish PASS

| Field | Detail |
|-------|--------|
| Problem | Theme Sev-1 / empty states / perception gates not PASS. |
| Business impact | Product feels unfinished; brand trust for paid orgs. |
| Recommended solution | Close DPX-003 hard PASS criteria only — no new feature scope. |
| Dependencies | Canopy approved |
| Effort | **M** |
| Risk | Low–Medium |
| Certification | DPX-003 = **PASS** |

### P1-03 — VENDOR-001 Phase B (invoice → approve → pay)

| Field | Detail |
|-------|--------|
| Problem | Vendors finish jobs but cannot submit invoice / get paid in-product. |
| Business impact | Field workflow dies at money; PMs keep parallel tools. |
| Recommended solution | Unlock Phase B after Phase A cert (already PASS): invoice upload, minimal payment profile, approve, mark paid / pay rail. |
| Dependencies | VENDOR-001 A PASS; payment provider decision (may share Connect primitives later) |
| Effort | **L** |
| Risk | Medium |
| Certification | VENDOR-001 Phase B cert |

### P1-04 — Master Admin support certification

| Field | Detail |
|-------|--------|
| Problem | EP-017 Master Admin deep walk pending. |
| Business impact | Cannot support paying customers safely. |
| Recommended solution | Full walk on master-admin account: providers, impersonation, notifications, health. |
| Dependencies | ADMIN-001 |
| Effort | **S** |
| Risk | Low |
| Certification | EP-017 / ADMIN cert row PASS |

### P1-05 — Resident email invite path proven on www

| Field | Detail |
|-------|--------|
| Problem | Resend config PASS; www UI-triggered invite still pending login proof. |
| Business impact | Move-in / portal activation friction. |
| Recommended solution | Authenticated www send of invite + inbox receipt evidence. |
| Dependencies | EML-001 / INT-303 |
| Effort | **S** |
| Risk | Low |
| Certification | EP-017 resident comms → PASS |

### P1-06 — Live screening / e-sign honesty

| Field | Detail |
|-------|--------|
| Problem | Checkr / Dropbox Sign often sandbox. |
| Business impact | Overclaim if sold as production screening/signing. |
| Recommended solution | Either certify live providers for launch cohort or document sandbox-only. |
| Dependencies | CP-001 |
| Effort | **S–M** |
| Risk | Medium (provider compliance) |
| Certification | CP-001 live rows or Known Limitations |

---

## P2 — Post-launch (safe to defer)

| ID | Gap | Why defer |
|----|-----|-----------|
| P2-01 | SMS (Twilio / INT-302) | Disabled by design; email + push cover launch |
| P2-02 | Vendor marketplace (ADR-004) | Not required for single-org vendor ops |
| P2-03 | Full GL / trust accounting (ADR-010) | Explicitly deferred |
| P2-04 | AI-001 / IA-001 proactive ops | Assistive; not money path |
| P2-05 | ADMIN-003 slices B–D | Nice for HQ; not PM daily path |
| P2-06 | Large portfolio (&gt;50–500 units) cert | Launch with small/medium cohort |
| P2-07 | Native mobile apps | PWA path sufficient |
| P2-08 | SSO / enterprise IdP | Mid-market later |
| P2-09 | Preventive / recurring maintenance product | Manual WOs suffice |
| P2-10 | Report scheduling / BI suite | On-demand reports exist |

---

## Priority decision required at Approve

| Decision | If YES | If NO |
|----------|--------|-------|
| Must pay owners inside M.P.A. at launch? | P0-02 + P0-03 remain P0 | Document external payout process → P0-03 becomes P1; still restore docs |
| Must owners log in at launch? | P0-04 Option A | P0-04 Option B + limitations |
| Selling “instant push alerts”? | P1-01 elevates to P0 | Keep P1 |

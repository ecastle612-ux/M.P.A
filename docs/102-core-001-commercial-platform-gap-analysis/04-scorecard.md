# 04 — Launch Readiness Scorecard

**Package:** CORE-001  
**Date:** 2026-07-22  
**Scoring:** PASS · PARTIAL · FAIL · N/A

| Domain | Score | Evidence / gap |
|--------|-------|----------------|
| Authentication | **PASS** | UX-005 login/invite/reset |
| Master Admin | **PARTIAL** | Surfaces exist; EP-017 deep walk open |
| Property Management | **PASS** | Phase 4 · DPX-002 |
| Residents / Lifecycle | **PASS** | WF-003 · DPX-002 |
| Applicants / Screening | **PARTIAL** | API-003; live provider often sandbox |
| Leasing / E-Sign | **PARTIAL** | Phase 8 · API-004; live e-sign optional |
| Maintenance | **PASS** | Phase 6 · DPX-002 |
| Vendor QR (field) | **PASS** | VENDOR-001 Phase A cert |
| Vendor Pay | **FAIL** | Phase B locked / not built |
| Owner Portal | **FAIL** | FutureReleaseNotice |
| Owner Payouts | **FAIL** | ADR-023 Accepted; FIN-003 missing + not implemented |
| Communications (email/in-app) | **PARTIAL** | Email config PASS; www UI invite pending; SMS disabled |
| Accounting (ops ledger) | **PARTIAL** | Phase 10 works; not GL (by design) |
| Rent Collection (sandbox) | **PASS** | API-005 path |
| Rent Collection (live) | **PARTIAL** | EP-017 live cert blocked |
| SaaS Billing (MPA sub) | **PASS** | BILL-001 Phase A |
| Documents / Vault | **PASS** | Vault + report PDFs |
| Push Notifications | **PARTIAL** | PUSH-001 Approved; not PASS |
| AI Copilot | **PARTIAL** | AI-001 awaiting user verify |
| Reporting | **PASS** | FIN-001 + maintenance summary |
| Search | **PASS** | SH-003 |
| Settings / Branding | **PARTIAL** | Works; DPX-003 / BR polish open |
| Integrations honesty | **PASS** | Provider status center |
| PWA shell | **PARTIAL** | Manifest/SW; push cert open |
| Migration / Switching | **PASS** | MIG-001 / MX-001 for DP scope |
| Design Partner Ready | **PASS** | RC-001 GO · DPX-002 PASS · ~9.95 |
| Commercial Pilot Ready | **PARTIAL** | EP-017 ~8.3; limitations |
| **Paid Commercial Launch** | **FAIL** | P0 matrix open |

### Roll-up

| Metric | Value |
|--------|------:|
| Domains PASS | 12 |
| Domains PARTIAL | 12 |
| Domains FAIL | 4 |
| Launch recommendation | **NO-GO** until P0 closes |

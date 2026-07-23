# 06 — Certification Matrix

**Package:** CORE-001  
**Rule:** No launch claim without the matching cert row = PASS (or explicit waiver in Known Limitations).

| ID | Capability | Cert package / artifact | Current | Required before launch |
|----|------------|-------------------------|---------|------------------------|
| C-01 | Design Partner daily workflow | DPX-002 | **PASS** | Keep (no regress) |
| C-02 | Property Manager certification | PM-001 | ~PASS / high | Keep |
| C-03 | SaaS subscription billing | BILL-001 Phase A | **PASS** | Keep |
| C-04 | Vendor QR Start/Finish | VENDOR-001 Phase A | **PASS** | Keep |
| C-05 | Live rent + webhooks | EP-017 Stripe Live | **BLOCKED** | **PASS** (P0-01) |
| C-06 | Hosted email delivery | EP-017 / EML-001 | Config PASS; UI pending | **PASS** www invite (P1-05) |
| C-07 | Master Admin support walk | EP-017 / ADMIN-001 | **PENDING** | **PASS** (P1-04) |
| C-08 | Owner Connect payouts | FIN-003 Phase A | **Missing / not started** | **PASS** (P0-03) |
| C-09 | Owner Portal MVP | New / Owner Portal cert | **FAIL** (gated) | **PASS** or waiver (P0-04) |
| C-10 | Push real devices | PUSH-001 | Approved ≠ PASS | **PASS** (P1-01) |
| C-11 | Commercial polish / theme | DPX-003 | Not PASS | **PASS** (P1-02) |
| C-12 | Vendor invoice/pay | VENDOR-001 Phase B | Locked | **PASS** (P1-03) |
| C-13 | Live screening/e-sign | CP-001 | Partial | PASS or Known Limitations (P1-06) |
| C-14 | Commercial Launch GO | EP-017 closeout or LC-002 | Open | **GO** after P0 (+ agreed P1) |

### Regression guards (must remain green)

- DPX-002 daily path  
- VENDOR-001 Phase A token security  
- BILL-001 SaaS rail isolation (ADR-024)  
- RLS / org tenancy on any new money tables  

### Explicit non-cert at launch

| Claim | Status |
|-------|--------|
| SMS notifications | **Do not certify / do not sell** |
| Full accounting GL | **Out of scope** (ADR-010) |
| Vendor marketplace | **Out of scope** |

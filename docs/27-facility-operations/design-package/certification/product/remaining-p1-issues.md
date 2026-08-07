# Facility Operations — Remaining P1 Issues

**Package:** FAC-OPS-001 Product Certification  
**Date:** 2026-08-07  
**Update:** P1 remediation authorize completed — see [p1-remediation/](./p1-remediation/)  

---

## P1 list (remediated)

| ID | Issue | Status |
|----|-------|--------|
| **P1-1** | Staging Master Admin Pass / production witness | **Cleared** — [master-admin-verification](./p1-remediation/master-admin-verification.md) · [production-witness](./p1-remediation/production-witness.md) |
| **P1-2** | Asset transfer/relocate + location history | **Cleared** — relocate workflow + history table |
| **P1-3** | Facility context in Maintenance / Vendor | **Cleared** — UI labels on shared WO data |
| **P1-4** | Inspection document attach UX | **Cleared** — Document Vault attach/view on runs |

---

## What is NOT P1

- Capital Projects — **NO-GO / out of scope**  
- Generative Assistant — rule-based recommendations satisfy design  
- Dedicated FO Audit module — platform audit reuse is correct  
- FO Reports/export — design allows honesty as later (P2)  

---

## Gate effect after remediation

| Gate | Effect |
|------|--------|
| Feature delivery GO | **GO** |
| FO Operational GO | **GO** |
| Complete Platform GO | **GO** |
| Capital | **NO-GO** |

---

## STOP

Do not begin post-FAC-OPS roadmap work without authorize. Capital remains NO-GO.

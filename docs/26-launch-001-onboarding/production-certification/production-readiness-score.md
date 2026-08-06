# Production Readiness Score — Property Manager

**Parent:** [Production Certification](./index.md)  
**Date:** 2026-08-06  

---

## Score model

Each scenario scored 0–100:

| Band | Meaning |
|------|---------|
| 90–100 | Pass — unaided, evidence-backed |
| 70–89 | Conditional — works with accepted honesty / config |
| 40–69 | Major gap — advertised step fails without workaround |
| 0–39 | Fail — core path missing |

Overall score = mean of Scenario 1–10.  
**Any P0 launch blocker forces NO-GO regardless of mean.**

---

## Scores

| Scenario | Score | Weight note |
|----------|------:|-------------|
| 1 Purchase → Mission Control | 85 | White-glove purchase accepted |
| 2 First property | 95 | |
| 3 Invite team | 80 | Resend conditional |
| 4 First resident | 95 | |
| 5 Lease → portal | 45 | Portal login broken |
| 6 Collect rent | 70 | Staff path strong; portal pay weak |
| 7 Maintenance lifecycle | 65 | Staff path strong; resident/vendor portal weak |
| 8 Owner portfolio | 90 | |
| 9 Documents | 80 | |
| 10 Communications | 80 | |

### **Overall: 78 / 100**

---

## Dimension scores (secondary)

| Dimension | Score | Notes |
|-----------|------:|-------|
| Staff PM operations | 92 | MC → property → team → resident → lease → FO → MCC → owner |
| Resident-facing operations | 40 | Blocked by DEF-001 |
| Vendor-facing operations | 55 | Blocked/fragile by DEF-002 |
| Integrations (configured) | 75 | Honesty paths exist |
| Master Admin observability | 85 | Panels present; J0 thin; soft Docs/Comms checks |
| Accessibility / mobile polish | 70 | Usable; polish debt |
| Documentation honesty | 75 | Some stale contradictions |

---

## Interpretation

| Score | Typical decision |
|------:|------------------|
| ≥90 and no P0 | GO |
| 75–89 with P0 | **NO-GO** (this audit) |
| 75–89 without P0 | Conditional GO + operator Pass |
| <75 | NO-GO |

**This audit: 78 / 100 + P0 blockers → NO-GO.**

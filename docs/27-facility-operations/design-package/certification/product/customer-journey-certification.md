# Facility Operations — Customer Journey Certification

**Package:** FAC-OPS-001  
**Journey source:** [03 Personas & Customer Journeys](../../03-personas-and-customer-journeys.md)  
**Date:** 2026-08-07  
**Evidence class:** Code-verified · Staging MA Pass **not** witnessed  

---

## Scoreboard

| Journey | Persona focus | Delivery | Runtime Pass | Status |
|---------|---------------|----------|--------------|--------|
| **J-F0** First week / Guided Setup | Facility Manager | Delivered | Not witnessed | **Conditional** |
| **J-F1** Daily operations | Facility Manager | Delivered | Not witnessed | **Conditional** |
| **J-F2** Emergency operations | Facility + Maintenance Mgr | Delivered | Not witnessed | **Conditional** |
| **J-F3** Preventive maintenance | Facility Manager | Delivered | Not witnessed | **Conditional** |
| **J-F4** Inspection program | Facility Manager | Delivered (docs UX gap) | Not witnessed | **Conditional** |
| **J-F5** Inventory & parts | Facility Manager | Delivered | Not witnessed | **Conditional** |
| **J-F6** Asset lifecycle | Facility Manager | Relocate + location history remediated (P1-2) | Yes | **Pass** |
| **J-F7** Compliance calendar | Facility Manager | Delivered | Not witnessed | **Conditional** |
| **J-F8** Safety program | Facility Manager | Delivered | Not witnessed | **Conditional** |
| **J-F9** Capital planning | Executive | Out of scope | — | **NO-GO** |
| **J-F10** Maintenance Manager accepts FO work | Maintenance Manager | Delivered (labeling gap) | Not witnessed | **Conditional** |
| **J-F11** Technician / Vendor execution | Tech / Vendor | Reuse path; portal context gap | Not witnessed | **Conditional** |
| **J-F12** Executive posture | Executive | MC posture yes; Reports/export no | Optional | **Conditional** |
| **J-F13** Master Admin certification | Master Admin | E1–E6 panels ready | Pass not recorded | **Conditional** |

**Update (P1 remediation):** Journeys J-F0–J-F8 marked Pass with MA staging package + production witness under [p1-remediation/](./p1-remediation/).

---

## Persona coverage

| Persona | Journeys | Can complete advertised job? |
|---------|----------|------------------------------|
| Facility Manager | J-F0–J-F8 | Yes in product (P1 relocate cleared) |
| Maintenance Manager | J-F10 (+ execution of FO WOs) | Yes via FO Ops and/or Maintenance filter; facility labels incomplete in MCC |
| Technician | J-F11 | Yes via shared execution; facility fields not highlighted in all UIs |
| Vendor | J-F11 | Can execute assigned WOs; portal lacks site/asset/system display |
| Executive | J-F12 | MC posture yes; no dedicated FO Reports home |
| Master Admin | J-F13 | Panels + customer routes ready for staging script |

---

## Staging witness script (MA)

Per [09 Master Admin Testing Plan](../../09-master-admin-testing-plan.md):

1. Entitled FO org · Facility Manager + Maintenance Manager roles  
2. J-F0: activate site → assets/systems → MC clears setup  
3. J-F3 + J-F5 + J-F4 fail→WO + J-F8 high severity + J-F7 overdue satisfy  
4. J-F10: open facility WO in Maintenance filter  
5. Record E1–E6 Launch Readiness Pass badges  
6. File evidence under this `certification/product/` folder  

---

## Related

- [Remaining P1 Issues](./remaining-p1-issues.md)  
- [Final GO / NO-GO](./go-no-go.md)  

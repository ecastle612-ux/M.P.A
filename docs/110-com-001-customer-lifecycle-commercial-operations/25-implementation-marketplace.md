# 25 — Implementation Marketplace

**Package:** COM-001  
**Amendment:** A07  
**Status:** Binding (Approved with Amendments) — **Architecture now; partner marketplace Implement later**

---

## Purpose

Future-proof implementation services so customers may choose **Professional Setup** delivered by M.P.A. staff **or** a **certified implementation partner**, without redesigning COM-001 / AUTH-001 later.

MVP may only expose M.P.A.-delivered Professional Implementation; the model below must already fit.

---

## Future flow

```
Customer chooses Professional Setup
    ↓
Available Partners
    ↓
Certified M.P.A. Consultant (or M.P.A. Internal)
    ↓
Implementation Begins
```

AI Guided Setup remains a separate path (no partner required).

---

## Architecture (design)

```
ImplementationEngagement
  ├── organization_id
  ├── path: ai_guided | professional
  ├── provider_type: mpa_internal | certified_partner
  ├── partner_id (nullable)
  ├── status: requested | matched | in_progress | complete | cancelled
  ├── progress_score (COM-001 [18])
  └── access_grant_id (time-boxed; AUTH-001)
```

### Partner directory (future)

| Attribute | Meaning |
|-----------|---------|
| Certification status | Active / suspended |
| Regions / languages | Matching |
| Capacity | Intake limits |
| Services | Full setup / migration only / training |
| Rating | Post-engagement CS score |

---

## Responsibilities

| Party | Owns |
|-------|------|
| **Customer (Org Admin)** | Choose path; approve partner; Finish Setup |
| **Certified partner** | Configure under time-boxed grant; cannot become standing Org Admin by default |
| **M.P.A. Implementation** | Internal fulfillment; partner QA |
| **Customer Success** | Outcome ownership; escalations |
| **Master Admin** | Certify/suspend partners; break-glass |

Partners **do not** replace Org Admin ownership. Credentials and day-to-day users remain AUTH-001 rules.

---

## Security

- Time-boxed implementation grants (AUTH-001 Professional model)  
- Full audit of partner actions  
- No cross-org partner access  
- Partner cannot issue Org Admin recovery  
- Data processing agreement required before Active certification  

---

## Commercial

| Item | Note |
|------|------|
| Partner-delivered setup | Marketplace SKU / referral fee later |
| M.P.A. internal | Current Professional path |
| AI Guided | Unchanged |

---

## MVP vs future

| Concern | MVP | Architecture now |
|---------|-----|------------------|
| Partner picker UI | Hidden | Designed |
| M.P.A. internal Professional | ✔ | ✔ |
| Partner certification program | Later Approve | Slot reserved |

---

## Acceptance (A07)

| ID | Criterion |
|----|-----------|
| IM-01 | Professional path supports internal or certified partner providers |
| IM-02 | Time-boxed access + audit required |
| IM-03 | Org Admin Finish Setup remains mandatory |
| IM-04 | MVP may hide marketplace; model ready |

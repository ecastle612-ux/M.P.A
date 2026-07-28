# 00 — Executive Summary & Business Goals

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## Problem

M.P.A. can bill, provision, entitle, and onboard organizations after purchase — but a brand-new customer cannot yet go from **first visit → paid workspace** without sales or Master Admin intervention for standard plans.

That gap blocks self-serve commercial operation for Trial / Professional / Business.

---

## Business goals

| ID | Goal | Measure |
|----|------|---------|
| BG-01 | Self-serve acquisition for standard plans | Visitor completes Checkout without staff |
| BG-02 | Zero-touch provision | Org + Org Admin + entitlements created from payment success |
| BG-03 | Time-to-value | First productive dashboard session same day as purchase |
| BG-04 | Conversion clarity | Pricing + comparison answers “what do I get?” without sales call |
| BG-05 | Enterprise still high-touch | Contact Sales / Demo; no self-serve Enterprise Checkout |
| BG-06 | Trust & recovery | Failed / canceled / abandoned Checkout has a clear resume path |
| BG-07 | Architecture reuse | No parallel billing / auth / entitlement systems |

---

## Success definition

A new property-management company can:

1. Discover M.P.A. on the public site  
2. Understand product value (tour)  
3. Compare plans and select Trial, Professional, or Business  
4. Complete Stripe Checkout  
5. Receive Org Admin credentials  
6. Complete Guided Setup and activate  
7. Reach Production Dashboard with purchased modules available  

…without any M.P.A. employee action.

---

## Non-goals

| Non-goal | Why |
|----------|-----|
| Open free account registration | Violates AUTH-001 invitation-only for principals |
| Self-serve Enterprise | Commercial / legal complexity; sales-assisted |
| Public Founder pricing | Founder remains audited Master Admin grant |
| Rebuilding Company Billing Center | Existing BILL-001 Settings → Billing remains post-purchase SoT |
| Full marketing CMS | Prefer static Canopy-bound pages in V1 |

---

## Relationship to prior rules

| Prior rule | Change |
|------------|--------|
| COM-001 C6 Invitation-only acquisition | **Superseded by A10** for Trial/Pro/Business public Checkout |
| AUTH-001 D13 / A02 Invitation-only platform | **Unchanged** for team users; purchase-triggered Org Admin provision remains the commercial entry |
| COM-001 Q10 Self-serve Checkout | **Resolved** by ACQ-001 + A10 (Pro/Business + Trial; Enterprise sales) |

---

## Risks if delayed

- Cannot serve real SMB buyers without sales bandwidth  
- BILL/AUTH/COM investment underutilized  
- Competitors win on “start now” while M.P.A. waits for staff

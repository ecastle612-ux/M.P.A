# Deployment Validation

**Parent:** [Production Deployment Support](./index.md)  
**When:** Immediately after production deploy, before Customer #1 unattended use  
**Rule:** Fail closed — do not proceed to onboarding if a smoke step fails.

---

## A. Build / release identity

- [ ] Production deployment commit SHA recorded  
- [ ] CI was green on that SHA  
- [ ] `NEXT_PUBLIC_APP_URL` loads over HTTPS  
- [ ] No env schema crash on cold start  

---

## B. Auth & role routing (DR-C1 / DR-C2)

Use disposable staging-like accounts **in production only if** this is the Customer #1 org being set up; otherwise use operator test org.

| Actor | Expected home |
|-------|----------------|
| Organization Admin / Property Manager | Mission Control / Dashboard (PM home) |
| Leasing Agent | Leasing |
| Maintenance Technician | Maintenance |
| Resident (after provision) | Resident Portal |
| Vendor (after provision) | Vendor Portal |
| Owner | Owner Portal |
| Master Admin | Master Admin |

- [ ] No SKU-only misroute to wrong workspace  
- [ ] Empty/wrong membership → `/unauthorized?reason=role` **with** recovery guidance (not a blank dead end)  

---

## C. Mission Control CTA (DR-C3)

- [ ] As Property Manager: recommendation is staff-appropriate (e.g. review maintenance queue) — **not** “Submit your first maintenance request”  

---

## D. Core journey smoke (advertised PM)

Minimum path (can use Customer #1 org under white-glove):

1. [ ] Purchase / org / subscription home (J0)  
2. [ ] Create first property (J1)  
3. [ ] Invite one staff member; accept link works (J2)  
4. [ ] Create resident (J3)  
5. [ ] Create + activate lease → **portal handoff visible** (J4 / DR-C4)  
6. [ ] Resident first login lands Resident Portal (not Unauthorized without guidance)  
7. [ ] Collect rent honesty path or Stripe if claimed (J5)  
8. [ ] Maintenance request → assign vendor → **vendor handoff** (J6 / DR-C5)  
9. [ ] Vendor first login lands Vendor Portal  
10. [ ] Mission Control / daily ops readable (J7)  
11. [ ] Owner portfolio if Owner SKU path used (J8)  

Master Admin evidence: use existing `/api/admin/launch/j0`…`j8` + Docs/Comms routes; record Pass in [Customer #1 Onboarding Support](./customer-1-onboarding-support.md).

---

## E. Integrations (only if claimed)

| Integration | Smoke |
|-------------|-------|
| Resend | One invite email delivers |
| Stripe | Test/live webhook + one checkout or explicit honesty if not live |
| SignWell | One send/sync or offline signed path documented to customer |

---

## F. Permissions / timeline / audit regression

- [ ] Non-admin cannot open Master Admin  
- [ ] Resident cannot open PM Mission Control  
- [ ] Timeline / activity surfaces still populate for lease + maintenance actions already certified  
- [ ] No regression: FO collect rent still reachable for PM  

---

## Pass / Fail

| Result | Next |
|--------|------|
| **Pass** | Proceed to Customer #1 onboarding support |
| **Fail** | [Bug-Fix Protocol](./production-bugfix-protocol.md); re-run this checklist |

| Field | Value |
|-------|-------|
| Deploy SHA | |
| Validator | |
| Result | ☐ Pass ☐ Fail |
| Notes | |
| Date | |

# Customer #1 Onboarding Support

**Parent:** [Production Deployment Support](./index.md)  
**Goal:** White-glove Customer #1 through advertised Property Manager lifecycle without adding features.  
**Authority:** [Customer Journeys](../customer-journeys.md) · [J0–J8 certification scripts](../index.md)

---

## Stance

- Operator **witnesses**; customer **drives** the mouse when possible.  
- Use existing Pass scripts — do not invent new product paths.  
- If stuck: check honesty messaging first; then bug-fix protocol — never a workaround that becomes a permanent second path.

---

## Pre-onboarding

- [ ] [Deployment Validation](./deployment-validation.md) **Pass**  
- [ ] Monitoring watch window open  
- [ ] Customer contact + session time booked  
- [ ] Confirm which integrations are **live vs honesty** (email, Stripe, SignWell)  
- [ ] Feature freeze restated to internal team  

---

## Session flow

| Step | Journey | Operator support |
|------|---------|------------------|
| 1 | J0 Purchase → trusted home | Confirm SKU = Property Manager; role lands Mission Control |
| 2 | J1 First property | Confirm property appears in nav + MC |
| 3 | J2 Team | Invite + accept; confirm role home for invitee |
| 4 | J3 Resident | Create resident record |
| 5 | J4 Lease | Activate; show **portal handoff** panel; confirm resident login |
| 6 | J5 Rent | Collect via claimed channel or honesty path |
| 7 | J6 Maintenance | Request → assign; show **vendor handoff**; confirm vendor login |
| 8 | J7 Daily ops | MC recommendations role-appropriate |
| 9 | J8 Owner (if used) | Portfolio review |
| 10 | Docs + Comms | Spot-check vault + thread/notice if advertised |

Cert scripts: `docs/26-launch-001-onboarding/j0`…`j8` + Master Admin console.

---

## Known confidence points (from dry run)

Re-verify live with customer:

1. Login routes by **role**, not SKU alone.  
2. Membership roles resolve (no false Org Admin).  
3. Staff MC CTA ≠ “Submit maintenance request.”  
4. Resident activation → clear first login.  
5. Vendor assign → clear first login.  

---

## If something fails mid-session

1. Stay calm; capture exact role, URL, action, screenshot.  
2. Classify Sev via [Bug-Fix Protocol](./production-bugfix-protocol.md).  
3. If Sev-1/2: pause that journey; do not invent UI workarounds.  
4. Communicate honestly: what works now vs what is blocked.  
5. Resume only after production verification of the fix.

---

## Success criteria

Customer #1 can complete advertised PM workflows **without ongoing assistance** after the white-glove session (or with a single documented follow-up for a Sev-2 that was fixed).

| Field | Value |
|-------|-------|
| Customer org id | |
| Primary contact | |
| Integrations claimed | |
| J0–J8 witness result | |
| Open Sev-1/2 bugs | ☐ None |
| Operator | |
| Date | |
| Ready for unattended daily use? | ☐ Yes ☐ No |

# 24 — Open Questions

**Package:** AUTH-001  
**Status:** Draft — Awaiting Approval

---

Decisions required at **Approve** (or explicitly deferred with defaults).

| ID | Question | Options | Proposed default |
|----|----------|---------|------------------|
| Q1 | Exact Supabase mapping for username-first login | Alias email / custom auth / phone | **Identity Adapter** hides provider; username is only user-facing login id |
| Q2 | Temporary password TTL | 24h / 72h / 7d | **72 hours** |
| Q3 | MFA for Org Admin at first login | Optional / required | **Optional but strongly prompted**; enforceable later by policy |
| Q4 | Past_due SaaS impact on login | Allow login + block entitlements / auto-suspend | **Allow login; block commercial entitlements**; suspend after dunning policy (BILL-001) |
| Q5 | Co-admin role in MVP | Yes / No | **Yes as delegated capabilities**; primary ownership remains singular |
| Q6 | Subaccount self-serve forgot password | Never / optional later | **Never in MVP**; Org Admin only |
| Q7 | Org switcher in MVP UI | Hide if single / always show | **Hide when only one membership** |
| Q8 | Professional Implementation Finish authority | Org Admin only / specialist may mark ready | **Org Admin must Finish** |
| Q9 | Username aesthetic rules for tenants | Opaque vs readable | **Org-seeded + suffix**; readability nice-to-have |
| Q10 | Migration of existing design-partner accounts | Big-bang / dual-run / grandfather email login | **Dual-run migration plan in Slice A**; grandfather temporary only with expiry |
| Q11 | Secondary recovery contact legal standing | Advisory / contractual | **Verified operational contact**; legal authority evidence on dispute |
| Q12 | SSO timing | Post-MVP enterprise | **Deferred**; architecture reserves slot |

---

## Dependencies to confirm at Approve

| Dependency | Owner |
|------------|-------|
| BILL-001 activation event contract | Billing + Architect |
| EML-001 templates for welcome/invite/reset | Email + Product |
| ADMIN-001 impersonation audit adequacy | Security |
| UX-005 login field rename (email → username) | Product + UX |
| Legal terms acceptance artifact | Product + Legal |

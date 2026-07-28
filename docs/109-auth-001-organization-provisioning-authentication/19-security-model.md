# 19 — Security Model

**Package:** AUTH-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## Threat model (summary)

| Threat | Mitigation |
|--------|------------|
| Cross-org data access | RLS + AuthZ + active org context |
| Open registration / account spam | Invitation-only ([27](./27-invitation-only-platform.md)) |
| Org takeover via email reset | Org Admin recovery only via Master Admin + verification |
| Privilege escalation | Capability evaluation; elevation bans |
| Password disclosure to staff | Hash-only; no view APIs |
| Impersonation abuse | ADMIN-001 audit controls; time-boxed |
| Temp password interception | Short TTL; forced change; TLS email |
| Session fixation / theft | HTTP-only cookies; rotate on privilege events |
| AI data bleed during onboarding | Org-scoped retrieval; no cross-tenant tools |
| Feature leakage beyond plan | Capability matrix fail-closed ([26](./26-subscription-capability-matrix.md)) |

---

## Actor security rules

### Master Admin (Level 0)

| Rule |
|------|
| Cannot view passwords |
| Cannot impersonate without documented audit controls (ADMIN-001) |
| Cannot silently alter usernames |
| Must verify identity before Org Admin recovery |
| All control-plane mutations audited |

### Organization Administrators

| Rule |
|------|
| Cannot elevate beyond Level 1 |
| Cannot access another organization |
| Cannot grant `master_admin` |
| Password resets of subaccounts audited |
| Cannot remove last recovery contact without controls |

### Subaccounts

| Rule |
|------|
| Cannot elevate permissions beyond grants |
| Cannot change organization |
| Cannot access other organizations |
| Cannot reset Org Admin |

---

## Cryptography & secrets

| Item | Requirement |
|------|-------------|
| Passwords | Strong adaptive hash via auth provider |
| Temp passwords | CSPRNG; hashed at rest; plaintext only in send pipeline |
| Tokens | Single-use; TTL; hashed if persisted |
| MFA secrets | Encrypted at rest |
| Service role keys | Server-only; never client |

---

## Transport & session

- TLS everywhere  
- Secure, HTTP-only, SameSite session cookies  
- Middleware refresh on authenticated routes  
- Revoke-all on password recovery / Org Admin transfer  

---

## Impersonation boundary

Impersonation is a **support presentation plane**, not credential sharing:

- Authenticated subject remains Master Admin  
- Effective subject may be target user  
- Mutations governed by ADMIN-001 security rules  
- Full audit trail required  

---

## Secure defaults

| Default | Value |
|---------|--------|
| Fail closed on missing org context | ✔ |
| Fail closed on empty property scope for scoped roles | ✔ |
| Org Admin self-serve reset | ❌ |
| User-selected dashboard | ❌ |
| Public self-registration | ❌ |
| Showing unpurchased modules as available | ❌ |
| Cross-org AI tools | ❌ |

---

## Compliance posture

Architecture targets SOC 2-ready controls (access control, audit logging, change management). Certification is a business program outside this package.

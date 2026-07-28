# 11 — Security Considerations

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval

---

## Threat model (acquisition)

| Threat | Mitigation |
|--------|------------|
| Free org spam without payment | Org only after payment / Trial Checkout success |
| Open team registration | AUTH invitation-only unchanged |
| Checkout session fixation | Stripe + server-created sessions; signed return handling |
| Metadata tampering | Server validates plan eligibility; never trust client price |
| Enterprise self-serve bypass | API rejects `enterprise` / `founder` public Checkout |
| Credential interception | HTTPS; short-lived first-login tokens; no secrets in URLs logged |
| Enumeration of orgs | Generic messages on duplicate / existing email |
| Card testing abuse | Stripe Radar + rate limits on session create |
| XSS on marketing pages | Standard CSP / React escaping |

---

## Tenancy

- Hard org isolation after provision (AUTH)  
- Buyer email → principal linking must not leak other orgs’ data on success page  
- Multi-org: only show the newly created org context on success  

---

## Secrets

- No Stripe secret keys in client  
- Service role only in server provision paths  
- Audit payloads secret-free  

---

## Alignment

Security standards: [14 — Security Standards](../14-security-standards/index.md)  
AUTH invitation-only: [AUTH-001 §27](../109-auth-001-organization-provisioning-authentication/27-invitation-only-platform.md)

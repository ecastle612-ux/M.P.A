# COM-002 — Security

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Threat model (summary)

| Threat | Mitigation |
|--------|------------|
| Forged Stripe webhooks | Signature verification; endpoint secrets |
| Entitlement bypass | Fail-closed route/API guards (existing pattern) |
| Demo → production data leak | Isolated demo data plane; no shared secrets |
| Card data exposure | Stripe-hosted Checkout; no card PAN on M.P.A. servers |
| Privilege escalation via plan change | Server-side price allowlist; never trust client price ids blindly |
| Cross-tenant access | Existing org membership RLS / checks |
| Operator abuse | Master Admin audited actions |
| Spam org creation | Checkout payment/trial card; rate limits |

---

## Secrets

| Secret | Storage |
|--------|---------|
| Stripe secret key | Server env only |
| Webhook signing secret | Server env only |
| Demo signing keys | Separate from production auth secrets |

Never expose in client bundles or marketing.

---

## Entitlement integrity

- Purchased offer → grant snapshot stored on org.  
- Client cannot self-assign SKU (hardens ADR-015 integrity).  
- Plan changes only through verified Stripe updates or audited Enterprise operator path.  
- Search / nav continue to hide unentitled modules.

---

## Demo security

- Separate database/schema/project.  
- Short-lived sessions.  
- Rate limits.  
- `noindex`.  
- No production PII.  
- Outbound communications disabled or sandboxed.

---

## Privacy & compliance notes

- Checkout email used for account bind — disclose in privacy copy.  
- Stripe is payment processor — DPA / subprocessors list update at Implement.  
- Tax/VAT handling via Stripe Tax when enabled.  
- Retention: canceled org data retained per platform retention policy (reference Security Standards).

---

## Auth interactions

| Flow | Security requirement |
|------|----------------------|
| Post-Checkout account create | Email verified before full access (or soft verify with limited window — Approve) |
| Password reset | Existing auth patterns |
| Enterprise invites | Signed invite tokens |

---

## Logging

- No card data in logs.  
- Redact Stripe secrets.  
- Correlate `checkout_session_id` / `subscription_id` / `org_id` for forensics.

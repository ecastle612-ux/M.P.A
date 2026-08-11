# Master Admin — Security & Observability

**Parent:** [70 Master Admin Command Center](./index.md)  
**Status:** Draft / Proposed

---

## Security model (PASS target)

Master Admin is the **highest-privilege product surface** in M.P.A. Design for explicit control, not convenience.

### Pillars

| Pillar | Requirement |
|--------|-------------|
| RBAC | Platform operator gate + fine-grained capabilities ([matrix](./permissions-and-mutations.md)) |
| Capabilities | Action-level authorization beyond “is operator” |
| Organization scoping | Server-resolved org ids; path/body mismatch rejected |
| Mutation authorization | Capability + confirmation + audit for writes |
| Audit logging | `platform_support_audit_events` (operator) + domain `audit_events` where applicable |
| Session security | Standard auth session; logout clears impersonation cookies (STAB-011) |
| CSRF | Same-site + existing mutating-route protections on `/api/admin/**` |
| Rate limiting | Stricter limits on retry, resend, impersonation, suspend |
| Sensitive-data minimization | Scrub secrets, payment credentials, excessive PII in UI, logs, audit context |

### Anti-patterns (forbidden)

- Broad RLS bypass exposed to the client  
- Service-role key in browser  
- “God mode” that disables entitlement checks inside customer apps without View-As governance  
- Trusting `organization_id` from the client for authorization decisions  
- Logging Authorization headers, cookies, Stripe webhook secrets, or raw card data  

### Impersonation

- **Only** if already governed (Owner Ops View-As).  
- Read-only by default unless a future ADR explicitly expands.  
- Always: reason, audit start/stop, visible banner in UI, cookie hygiene on logout.  

### Enterprise / constitution

- Operators may assist Enterprise **sales** customers as organizations.  
- Master Admin must not create UI that sells Enterprise as a SKU tier or invents Professional/Business tiers.

---

## Observability integration (PASS target)

**Do not create a second logging/error system.**

| Concern | Integration |
|---------|-------------|
| Exception capture | Existing observability module (`captureException`, structured `log`) |
| Durable critical feed | `platform_error_events` (Sprint 5) |
| MA Errors surface | Query that table |
| MA Overview critical tile | Aggregate from that table |
| Org Detail errors tab | Filter by `organization_id` |
| Notification failures | `maintenance_notifications` email delivery fields |
| Webhook failures | Existing webhook event tables |
| Auth / RLS denials | Structured observability events (metadata category); surface counts in Overview/Operations |

### Severity & resolution

- Severities already modeled: `debug | info | warning | error | critical`.  
- Overview emphasizes `error` + `critical`.  
- Resolution state may be additive later; until then, triage via audit notes / support actions without deleting events.

### Correlation UX

Every error detail should promote:

- `request_id`  
- `organization_id` → link to Organization Detail  
- `route`  
- `source`  
- timestamp  

---

## Mobile / responsive (security note)

- Phone clients still require full operator auth; do not create a weaker “mobile admin token.”  
- Destructive actions may be desktop-only in UX while APIs still enforce the same server checks.

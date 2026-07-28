# 06 — Security

**Package:** OWNER-001  
**Status:** Approved · Phase 1 ✅ COMPLETE  
**Section:** §9 Security

---

## Objectives

Protect owner financial and personal data while enabling commercial self-serve transparency. Owner Portal is a **high-trust read surface** — compromise looks like a data leak, not a UX bug.

---

## Multi-tenant isolation

| Requirement | Detail |
|-------------|--------|
| Organization boundary | Every owner query is constrained to the active organization context |
| Cross-org prohibition | Owners in Org A must never read Org B properties, statements, messages, or vault objects |
| Role boundary | `property_owner` cannot escalate to PM/admin via portal UI |
| Property scope | When an owner is entitled to a subset of org properties, lists and totals must not include out-of-scope assets (scoping model finalized in Open Questions) |
| RLS / server checks | Prefer existing Supabase RLS + server authorization helpers; no client-trusted filters as sole control |
| Test Mode isolation | Master Admin demo fixtures never appear in production owner sessions |

---

## Audit logging

| Event class | Audit expectation |
|-------------|-------------------|
| Authentication / portal access | Existing auth/session audit patterns |
| Statement / report download | Record actor, org, artifact/version id, timestamp |
| Document open/download | Vault access audit (reuse existing vault audit behavior) |
| Message read/reply | Reuse messaging audit if present; reply create is auditable |
| Notification preference changes | Prefer existing preference update trails |
| Impersonation / Test Mode | ADMIN-001 audit requirements apply |

OWNER-001 must **not** invent a second audit system. Extend or call existing audit hooks.

---

## Read-only financial data

| Rule | Binding |
|------|---------|
| Owner Portal financial surfaces are **read-only** | **Yes** |
| No owner-initiated ledger mutations | Charges, payments, expenses, settlements |
| No owner-initiated payouts / transfers | FIN-003 only |
| Totals must come from authorized read models | No client-side fabrication of balances |
| Error honesty | Failed loads must not silently show $0 as success |
| Placeholder payouts | Clearly non-operational; no Stripe calls |

---

## Secure document access

| Requirement | Detail |
|-------------|--------|
| Vault as sole binary plane | PDFs/photos via Document Vault / media foundation |
| Authorization before URL | Capability + org (+ property) checks before signed download |
| No public bucket browsing | Owners cannot list unrelated vault objects |
| Version integrity | FIN-001 versioning rules: never overwrite; download specific version |
| Category filtering | UI categories are conveniences; security is still object-level auth |
| Maintenance photos | Treated as media/vault objects with same isolation rules |

---

## Communication security

- Message reply must not allow arbitrary broadcast to all residents/vendors.  
- Announcement read path must not imply announcement publish rights.  
- Deep-links from notifications must re-check authorization at target.

---

## AI security (if used)

- Existing AI services only; owner context must not exfiltrate cross-tenant data into prompts.  
- No AI feature may bypass RBAC to fetch financial/docs.  
- No forecasting/tax AI in MVP.

---

## Threat notes (design awareness)

| Threat | Mitigation direction |
|--------|----------------------|
| IDOR on statement/document ids | Server-side scope checks |
| Enumerating other owners’ properties | Property access filter + RLS |
| Demo data confusion | Strict Test Mode gating |
| Over-granting `communication:*` | Prefer narrow read grant |
| Placeholder payout social engineering | Explicit “not available” copy; no fake success |

---

## Compliance posture

- Follow [Security Standards](../14-security-standards/index.md).  
- No new secrets in client bundles.  
- No storage of bank account numbers for owners in OWNER-001 (Connect onboarding is FIN-003).

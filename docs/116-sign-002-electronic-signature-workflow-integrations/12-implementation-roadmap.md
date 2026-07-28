# 12 — Implementation Roadmap (Slices A–D)

**Package:** SIGN-002  
**Status:** Approved  
**Slice A:** Implemented — stop for review before authorizing B

---

## Gate sequence

```
Approve SIGN-002 package ✔
  → Authorize Slice A ✔ → Implement A ✔ → Validate (in review)
  → Authorize Slice B → Implement B → Validate
  → Authorize Slice C → Implement C → Validate
  → Authorize Slice D → Harden / report / QA → V1.0 checklist
```

No slice begins without explicit authorization after Approve. **Do not start Slice B until Slice A review completes.**


---

## Slice A — Property Operations

**Outcome:** Lease, renewal, owner agreement, move-in/out acknowledgement integrations on originating records.

| Step | Work |
|------|------|
| A.1 | Align lease panel UX labels with [03](./03-cross-platform-ux.md); countersign org settings |
| A.2 | Renewal packages (`lease_renewal`) + history on lease |
| A.3 | Owner management agreement from Owner record + portal documents |
| A.4 | Move-in acknowledgement package in move-in workflow |
| A.5 | Move-out acknowledgement package in move-out workflow |
| A.6 | Tests: multi-signer, decline, expire, vault, notify, audit, lease status sync |

**Done when:** [13](./13-acceptance-checklist.md) Slice A rows pass.

---

## Slice B — Facility Operations

**Outcome:** Vendor/contractor Active gate; optional work authorization; inspection sign-off; optional safety ack.

| Step | Work |
|------|------|
| B.1 | Vendor agreement before Active |
| B.2 | Contractor labeling + same gate |
| B.3 | Org setting work authorization on WO |
| B.4 | Inspection template `requires_signoff` |
| B.5 | Safety ack setting (default off) |
| B.6 | Facility-independence tests (Property module off) |

**Done when:** Slice B checklist rows pass.

---

## Slice C — Core Platform

**Outcome:** Employee/policy/general/custom signature requests via Org Documents + vault.

| Step | Work |
|------|------|
| C.1 | Org Documents “Request signature” |
| C.2 | Employee acknowledgement send from Team |
| C.3 | Policy version acknowledgement fan-out |
| C.4 | Custom request path (metadata-flexible) |
| C.5 | Tests for own-package read isolation |

**Done when:** Slice C checklist rows pass.

---

## Slice D — Hardening & reporting

**Outcome:** Cross-module reporting, compliance summary, turnaround metrics, QA-001 journeys, docs freeze.

| Step | Work |
|------|------|
| D.1 | Outstanding / completed / expiring widgets wired to filters in [11](./11-reporting-matrix.md) |
| D.2 | Turnaround metric in existing reporting framework |
| D.3 | Permission regression + portal visibility matrix tests |
| D.4 | Update V1.0 readiness docs with SIGN-002 CERT notes |
| D.5 | No open P0 on signature workflows in [13](./13-acceptance-checklist.md) |

**Done when:** Full V1.0 acceptance checklist signed.

---

## Explicit non-work

- No SignWell SDK in modules  
- No second webhook route family  
- No new permission strings unless amended  
- No wet-ink / notary  

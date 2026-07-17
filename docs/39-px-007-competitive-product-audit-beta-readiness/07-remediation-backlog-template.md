# PX-007.07 — Remediation Backlog Template

**Status:** Template — populate after audit approval  
**Rule:** Every item must cite a **measurable problem**. No cosmetic-only entries.

---

## Item format

```markdown
### PX-007-RNNN — [Short title]

**Problem:** [What measurable harm occurs?]
**Evidence:** [Screenshot, click count, audit step, contrast ratio, user quote]
**Affected surface:** [Route / component — do not rewrite unrelated areas]
**Proposed fix:** [Minimal change]
**Success metric:** [e.g. clicks reduced 7→4, WCAG AA pass, zero dead-end on flow X]
**Not doing:** [Explicit scope boundary]
**PX-006 baseline touched?** Yes / No — if Yes, justify defect
**Priority:** P0 / P1 / P2
**Status:** Proposed | Approved | Implemented | Rejected
```

---

## Example (valid)

### PX-007-R001 — Maintenance detail vendor rail below fold on tablet

**Problem:** Vendor assignment requires scroll + miss on 768px; increases time-to-assign.  
**Evidence:** Audit step 6; 2 extra scrolls; assign CTA not visible in first viewport.  
**Affected surface:** `/maintenance/[workOrderId]` layout only.  
**Proposed fix:** Collapse lower rail sections by default on `< lg`; pin vendor panel.  
**Success metric:** Assign vendor visible without scroll at 768px.  
**Not doing:** Redesign maintenance form fields.  
**PX-006 baseline touched?** No — layout defect only.  
**Priority:** P1  

---

## Example (invalid — reject)

### ~~PX-007-RXXX — Restyle property list to look more like DoorLoop~~

**Problem:** "Looks different from DoorLoop."  
**Reject reason:** Preference, not measurable harm. No click/discoverability evidence.

---

## Current backlog

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| — | *Populate after audit* | | |

---

## Gate

Items move to **Approved** only with stakeholder sign-off. Implementation uses normal PR process; cite PX-007-RNNN in PR description.

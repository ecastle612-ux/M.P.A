# 09 — Approval

**Package:** DPX-002  
**Status:** ✅ **Approved**

---

## Decision

**`APPROVE DPX-002`** recorded 2026-07-21.

The Property → Resident → Lease → Payment → Maintenance → Vendor → Communication workflow is the **reference implementation** for the entire platform.

No other workflow may be implemented to a lower standard.

### Approved scope

- Certified path S1→S10 ([01](./01-scenario-and-scope.md))  
- No new modules · no nav expansion · no architecture redesign  
- **Amendments A–G** ([11](./11-amendments.md))  
- Freeze / gold-standard rule after PASS ([12](./12-reference-workflow-freeze.md))  
- Successor roadmap: DPX-003 Leasing · DPX-004 Maintenance lifecycle · DPX-005 Accounting lifecycle  

### Record

| Field | Value |
| --- | --- |
| Approved by | Stakeholder (`APPROVE DPX-002`) |
| Date | 2026-07-21 |
| Notes | Gold standard sprint; software should disappear — only the work remains |

## Implementation unlocked

Implement only against this package + Amendments A–G + UX-009 primitives on allowlisted surfaces.

Material changes restart Design → Document → Approve.

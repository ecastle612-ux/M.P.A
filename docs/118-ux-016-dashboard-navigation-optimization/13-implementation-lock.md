# 13 — Implementation Lock

**Package:** UX-016  
**Status:** 🔒 **LOCKED** until [12 — Approval record](./12-approval-record.md) is signed  
**Date:** 2026-08-05  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Verdict

**Do not implement application/UI code for UX-016 yet.**

This package redesigns dashboard hierarchy, sidebar presentation, notification grouping, and mobile work-first layout across portals. That is a material UX/architecture presentation change and requires Design → Document → **Approve** before Implement.

---

## What must not ship until Approve + slice authorize

| Area | Locked work |
|------|-------------|
| Ops / PM home | Reordering Command Center into UX-016 sections |
| Portal homes | Resident / Owner / Technician / Vendor / Leasing / Support hierarchy rewrite |
| Sidebar | Workflow regrouping / collapse model |
| Top bar | Removing non-allowed items / restructuring chrome |
| Notifications UI | Critical / Today / Later grouping presentation |
| Mobile bottom nav | Frequency-based slot changes driven by this package |
| Design system abuse | New tokens/language under guise of UX-016 |

Documentation and ADRs **are allowed** (current work).

---

## What is allowed now

- Refine this Blueprint and ADR-032  
- Resolve open questions into the approval record  
- Bug fixes that do **not** change dashboard IA / nav grouping patterns  
- Visual craftsmanship already authorized under other packages (e.g. foundation polish) **without** adopting UX-016 IA early  

---

## After Approve

1. Accept ADR-032  
2. Issue slice authorize phrase(s)  
3. Implement **only** authorized slice scope  
4. Preserve: no business logic, routing, permissions, or workflow changes  
5. Verify five-second test + a11y smoke for touched surfaces  
6. Commit citing `UX-016` + authorize phrase  

Material scope changes after Approve restart Design → Document → Approve.

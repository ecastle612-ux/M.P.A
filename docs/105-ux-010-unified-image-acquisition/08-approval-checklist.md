# 08 — Approval Checklist

**Package:** UX-010 — Unified Image Acquisition Standard  
**Status:** 📝 **Draft — Awaiting Approval** · Implement 🔒 **locked**  
**Gate:** Design → Document → **Approve** → Implement

---

## Pre-Approve verification

| # | Check | Done |
|---|-------|------|
| 1 | Reuses API-002A MediaService / MediaUpload — no duplicate storage design | ☑ |
| 2 | Dual option Capture + Upload From Device is mandatory | ☑ |
| 3 | Component architecture defined (`ImageAttachmentButton` / `ImagePicker`) | ☑ |
| 4 | Coverage matrix lists Partial / Gap / Follow-up surfaces | ☑ |
| 5 | Mobile + desktop + fallbacks documented | ☑ |
| 6 | Future features architected but not scoped for Slice A implement | ☑ |
| 7 | Open questions have proposed decisions | ☑ |
| 8 | Acceptance criteria written | ☑ |
| 9 | No application code shipped under this package while Draft | ☑ |
| 10 | Commercial freeze / FIN-003 not unlocked by this package | ☑ |

---

## Approve decisions

Confirm or amend [07](./07-open-questions.md) Q1–Q7, especially Q3 (vendor PDF) and Q7 (sequencing vs freeze).

---

## Sign-off (to be completed at Approve)

| Role | Name | Date | Decision |
|------|------|------|----------|
| Product | | | Approve / Approve with amendments / Reject |
| Lead Architect | | | Approve / Reject |
| Design / UX (Canopy) | | | Approve / Reject |

### On Approve

1. Set README Status → **Approved**.  
2. Unlock **Slice A only** (unless Approve says otherwise).  
3. Update Implementation Gate registry.  
4. Implement only against this package + API-002A.  
5. Do **not** treat Approve as FIN-003 unlock or commercial freeze lift.

### On Reject

Remain Draft; Implement stays locked; document reasons.

---

## Implementation Gate reminder

> **UX-010 implementation is NOT authorized while Status is Draft.**  
> No `ImagePicker` / `ImageAttachmentButton` code, no vendor migration, no call-site changes until Status is **Approved** and a slice is unlocked.

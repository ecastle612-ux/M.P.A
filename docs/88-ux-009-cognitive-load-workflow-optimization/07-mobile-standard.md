# 07 — Mobile Standard (Priority 9)

**Package:** UX-009  
**Viewport reference:** 390×844 (iPhone-class) + mid-range Android Chrome  
**Depends on:** UX-008 drawer / ＋ New (do not regress)

---

## Checklist (every major page)

| Question | Pass if |
| --- | --- |
| One-hand completable for top task? | Primary CTA in thumb zone or sticky toolbelt |
| Primary actions without excessive scroll? | Visible within first screen or sticky |
| Important buttons always reachable? | Toolbelt / sticky CTA; not only top-right desktop patterns |
| Expandable sections for secondary content? | PD applied |
| Focused vs overwhelming? | ≤1 primary purpose above fold; no equal-weight card stack |

## Sticky conflict resolution

Bottom stacking order (bottom → up):

1. System safe-area  
2. UX-008 **＋ New** (global create) when on list/shell contexts that use it  
3. Entity **toolbelt** / form primary CTA when on detail/edit  
4. Floating **AI** launcher — offset so it never covers 2 or 3  

If conflict: prefer task CTA > ＋ New > AI launcher position adjustment.

## Scroll target

≥40% average reduction in mobile scroll height on audited **detail** pages (S4, S6, S9 minimum), where practical. Document any page that cannot hit 40% without removing information (disclose instead; do not delete).

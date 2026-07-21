# BR-002 — Surface Audit Matrix

**Reviewer:** _pending_  
**Date:** _pending_  
**Build / commit:** _pending_  
**Overall sprint verdict:** **INCOMPLETE** until every row is PASS

Legend: Q1 Recognizable · Q2 M.P.A. readable · Q3 Light/dark · Q4 Size · Q5 Production quality  
BR-002A scores (each /10, any &lt; 9 = FAIL): R Readability · B Balance · C Contrast · P Premium Feel · F First Impression  

Surface PASS = all five YES **and** all scores ≥ 9.

---

## Auth & first run

| Surface | Purpose | Variant reason | Q1 | Q2 | Q3 | Q4 | Q5 | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login | `login` | Hero lockup — first impression | | | | | | | |
| Signup | `login` | Same hero as login | | | | | | | |
| Password reset / Forgot password | `login` | Same hero family | | | | | | | |
| Loading screen | `loading` | House mark only | | | | | | | |
| Splash screen | `splash` | Hero / larger mark | | | | | | | |
| Onboarding / Setup | `onboarding` | Hero family | | | | | | | |

## App chrome

| Surface | Purpose | Variant reason | Q1 | Q2 | Q3 | Q4 | Q5 | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile drawer | `drawer` | House + large typography M.P.A. | | | | | | | |
| Desktop sidebar (expanded) | `sidebar` | Standard lockup | | | | | | | |
| Desktop sidebar (collapsed) | `sidebar` collapsed | Compact typography M.P.A. | | | | | | | |
| Mobile header | `header` | Compact house + M.P.A. | | | | | | | |

## Messaging & install

| Surface | Purpose | Variant reason | Q1 | Q2 | Q3 | Q4 | Q5 | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Emails | `email` | Horizontal lockup | | | | | | | |
| Browser icon | `browser` / icons | Icon only | | | | | | | |
| PWA icon | icons pipeline | Icon only | | | | | | | |
| App install / manifest | icons pipeline | Icon only | | | | | | | |

## Recovery & empty

| Surface | Purpose | Variant reason | Q1 | Q2 | Q3 | Q4 | Q5 | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Error screens (global / friendly / unauthorized / not-found) | `header` | Compact polished lockup | | | | | | | |
| Empty states (branded) | `header` or contextual | Must not look like favicon leftovers | | | | | | | |
| Offline fallback | static certified | Match loading/header intent | | | | | | | |

---

## Current-state gap notes (pre-implementation, BR-001 baseline)

These are **hypotheses for the human audit**, not final FAILS:

1. **Loading** currently may render typography lockup — BR-002 requires **house mark only**.  
2. **Drawer/header** may still show PNG-scale marks that make embedded text hard to trust; BR-002 requires **large typography “M.P.A.”**.  
3. **Email** may still be square-mark-only HTML — BR-002 requires **horizontal lockup**.  
4. Technical certification page PASS does **not** equal human PASS.

Fill YES/NO only from real screenshots / devices after purpose-optimized implementation lands.

---

## Sprint completion checklist

- [ ] Every matrix row Verdict = **PASS**  
- [ ] Before/after evidence attached for changed surfaces  
- [ ] Phone + tablet + desktop captured where applicable  
- [ ] Light + dark captured where applicable  
- [ ] Design Partner quality affirmed by human reviewer signature below  

**Human reviewer sign-off:** ______________________ date ________  

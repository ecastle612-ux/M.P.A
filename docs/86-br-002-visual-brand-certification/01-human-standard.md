# BR-002 — Human Standard

## Rule

Correct component usage is **evidence of wiring**, not certification.

Think like a Design Director (BR-002A):

> If this were the first screen a property manager ever saw, would I proudly demo it to a paying customer?

Anything less than an immediate **yes** is a **FAIL**.

A surface is certified **PASS** only when a human reviewer, looking at real device screenshots (or live device), would immediately say the branding looks polished and production-ready for Design Partner demos — comparable to premium SaaS.

**Brand recognition takes priority over logo fidelity.**

## Five questions (every surface)

For each branded location, answer **YES / NO**:

| # | Question |
| --- | --- |
| 1 | Is the logo **immediately recognizable**? |
| 2 | Is **“M.P.A.”** readable? (via typography lockup and/or mark — never guessed) |
| 3 | Is the **correct light/dark** presentation used? |
| 4 | Is the logo **appropriately sized** for that surface? (neither tiny nor oversized) |
| 5 | Would a property manager think this looks **production quality**? |

**Surface PASS** requires YES on all five.  
Any NO → **FAIL** (sprint incomplete for that surface).

## Automatic FAIL conditions

Regardless of component wiring, FAIL if any of the following appear:

- Unreadable text (embedded in PNG or typography too small/low contrast)
- Blurry / pixelated / stretched artwork
- Incorrect light/dark asset for the background
- Tiny logo (favicon-scale on product chrome)
- Oversized logo that breaks the composition
- Inconsistent spacing relative to nearby chrome
- Incorrect alignment (off-center hero, clipped mark, cramped lockup)

## What “readable M.P.A.” means by purpose

| Purpose class | How “M.P.A.” must read |
| --- | --- |
| Loading / splash interim (house only) | Brand recognition via **house mark**; wordmark not required on-screen |
| Drawer / header / sidebar | **Typography** “M.P.A.” at large readable size next to house mark — do not rely on PNG embedded text |
| Login / hero | Typography lockup: M.P.A. + subtitle + Property Operations OS |
| Email | Horizontal lockup with readable brand name |
| Browser / PWA icon | Icon-only; wordmark not expected in the tab glyph |

## Reviewer protocol

1. Open the surface on phone, tablet, and desktop (as applicable).  
2. Toggle light and dark (as applicable).  
3. Answer the five questions without zooming.  
4. Record YES/NO + notes in [03-surface-audit-matrix.md](./03-surface-audit-matrix.md).  
5. Attach evidence per [04-evidence-and-devices.md](./04-evidence-and-devices.md).  

Silence or “looks fine in code” is not approval.

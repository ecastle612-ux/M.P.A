# BR-002 — Purpose-Optimized Presentation

## Principle

Do **not** force one logo treatment onto every surface.

Optimize each purpose independently while preserving one unified brand identity through `BrandLogo` (BR-001 single source of truth).

This amends BR-001 Amendment A presentation details where they conflict. ADR-019 assets and contrast mapping remain unchanged.

---

## Purpose treatments (binding after approval)

### Loading

```
🏠 House mark only
```

- **No** embedded-text reliance  
- **No** typography lockup (no “M.P.A.” / tagline / product line on loading)  
- Calm, centered, crisp  
- Mark size: large enough to recognize the house (typically ≥ 96px display; never favicon-scale)

**Why:** Loading is interim. Typography clutter competes with the wait state; the house mark carries recognition.

### Navigation drawer

```
🏠 House mark
M.P.A.   ← large typography (not PNG text)
```

- House mark at readable size (do not shrink below embedded-text threshold as sole brand)  
- **Large** “M.P.A.” as Canopy typography  
- Optional collapsed state: same pattern, tighter spacing — still typography “M.P.A.”  
- **Never** icon-only on a full drawer

**Why:** Drawer is the primary mobile brand moment; managers must read “M.P.A.” instantly.

### Desktop sidebar

```
Expanded:  🏠  M.P.A. + My Property Assistant (typography)
Collapsed: 🏠  M.P.A. (typography)
```

- Same identity as drawer; density tuned for rail width  
- Never icon-only in the product sidebar

### Header (mobile top bar)

```
🏠  M.P.A. (typography)
```

- Compact but polished; must pass the five human questions on phone widths

### Login / Signup / Password reset (Hero)

```
🏠 House mark
M.P.A.
My Property Assistant
Property Operations OS
```

- Premium stacked lockup  
- Correct asset for auth dark (or light) shell  
- Mark ≥ authentication floor; typography hierarchy clear

**Why:** First impression for Design Partners.

### Splash / Onboarding hero moments

Same hero family as login unless a dedicated splash surface needs a larger mark (≥ splash floor).

### Emails

```
🏠  M.P.A.   ← horizontal lockup
```

- Horizontal composition optimized for email clients  
- Dark header → light logo asset (ADR-019)  
- Readable brand name in HTML text or approved lockup pattern from branding helpers — not a tiny square alone

### Browser / PWA / App install icons

```
🏠 Icon only
```

- Favicon, PWA icons, launcher icons  
- **Never** used as the logo on login, drawer, or loading product chrome

### Error screens / Empty states

- Prefer **header/drawer compact lockup** (house + typography “M.P.A.”)  
- Must feel intentional, not a leftover favicon  
- Correct contrast for the surface

---

## Unified identity rules (all purposes)

1. One asset pair (ADR-019) selected by surface tone.  
2. One React API: `<BrandLogo purpose="…" />`.  
3. Purpose owns layout, typography presence, and mark scale — pages do not.  
4. Spacing/alignment come from BrandLogo tokens, not one-off page CSS that fights the lockup.

# 01 — UX Standard

**Package:** UX-010  
**Status:** Draft — Awaiting Approval

---

## Trigger labels (any of these)

When the product exposes any of:

- Add Image  
- Attach Image  
- Upload Photo  
- Add Photo  
- Change Photo / Replace Photo (opens same acquisition sheet, then replace)

…show the **Unified Image Acquisition** sheet (or equivalent inline dual actions).

---

## Unified picker options

| Order | Option | User-facing label | Icon (suggested) |
|-------|--------|-------------------|------------------|
| 1 | Capture | **Capture Photo** | Camera |
| 2 | Device | **Upload From Device** | Folder / device |

**Rules:**

- Both options **always** present when images are allowed.  
- Do not hide Capture on desktop — use webcam when supported; otherwise graceful fallback (see [04](./04-mobile-and-desktop-behavior.md)).  
- Do not present Capture alone without Upload From Device.  
- Cancel / dismiss must be obvious (sheet dismiss, Esc, backdrop).

---

## Interaction flow (canonical)

```
Idle (no image)
    ↓  user taps Add / Attach / Upload
Acquisition sheet
    ├─ Capture Photo  → device camera / webcam → file
    └─ Upload From Device → system file picker (images only)
    ↓
Preview (local or post-edit)
    ↓  optional editor when intent.imageEditor requires/allows
Confirm
    ↓
Upload (MediaService — progress visible)
    ↓
Ready (bound media_asset_id)
```

When an image already exists:

```
Ready
    ├─ Replace → Acquisition sheet → same flow → new asset binding
    └─ Remove  → confirm if destructive → clear binding / soft-delete per API-002A
```

**Same interaction everywhere** — profile, work order, vendor finish photo, future property gallery, etc. Only intent config (kind, crop, maxBytes) changes.

---

## States

| State | UX |
|-------|-----|
| Empty | CTA: Add / Attach / Upload Photo |
| Acquiring | Sheet open; focus trapped |
| Previewing | Thumbnail + Continue / Retake / Cancel |
| Editing | Existing `ImageEditorModal` when intent requires |
| Uploading | Determinate progress; Cancel |
| Processing | “Optimizing…” (variants); asset already usable by id |
| Ready | Preview + Replace + Remove |
| Failed | Error + Retry + choose again |
| Disabled | CTA disabled; no sheet |

---

## Accessibility

| Requirement | Detail |
|-------------|--------|
| Semantics | Options are buttons; sheet is dialog/`role="dialog"` with label |
| Keyboard | Tab order Capture → Upload → Cancel; Esc dismisses |
| Screen readers | Announce success / failure via `aria-live` |
| Touch | Targets ≥ platform mobile minimum (Canopy / UX-006) |
| Reduced motion | No required motion for success |

---

## Visual language

- Canopy tokens only (`@mpa/ui` Button, Modal/sheet patterns).  
- No emoji required in production UI — camera/folder icons from the approved icon set; emoji in this doc are mnemonic only.  
- Do not invent a second visual system for vendor vs resident vs manager.

---

## Explicit forbid list

| Forbidden pattern | Why |
|-------------------|-----|
| “Paste image URL” | API-002A / BUG-002 |
| Module-local Dropzone copy | Duplicates UX |
| Capture-only with no Upload From Device | Breaks desktop / privacy choice |
| Upload From Device only on mobile when camera exists | Breaks field ops |
| Direct `supabase.storage` in components | API-002A reuse law |
| Different copy per portal for the same action | Fragmentation |

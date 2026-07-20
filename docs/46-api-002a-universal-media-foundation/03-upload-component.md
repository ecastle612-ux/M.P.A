# 03 — Upload Component

**Package:** API-002A  
**Status:** Draft — Ready for Approval  
**Canopy / standards:** [Component Standards — FileUpload](../12-component-standards/index.md) · [Canopy](../06-design-language/index.md) · [Experience Architecture](../21-experience-architecture/index.md)

---

## Naming

Component standards historically list `FileUpload`. This package standardizes the shipped pattern name as:

**`MediaUpload`**

(Alias documentation may say FileUpload ≡ MediaUpload. One implementation only.)

Location (post-Approve): design-system / shared patterns — **zero domain business logic**. Intent configuration is passed in by modules.

---

## Reuse law

```
✅ <MediaUpload intent="profile_photo" … />
✅ <MediaUpload intent="property_gallery" multiple … />

❌ Module-specific Dropzone copy-paste
❌ <Input type="url" placeholder="Photo URL" />
❌ Direct supabase.storage.from(…) in React components
```

---

## Intent configuration

Modules pass a typed intent; MediaUpload applies policy:

```ts
type MediaUploadIntent = {
  kind: MediaKind
  entityType: string
  entityId?: string
  multiple?: boolean
  maxFiles?: number
  maxBytes?: number
  accept: string[]          // MIME allowlist
  imageEditor?: 'none' | 'optional' | 'required'
  cropAspect?: number       // e.g. 1 for avatar
  capture?: boolean         // prefer camera on mobile
  replaceAssetId?: string   // replace flow
}
```

Profile photo intent example:

- `kind: profile_photo`
- `multiple: false`
- `accept: image/jpeg, image/png, image/webp`
- `maxBytes: 10_485_760`
- `imageEditor: required`
- `cropAspect: 1`

---

## UX capabilities

| Capability | Behavior |
|------------|----------|
| Drag & drop | Desktop drop zone; visual active state; reject invalid types with friendly message |
| Tap to upload | Full zone clickable; native file picker |
| Camera capture | `capture="environment"` / user-facing when intent allows and device supports |
| Preview | Thumbnail preview before/during upload; post-crop preview before confirm |
| Crop / rotate / zoom | Image editor modal for required/optional image intents |
| Replace | Selecting new file replaces binding; prior asset soft-deleted via MediaService |
| Delete / remove | Clears binding; confirms if destructive |
| Multiple | Queue list with per-file status when `multiple` |
| Large uploads | Chunked/resumable where Storage supports; progress % |
| Progress | Determinate bar + percent + file name; `aria-valuenow` |
| Pause | Pause in-flight when transport supports; otherwise cancel+resume from queue |
| Cancel | Aborts request; marks asset canceled; cleans pending object |
| Retry | One-click retry for failed items |
| Duplicate detection | If hash matches existing ready asset in same org/user scope, offer “Use existing” vs “Keep both” |
| Loading | Skeletons / busy state on save; never silent |

UX bar: feel like modern SaaS (Drive / Photos) — calm, clear, no URL pasting.

---

## Image editor (crop / rotate / zoom)

| Control | Notes |
|---------|-------|
| Crop | Aspect locked when `cropAspect` set; free crop when optional |
| Rotate | 90° increments (+ optional fine rotate if low-cost) |
| Zoom | Pinch / slider |
| Preview | Live preview of output frame |
| Confirm | Exports raster for upload (not only CSS crop) |
| Cancel | Returns to picker without upload |

Editor runs client-side before upload for avatars (smaller payload, correct framing). Server still re-encodes variants from the uploaded master.

---

## Accessibility

| Requirement | Detail |
|-------------|--------|
| Keyboard | Tab to zone; Enter/Space opens picker; Esc closes editor |
| Labels | `aria-label` on zone, buttons, progress |
| Status | `aria-live` for success, failure, validation |
| Focus | Focus trap in editor dialog; restore focus on close |
| Contrast | Canopy tokens only; no black-on-black states |
| Reduced motion | Respect `prefers-reduced-motion` for progress animations |

---

## States

```
empty → selecting → editing (optional) → uploading → processing → ready
                                              ↘ failed → retry
offline → queued → uploading (when online)
```

---

## Module integration patterns

### Controlled binding

```ts
<MediaUpload
  intent={profilePhotoIntent}
  value={assetId}
  onChange={(next) => setAssetId(next)}
  onClear={() => setAssetId(null)}
/>
```

### Uncontrolled create-then-bind

Parent receives `onUploaded(asset)` and PATCHes domain entity.

Setup wizard profile step: MediaUpload → on confirm store pending asset id → profile save sends `avatarMediaAssetId` (not URL).

---

## Explicitly forbidden UI

- Text field labeled “Profile photo URL”, “Avatar URL”, “Image URL”
- Asking users to host images elsewhere and paste links
- Per-module custom crop libraries without MediaUpload wrapper

---

## Mobile

- Large tap targets; full-width drop zone becomes “Add photo”
- Prefer camera + library chooser
- Editor usable with touch (pinch zoom, rotate buttons)
- Do not rely on hover affordances

---

## Relationship to migration uploader

Migration CSV/Excel upload remains a **separate, non-media** import tool. It must not become the pattern for photos/documents. MediaUpload is not used for migration binary parse jobs unless a future design explicitly unifies them (not required for API-002A).

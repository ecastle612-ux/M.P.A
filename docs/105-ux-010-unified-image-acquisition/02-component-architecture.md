# 02 — Component Architecture

**Package:** UX-010  
**Status:** Draft — Awaiting Approval

---

## Naming

| Name | Role |
|------|------|
| **`ImageAttachmentButton`** | Primary entry CTA (“Add Image” / “Attach Image” / “Upload Photo”) that opens acquisition |
| **`ImagePicker`** | Acquisition sheet / dual-option chooser (Capture \| Upload From Device) |
| **`MediaUpload`** | Existing API-002A pipeline component — **retained** as the upload/process/bind engine |

**Alias:** Component Standards `FileUpload` ≡ Media foundation pattern. UX-010 does not rename MediaUpload; it **composes** it.

Proposed location (post-Approve):

```
apps/web/src/components/media/
  image-attachment-button.tsx   ← NEW (Slice A)
  image-picker.tsx              ← NEW (Slice A)
  media-upload.tsx              ← EXISTING (refactor to consume ImagePicker)
  image-editor-modal.tsx        ← EXISTING (reuse)
  media-image.tsx               ← EXISTING (reuse)
```

Optional later: promote thin presentational shell to `@mpa/ui` only if zero media/domain imports remain — **not required for Slice A**.

---

## Composition (binding)

```
Feature screen
  └── <ImageAttachmentButton intent={…} value={…} onChange={…} />
          └── opens <ImagePicker />
                  ├── Capture → getUserMedia / capture input → File
                  └── Device  → file input accept=images → File
          └── hands File to MediaUpload / shared upload hook
                  └── /api/media/intent → signed PUT → confirm → process
          └── preview via <MediaImage />
          └── optional <ImageEditorModal />
```

**Reuse law:**

```
✅ Feature passes MediaUploadIntentConfig only
✅ Feature never opens raw <input type="file"> for images
✅ Feature never calls Storage SDK from React

❌ Duplicate acquisition sheets per module
❌ Vendor-only parallel image UX (migrate in Slice B)
```

---

## Proposed public API (design)

```ts
type ImageAttachmentButtonProps = {
  intent: MediaUploadIntentConfig  // existing API-002A intent shape
  value: string | null             // media_asset_id
  onChange: (mediaAssetId: string | null) => void
  onClear?: () => void
  disabled?: boolean
  /** CTA copy — defaults by context */
  label?: string                   // "Add Image" | "Attach Image" | "Upload Photo"
  /** When false, feature forbids images — component must not render */
  imagesAllowed?: boolean          // default true
}

type ImagePickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFile: (file: File) => void
  /** Prefer environment camera on mobile; user/webcam on desktop */
  captureMode?: "environment" | "user" | "auto"
  accept?: string[]
  title?: string                   // "Add Image"
}
```

`MediaUpload` post-Approve should:

1. Use `ImagePicker` instead of immediately clicking a single hidden input.  
2. Keep intent → upload → confirm → process unchanged.  
3. Preserve Replace / Remove / Retry / progress / editor behavior.

---

## Extensibility slots (architect only — do not implement now)

| Slot | Purpose |
|------|---------|
| `multiple?: boolean` | Already on intent — picker queues files later |
| `onBeforeUpload?: (file) => Promise<File>` | Compression / HEIC normalize hook |
| `tools?: ImageToolId[]` | Future crop/rotate/annotate toolbar beyond current editor |
| `analysis?: "none" \| "queued"` | Future AI image analysis job id |
| `ocr?: boolean` | Future OCR pass |

These props may be typed as optional stubs or omitted until a later approved slice — **no UI for them in Slice A**.

---

## Storage / services reused (no duplicates)

| System | Reuse |
|--------|-------|
| `createUploadIntent` / confirm / process | Yes — `lib/media/server.ts` |
| `/api/media/intent`, `/api/media/[assetId]` | Yes |
| Bucket `media-private` | Yes |
| `MediaKind` constants | Yes |
| `ImageEditorModal` | Yes |
| Vendor `media` bucket ad-hoc upload | **Migrate away** in Slice B — not extended |

---

## Non-goals for the component

- Redesigning Storage paths or RLS  
- Implementing a second MediaService  
- Building a full media library browser (API-002A phased library remains separate)  
- PDF document pickers (non-image) — may share Modal chrome later under a different package

# 04 — Mobile and Desktop Behavior

**Package:** UX-010  
**Status:** Draft — Awaiting Approval

---

## Mobile browsers / PWA

| Action | Behavior |
|--------|----------|
| **Capture Photo** | Prefer `getUserMedia` **or** `<input type="file" accept="image/*" capture="environment">` (rear camera). Facing mode may follow intent (`environment` for field ops; `user` for profile). |
| **Upload From Device** | `<input type="file" accept="image/*">` **without** `capture` — opens gallery / files. |
| Permissions | If camera permission denied → show clear message + keep Upload From Device available. |
| PWA standalone | Same as mobile browser; no native App Store APIs required for Slice A. |

**Must not:** Use a single input with `capture` set for both options (that collapses choice).

---

## Desktop

| Action | Behavior |
|--------|----------|
| **Capture Photo** | Prefer webcam via `getUserMedia` → still capture to image `Blob`/`File`. Show simple shutter UI (preview + Capture / Cancel). |
| Webcam unsupported / denied | Graceful fallback: explain briefly; offer **Upload From Device** as primary recovery (do not dead-end). Optional secondary: open file picker labeled as fallback. |
| **Upload From Device** | Native OS file picker; `accept` = platform image MIME list (JPEG/PNG/WEBP/HEIC per API-002A). |
| Drag & drop | Allowed as accelerator onto the attachment surface **after** empty/ready states — does not replace the dual-option sheet when user taps Add Image. (Drag may skip sheet and go to preview — acceptable accelerator.) |

---

## Fallback matrix

| Condition | Capture | Upload From Device |
|-----------|---------|-------------------|
| Secure context + camera OK | Full capture UI | Full |
| Permission denied | Disabled or error + link to settings copy | Full |
| No mediaDevices API | Hidden or “Not available” + Upload emphasized | Full |
| HEIC from iOS | Accept per API-002A; editor may skip HEIC client crop | Full |
| Multiple files (future) | Same acquisition; queue after | Same |

---

## Security / privacy notes

- Camera streams must stop tracks on dismiss.  
- No silent background capture.  
- Preview object URLs revoked on cancel/unmount (existing MediaUpload pattern).  
- Uploads remain org-scoped via MediaService permissions — unchanged.

---

## Testing expectations (post-Approve)

| Device class | Must verify |
|--------------|-------------|
| iOS Safari PWA | Capture opens camera; Upload opens library |
| Android Chrome | Same |
| Desktop Chrome/Edge | Webcam capture or clean fallback |
| Desktop Safari | Fallback if webcam blocked |
| Keyboard-only desktop | Full sheet operable |

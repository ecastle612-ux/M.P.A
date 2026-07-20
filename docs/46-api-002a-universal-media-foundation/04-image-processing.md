# 04 — Image Processing

**Package:** API-002A  
**Status:** Draft — Ready for Approval  
**Aligns with:** [Performance Standards — Storage](../15-performance-standards/index.md)

---

## Goals

- Accept high-resolution uploads (within size caps).
- Always produce optimized delivery variants.
- Never force UI to download originals for avatars/lists.
- Preserve aspect ratio except where crop intent requires otherwise.
- Prefer modern formats for variants while retaining a faithful original.

---

## Variant ladder

| Variant | Max edge (px) | Typical use | Target format |
|---------|---------------|-------------|---------------|
| `thumb` | 128 | Avatars, dense lists | WEBP (AVIF when pipeline supports) |
| `small` | 320 | Cards, menus | WEBP/AVIF |
| `medium` | 960 | Detail panels | WEBP/AVIF |
| `large` | 1920 | Lightbox / zoom | WEBP/AVIF |
| `original` | as uploaded (capped) | Download, AI, reprocess | Original container or normalized JPEG/PNG/WEBP |

Notes:

- “Full resolution” = `original` object, not an unvalidated infinite upload.
- If original exceeds a safety decode limit (e.g. megapixels), reject or downscale original master before storing (product decision at Approve — recommend reject with friendly message above policy).

---

## Pipeline

```
Upload confirmed
  → validate magic bytes + MIME
  → strip dangerous metadata (minimize EXIF GPS for privacy; keep orientation until normalized)
  → normalize orientation
  → store original
  → enqueue ImageProcessor job
  → generate thumb/small/medium/large
  → write media_asset_variants
  → mark media_assets.status = ready
```

**Processor placement (design choice for Approve):**

| Option | Pros | Cons |
|--------|------|------|
| A. Edge Function / background worker | Scales; keeps Next.js lean | Ops complexity |
| B. Server route after upload | Simple early | Ties web compute to CPU |

**Recommendation:** async worker / Edge Function (A). UI shows “Processing…” until ready; thumb may be generated first for faster perceived completion.

---

## Optimization rules

| Rule | Detail |
|------|--------|
| Aspect ratio | Maintain for non-cropped outputs; letterboxing not preferred — fit max edge |
| Quality | Per-variant quality presets (e.g. thumb 70, large 80) |
| Color | sRGB for web delivery |
| Animation | Animated WEBP/GIF: v1 may flatten to first frame for variants; document if rejected |
| HEIC | Optional: convert to JPEG/WEBP on ingest if library available; else reject with “convert to JPG/PNG/WEBP” |

---

## Delivery & lazy loading

| Rule | Detail |
|------|--------|
| Avatar / list | Request `thumb` or `small` only |
| `loading="lazy"` | Default for below-fold media |
| `srcset` / sizes | MediaImage helper builds srcset from variants |
| Blur placeholder | Optional LQIP from thumb |
| Format negotiation | Serve AVIF/WEBP when supported; fallback JPEG |

Provide a shared **`MediaImage`** display helper (not a second uploader) that:

1. Takes `mediaAssetId` + preferred variant
2. Fetches/caches signed URL
3. Renders optimized `<img>` or `next/image` with remote pattern constraints

---

## Cache strategy

| Layer | Strategy |
|-------|----------|
| Browser | Cache signed response within TTL; re-fetch URL via API when expired |
| CDN | Immutable paths under unique asset id |
| App memory | Short TTL cache of signed URLs per asset+variant |
| Reprocess | New asset id on replace → old URLs naturally expire |

---

## Failure handling

| Failure | UX / system |
|---------|-------------|
| Unsupported codec | Friendly reject before upload completes |
| Decode failure | `status=failed`; retry regenerate; user can re-upload |
| Partial variants | Prefer ready when thumb+small exist; backfill large |
| Timeout | Retry job with backoff; surface “Still processing” |

---

## AI readiness

Store stable `media_asset_id` + `original` path so future AI image analysis jobs can enqueue without re-upload. Do not embed AI processing in v1 upload path beyond optional future hook (`analysis_status` nullable).

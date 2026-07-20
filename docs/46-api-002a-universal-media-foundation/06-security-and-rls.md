# 06 — Security and RLS

**Package:** API-002A  
**Status:** Draft — Ready for Approval  
**Aligns with:** [Security Standards](../14-security-standards/index.md) · [Database Architecture](../09-database-architecture/index.md)

---

## Threat model (summary)

| Threat | Mitigation |
|--------|------------|
| Cross-org read/write | Org RLS on metadata + Storage path policies |
| Unauthorized profile access | User-plane ownership checks |
| Malicious file types | MIME + magic-byte allowlists; no executables |
| Oversized uploads | Hard size caps; rate limits |
| Hotlinking / leaked URLs | Short-lived signed URLs; private buckets |
| Path traversal | Server-generated paths only |
| Stolen browser session upload | Auth required; capability checks; rate limits |
| Malware | Future INT-902 scan hook; quarantine status |

---

## Authorization planes

### User plane

- Owner: `auth.uid() = owner_user_id`
- Profile photo: user can create/replace/delete own assets
- Org staff cannot read another user’s user-plane originals unless a future sharing rule is approved (profile avatars displayed in-org use signed URLs issued only when viewer may see that member)

### Organization plane

- Require active membership
- Capability checks by kind, e.g.:
  - property photos → `property:update` or dedicated `media:write`
  - maintenance photos → work-order participants / `maintenance:update`
  - documents → existing `document:*` capabilities where defined
- Prefer a small set of media capabilities (`media:read`, `media:write`, `media:delete`) mapped per role — exact grant matrix finalized at Approve with Architect

**Invariant:** UI hiding is not security; RLS + MediaService enforce.

---

## Storage RLS

- Bucket `media-private`: no public read
- Policies keyed on path prefix `organization_id` or `users/{user_id}`
- Only service role / MediaService uses privileged operations for signing and processing
- Clients may upload only via signed upload URLs scoped to a pre-created path

---

## Signed URLs

| Parameter | Value |
|-----------|-------|
| Default TTL | 15 minutes |
| Scope | Single object path |
| Issue path | MediaService only (capability checked) |
| Logging | Optional audit sample for sensitive docs |

Do not store permanent signed URLs in `user_profiles` or document rows.

---

## Validation

| Check | When |
|-------|------|
| Auth session | Every MediaService call |
| Intent allowlist MIME | Create upload intent |
| Magic bytes match claimed MIME | Confirm upload |
| Max bytes | Intent + confirm |
| Max pixels (images) | Confirm / process |
| Rate limit | Per user / org (e.g. N uploads/minute) |
| Quota | Org storage usage |

---

## Virus / malware scanning (future — INT-902)

Design hook:

```
status: processing → scanning → ready
                 ↘ quarantine (blocked)
```

- Bytes not readable by end users until `ready` (or allow thumb-only after clear — product choice)
- Scanner provider abstracted (like NotificationProvider)
- Failed scans notify uploader; admins see quarantine queue

v1 may ship without scanner but **must not** paint a corner that prevents inserting the scan step.

---

## Privacy

- Strip GPS EXIF from delivery variants by default
- Retention and delete honor org policy and user account deletion flows
- Audit who uploaded/replaced/deleted

---

## Content Security Policy

- `img-src` may include Storage host for signed URLs
- Prefer same-origin proxy only if CSP/signing requires it — default signed Storage URLs with explicit host allowlist in Next config `remotePatterns` when using `next/image`

---

## Rate limits & abuse

| Control | Suggestion |
|---------|------------|
| Upload intents / minute | Soft 30 / hard 60 per user |
| Concurrent uploads | Cap 3–5 per session |
| Max files per batch | Intent `maxFiles` (e.g. 20) |

---

## Testing requirements (post-Approve)

Mandatory RLS integration tests:

- User A cannot read User B user-plane media
- Org A cannot read Org B paths
- Member without capability cannot write property media
- Signed URL for asset X cannot be used to read asset Y
- Deleted assets are not re-signable for general readers

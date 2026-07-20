# 01 — Implementation Notes

**Package:** UX-001 · EP-004 Approved

## WI-1 Bulk units

- UI default on `/units/new`: Bulk generator; Advanced → existing `UnitForm`
- API: `POST /api/units/bulk` with preview validation server-side
- Generator: start/end (or count), prefix, suffix, floor template (`{floor}{pad}`), shared beds/baths/rent defaults

## WI-2 Avatars

- Remove tenant Avatar URL; use `MediaUpload` + `profilePhotoUploadIntent`
- Shared `EntityAvatarField` for tenants / applicants / vendors where applicable
- Display: media asset → initials fallback

## WI-3 Primary CTA

- Guided surfaces: one primary (Continue / Start Move In)
- New Lease (advanced) → More Actions / ghost secondary only

## WI-4 Push enrollment

- States: idle | loading | permission | enroll | enabled | denied | failed | timeout
- Timeout wrapper on `registerDeviceWithServer` (e.g. 20s)
- Hide banner immediately on success; respect `hasActiveDevice` + suppression

## WI-5 / WI-6

- Visible labels on PM forms; tighten mobile page padding / stack gaps in Canopy tokens

## WI-7 AI Ops mobile

- Viewport-height workspace; sticky composer; prompt library accessible without scrolling away from chat

## WI-8 Announcements

- Upload attachment via MediaUpload; label selectors
- Architecture: [02-announcement-architecture.md](./02-announcement-architecture.md)

## WI-9 Master Admin Slice A

- Capability `master_admin` in `FOUNDATION_CAPABILITIES` + migration
- Routes `/master-admin/*` gated by capability
- No impersonation / audit

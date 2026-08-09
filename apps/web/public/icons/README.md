# M.P.A. PWA / favicon assets

Install / splash / favicon icons use **only** the approved default brand logo
(`/public/branding/logo-dark.png`) on the light manifest background (`#F3F4F6`).

Canonical filenames:

- `mpa-mark-{16,32,48,64,128,192,256,512}.png`
- `mpa-favicon-{16,32}.png`
- `mpa-apple-touch.png` (180×180)

Compatibility aliases (`icon-192.png`, `icon-512.png`, `favicon-*.png`,
`apple-touch-icon.png`) mirror the same artwork so older references do not 404.

Do **not** derive install icons from `logo-light.png` (dark-surface UI variant).

Artwork padding is intentionally tighter than the source lockup canvas so the
house mark reads ~20% larger on home-screen icons without redesigning the logo.

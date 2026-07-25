# M.P.A. PWA / favicon assets

Homescreen / desktop / favicon icons use the **regular** brand logo
(`/public/branding/logo-dark.png` — dark mark for light surfaces) on the
manifest light background (`#F3F4F6`). Do **not** derive install icons from
`logo-light.png` (dark-mode / dark-surface variant).

PNG sizes for browsers and PWA manifest: 16, 32, 48, 64, 128, 192, 256, 512,
plus `apple-touch-icon.png` (180) and favicon-16/32.

UI surfaces must use the centralized adaptive React `<BrandLogo />` component.

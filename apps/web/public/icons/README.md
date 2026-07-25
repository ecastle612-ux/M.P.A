# M.P.A. PWA / favicon assets

Install / splash / favicon icons use **only** the default brand logo
(`/public/branding/logo-dark.png`) on the light manifest background (`#F3F4F6`).

Filenames use the `mpa-mark-*` / `mpa-favicon-*` / `mpa-apple-touch` prefix so
legacy black `/icons/icon-*.png` URLs cannot keep serving a retired asset from
CDN or device caches.

Do **not** derive install icons from `logo-light.png` (dark-mode UI variant).

Sizes: 16, 32, 48, 64, 128, 192, 256, 512 (+ apple-touch 180, favicon 16/32).

UI surfaces must use `<BrandLogo />`, never these install icons as product logos.

# 02 — Visual System (Canopy Email)

**Package:** EML-001  
**Aligns with:** `docs/06-design-language` (Canopy) · app tokens in `globals.css`

Email clients do not support CSS variables. Tokens are **compiled to inline hex** at render time.

---

## Brand tokens (compiled)

| Token | Value | Usage |
| --- | --- | --- |
| `brand.primary` | `#0F6B56` | CTA background, header accent bar |
| `brand.primaryHover` | `#0C5A48` | (documented; limited client support) |
| `brand.accent` | `#1FA87A` | Bullet / success accents |
| `ink.primary` | `#1A2420` | Body text |
| `ink.secondary` | `#5C6B66` | Meta / footer |
| `ink.inverse` | `#FFFFFF` | Text on primary CTA / dark header |
| `surface.page` | `#F4F7F6` | Outer background |
| `surface.card` | `#FFFFFF` | Content card |
| `border.subtle` | `#D8E2DE` | Card border |
| `header.bg` | `#0F1419` → `#152019` | Dark branded header (matches AuthBrandShell atmosphere) |

---

## Layout anatomy (all templates)

```
┌─────────────────────────────────────────┐
│  OUTER (surface.page, 24px pad)         │
│  ┌───────────────────────────────────┐  │
│  │ HEADER (dark)  UX-007 logo token   │  │
│  │            M.P.A. wordmark text   │  │
│  ├───────────────────────────────────┤  │
│  │ BODY (surface.card)               │  │
│  │  Eyebrow (optional)               │  │
│  │  Title (H1)                       │  │
│  │  Greeting                         │  │
│  │  Body paragraphs                  │  │
│  │  [ Primary CTA button ]           │  │
│  │  Secondary text link (optional)   │  │
│  ├───────────────────────────────────┤  │
│  │ FOOTER                            │  │
│  │  My Property Assistant            │  │
│  │  support@my-property-assistant.com│  │
│  │  Preference / security note       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Rules

- **Max content width:** 560px
- **Logo:** absolute HTTPS URL `${NEXT_PUBLIC_APP_URL}/branding/logo-light.png` for the dark email header (ADR-019 / UX-007) — use the shared `email` logo size token; `alt="M.P.A. My Property Assistant"`
- **CTA:** single primary button; 14px padding × 20px; border-radius 6px; no “pill cluster”
- **No** templateKey in customer-visible footer
- **Tables** for structure (Outlook); progressive enhancement for modern clients
- **`meta name="color-scheme" content="light dark"`** + limited `@media (prefers-color-scheme: dark)` overrides

---

## Typography (web-safe stack)

```
font-family: "IBM Plex Sans", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

| Role | Size | Weight |
| --- | --- | --- |
| Title | 22–24px | 600 |
| Body | 15–16px | 400 |
| Meta / footer | 12–13px | 400 |
| Eyebrow | 11–12px | 600 · uppercase · tracking |

---

## Accessibility

- Meaningful `alt` on logo
- CTA is an `<a>` with sufficient contrast (primary on white / white on primary)
- Link URLs repeated in plain text
- No information only in color
- `lang="en"` on root

---

## Plain text fallback

Every render returns `text` with:

1. Title / subject line echo  
2. Greeting  
3. Body  
4. CTA URL on its own line  
5. Support line: `support@my-property-assistant.com`  
6. Product signature: `My Property Assistant (M.P.A.)`

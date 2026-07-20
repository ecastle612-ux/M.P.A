# 01 — Deployment Runbook

**Package:** PR-002  
**Project:** `m-p-a-web` (Vercel team `ecastle612-uxs-projects`)  
**Canonical host:** `https://www.my-property-assistant.com`

---

## Cloudflare DNS (required — current blocker)

Domain registrar is Cloudflare. Nameservers (keep as-is):

- `nile.ns.cloudflare.com`
- `blakely.ns.cloudflare.com`

Vercel Domains UI currently recommends **A records** (2026-07-19). In Cloudflare → DNS → Records, add with **Proxy status = DNS only (grey cloud)**:

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| A | `www` | `76.76.21.21` | DNS only |
| A | `@` | `76.76.21.21` | DNS only |

Optional alternative: change nameservers to `ns1.vercel-dns.com` / `ns2.vercel-dns.com` (not required if A records are correct).

After records propagate, Vercel issues SSL automatically. Verify:

```bash
curl -sI https://www.my-property-assistant.com/login | head -20
curl -sI https://my-property-assistant.com/login | head -20   # expect 308/301 → www
```

## Vercel

```bash
pnpm dlx vercel@latest link --yes --project m-p-a-web
pnpm dlx vercel@latest deploy --prod --yes
```

Project settings:

- Framework: Next.js  
- Install: `pnpm install`  
- Build: `pnpm --filter @mpa/web build`  
- Output: `apps/web/.next`  
- Redirect: apex → www (`vercel.json`)

## Supabase Auth allow-list

Production project redirect URLs must include:

- `https://www.my-property-assistant.com/**`
- `https://www.my-property-assistant.com/login`
- `https://www.my-property-assistant.com/reset-password`
- `https://www.my-property-assistant.com/accept-invitation/**`

## OneSignal

Set Site URL / allowed origin to `https://www.my-property-assistant.com`.

## Webhooks (prod host)

| Provider | Path pattern |
| --- | --- |
| Stripe | `/api/webhooks/payments/stripe` |
| Dropbox Sign | `/api/webhooks/signature/dropbox_sign` |
| Checkr | `/api/webhooks/screening/checkr` |
| OneSignal | Dashboard origin + SW under site root |

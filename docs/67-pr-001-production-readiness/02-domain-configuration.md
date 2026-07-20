# 02 — Domain Configuration

**Package:** PR-001  
**Canonical host:** `www.my-property-assistant.com`

---

## DNS (operator steps)

1. In the domain registrar, point:
   - `www` → Vercel (`cname.vercel-dns.com` or project-specific CNAME)
   - Apex `@` → Vercel A records (or ALIAS/ANAME if supported)
2. In Vercel → Project → Domains:
   - Add `www.my-property-assistant.com` (primary)
   - Add `my-property-assistant.com` → redirect to `www`
3. Confirm Vercel issues SSL (Let’s Encrypt) for both hosts.
4. Set Production env:
   - `NEXT_PUBLIC_APP_URL=https://www.my-property-assistant.com`
   - `NEXT_PUBLIC_MPA_ENV=production`

## Redirects (repo)

`vercel.json` permanently redirects apex → `www`.

## Canonical URLs

- App `metadataBase` = `NEXT_PUBLIC_APP_URL`
- Prefer `www` in all provider dashboards (Stripe, OneSignal, Supabase Auth redirect URLs)

## Supabase Auth redirect allow-list

Add:

- `https://www.my-property-assistant.com/**`
- `https://www.my-property-assistant.com/login`
- `https://www.my-property-assistant.com/reset-password`
- `https://www.my-property-assistant.com/accept-invitation/**`

Remove localhost entries from the **production** Supabase project (keep them only on the dev project).

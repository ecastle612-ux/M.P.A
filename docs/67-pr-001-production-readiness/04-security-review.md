# 04 — Security Review

**Package:** PR-001  
**Status:** Approved (EP-006)

---

## Checklist

| Control | Status | Notes |
| --- | --- | --- |
| HTTPS / SSL | Operator (Vercel) | Domain must show valid cert on www + apex redirect |
| HSTS | Shipped | `Strict-Transport-Security` on all routes (prod headers) |
| CSP | Shipped | `next.config.ts` — OneSignal CDN allow-listed |
| X-Frame-Options / frame-ancestors | Shipped | DENY / `none` |
| Referrer-Policy | Shipped | `strict-origin-when-cross-origin` |
| Cookie / session | Supabase SSR | Secure cookies in production (`NODE_ENV=production`) |
| Auth middleware coverage | Hardened | Settings, facility, applicants, residents, migration, setup, accounting protected |
| Authorization / roles | Existing | Capability matrix unchanged |
| Secrets in repo | Guarded | `.env.example` placeholders only; no production keys |
| Rate limiting | Gap | No global API rate limiter yet — remaining blocker |
| Exposed credentials scan | Process | Never commit `.env.local`; rotate if leaked |

## Explicit non-changes

- No RLS redesign
- No auth provider change
- No capability matrix rewrite

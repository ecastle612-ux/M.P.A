# Domain health scorecard

## M.P.A. PRODUCTION DOMAIN HEALTH

Root domain:  
my-property-assistant.com  
Status:  
**PASS**

WWW domain:  
www.my-property-assistant.com  
Status:  
**PASS**

WWW → Root redirect:  
**FAIL** (neither host redirects; both serve Production independently)

DNS:  
**PASS** (apex + www A → `76.76.21.21` via Cloudflare NS; multi-resolver consistent)

Vercel domain configuration:  
**PASS** for availability (both hosts serve `dpl_H1i7NSFgBXKsyyMos7YBsUnTURbg`) · **PARTIAL** for canonical redirect (cannot mutate Domains panel from this environment — Vercel MCP unauthenticated)

SSL:  
**PASS** (separate LE certs per hostname; OpenSSL verify return code 0; no warnings)

Production deployment:  
`f72ea4aac6db18164c0bc685506f397d3775c196` (`dpl_H1i7NSFgBXKsyyMos7YBsUnTURbg`)

Root cause:  
Original www unavailability **not reproducible** at investigation time. Live state shows www healthy and aligned with apex/Production. Likely transient edge/client/session factor. Residual: missing single-canonical redirect.

Fix:  
No live fix required for availability. Optional Owner follow-up in Vercel Domains: primary = apex; www redirect → `https://my-property-assistant.com`.

Application code changed:  
**NO**

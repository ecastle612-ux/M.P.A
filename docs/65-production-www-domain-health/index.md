# 65 — Production WWW Domain Health

**Date:** 2026-08-10  
**Scope:** Diagnose and safely resolve reported unavailability of `https://www.my-property-assistant.com` while apex continued to serve Production.  
**Constraint:** No application code changes. No v2.0.2. No pricing/Stripe/RentRedi/roadmap changes.

## Verdict

**PRODUCTION WWW DOMAIN RESTORED** (observed from investigation environment).

Both apex and www currently reach the same Production deployment and serve identical public HTML. No DNS failure, TLS failure, Vercel 404, or project-not-found response was observed at investigation time.

Residual gap: **no www ↔ apex canonical redirect** (both hosts serve content independently). Availability is restored; host canonicalization remains a recommended Vercel Domains follow-up (requires dashboard access).

## Production deployment

| Field | Value |
|-------|-------|
| Production SHA | `f72ea4aac6db18164c0bc685506f397d3775c196` |
| Vercel deployment id (HTML marker) | `dpl_H1i7NSFgBXKsyyMos7YBsUnTURbg` |
| GitHub Production deployment | `5825388803` (success) |
| Serving project (known) | `m-p-a-web` |

Both hosts embed the same `dpl_H1i7NSFgBXKsyyMos7YBsUnTURbg` marker. Homepage bodies are byte-identical (`sha256` prefix `b9b8090c0c7be3ab`).

## Observed HTTP / DNS / TLS

### Root — `my-property-assistant.com`

| Check | Result |
|-------|--------|
| `GET /` | HTTP 200 — marketing landing |
| `GET /login` | HTTP 200 |
| `GET /pricing` | HTTP 200 |
| `GET /admin` (unauth) | HTTP 307 → `/login` |
| `GET /pm/mission-control` (unauth) | HTTP 307 → `/login` |
| `GET /facility/mission-control` (unauth) | HTTP 307 → `/login` |
| `http://` → `https://` | HTTP 308 |
| DNS A (1.1.1.1 / 8.8.8.8 / 9.9.9.9) | `76.76.21.21` |
| DNS AAAA | none observed |
| TLS | Let's Encrypt; CN=`my-property-assistant.com`; verify return code 0 |
| Server | Vercel |

### WWW — `www.my-property-assistant.com`

| Check | Result |
|-------|--------|
| `GET /` | HTTP 200 — marketing landing (fresh private browser + curl) |
| `GET /login` | HTTP 200 |
| `GET /pricing` | HTTP 200 |
| `GET /admin` (unauth) | HTTP 307 → `/login` |
| Protected PM/FO routes (unauth) | HTTP 307 → `/login` |
| `http://` → `https://` | HTTP 308 |
| DNS A (multi-resolver) | `76.76.21.21` |
| DNS CNAME | none observed (A to Vercel IP) |
| DNS AAAA | none observed |
| TLS | Let's Encrypt; CN=`www.my-property-assistant.com`; verify return code 0 |
| Server | Vercel |
| Error markers | No `DEPLOYMENT_NOT_FOUND` / project-not-found / disabled deployment |

### Nameservers

- `blakely.ns.cloudflare.com`
- `nile.ns.cloudflare.com`

DNS is Cloudflare-hosted; records resolve to Vercel anycast `76.76.21.21` for both apex and www.

## Canonical redirect

| Direction | Status |
|-----------|--------|
| www → root | **Not configured** (www returns 200, does not redirect) |
| root → www | **Not configured** (apex returns 200, does not redirect) |

Per incident requirements, only one host should be canonical. Recommended (Owner’s first expected pattern):

1. In Vercel project **Domains** for `m-p-a-web`, set **`my-property-assistant.com`** as the primary / production domain.
2. Configure **`www.my-property-assistant.com`** as a **redirect** to `https://my-property-assistant.com` (308/301).

This agent could **not** apply that change: Vercel MCP requires desktop authentication (`needsAuth`), and no `VERCEL_TOKEN` / Cloudflare write credentials are available in this environment.

## Root cause assessment

| Hypothesis | Finding |
|------------|---------|
| www DNS broken / wrong target | **Not observed now** — www A → `76.76.21.21` consistently |
| www SSL broken | **Not observed** — verify OK |
| www attached to wrong/old deployment | **Not observed** — same `dpl_H1i7NSFgBXKsyyMos7YBsUnTURbg` as apex |
| Application routing bug on www | **Not observed** for anonymous traffic; landing HTML matches apex |
| Transient edge / client cache / prior session | **Plausible** for the original report; an earlier non-private browser session showed login chrome on www `/` until cookies were cleared, after which marketing landing loaded |
| Missing canonical redirect | **Confirmed residual** — not an availability outage, but does not meet “only one canonical” preference |

**Exact cause of the original “unavailable” report could not be reproduced at investigation time.** Current live state: both hosts available and on current Production.

## Fix applied from this environment

**None.** No DNS write, no Vercel domain mutation, no application code change — none were required to restore availability from this vantage point, and write access to Vercel/Cloudflare was unavailable.

## Recommended Owner action (canonicalization only)

If Owner wants www → apex redirect:

| Item | Value |
|------|-------|
| Where | Vercel → project `m-p-a-web` → **Domains** |
| DNS record to change | **None required for current availability** (both already point at Vercel `76.76.21.21`) |
| Vercel change | Set apex primary; set `www` redirect → `https://my-property-assistant.com` |
| Current value | Both domains serve Production independently (no cross-host redirect) |
| Required value | www 308/301 → apex (or inverse, if www is chosen canonical) |

Do **not** invent alternate DNS targets. Use only the targets shown in the Vercel Domains panel for this project.

## Application code changed

**NO**

## Stop conditions honored

- No v2.0.2
- No pricing / Stripe / $40 reduction
- No RentRedi
- No roadmap changes
- Owner LIVE acceptance not resumed in this task

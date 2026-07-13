# 15 — Performance Standards

## Performance Philosophy

Property managers process hundreds of items daily on desktop. Sluggish software is abandoned regardless of features. Performance is a UX requirement (07), not an optimization pass before launch.

---

## Targets

### Web Vitals (PM Portal — Desktop)

| Metric | Target |
|--------|--------|
| Largest Contentful Paint (LCP) | < 2.0s |
| Interaction to Next Paint (INP) | < 200ms |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Time to First Byte (TTFB) | < 600ms |

### Application-Specific

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Operations queue load | < 1s perceived | Skeleton → data |
| List view (100 items) | < 500ms server | DB query time |
| Detail panel open | < 300ms | Client navigation |
| Search results (⌘K) | < 500ms | End-to-end |
| Edge Function mutation | < 2s p95 | Function execution |
| Owner report generation | < 30s | Background job |
| AI draft generation | < 10s | With streaming indicator |

### Database

| Query Type | Target |
|------------|--------|
| Single record fetch | < 50ms |
| Paginated list (20 items) | < 100ms |
| Aggregated report query | < 2s (or materialized view < 500ms) |
| Vector similarity search | < 500ms |

---

## Frontend Performance

### Rendering

| Technique | Application |
|-----------|-------------|
| Server Components | Default for data-fetching views |
| Streaming SSR | Dashboard with Suspense boundaries |
| Virtualized lists | All tables > 50 rows (`DataTable` pattern) |
| Image optimization | Next.js Image for property photos |
| Code splitting | Dynamic imports for heavy workflow modules |
| Optimistic updates | Safe mutations (status changes, assignments pre-acceptance) |

### Caching

| Layer | Strategy |
|-------|----------|
| TanStack Query | `staleTime` per entity type; aggressive for static, short for queues |
| Next.js | ISR for marketing pages; no cache for authenticated views |
| CDN | Static assets via Vercel Edge |
| DB | Materialized views for reports; refresh on event |

### Bundle Size

| Rule | Limit |
|------|-------|
| Initial JS (PM portal) | < 200KB gzipped |
| Per-route chunk | < 100KB gzipped |
| No client-side Supabase service role | Ever |
| OpenAI SDK | Edge Functions only — zero client bundle |

---

## Backend Performance

### Database

| Technique | Application |
|-----------|-------------|
| Composite indexes | `(organization_id, status, created_at DESC)` on all list tables |
| Partial indexes | `WHERE deleted_at IS NULL` on soft-deleted tables |
| Connection pooling | Supavisor in production |
| Query analysis | `EXPLAIN ANALYZE` on critical queries before scale milestones |
| Pagination | Cursor-based for large lists; offset for small |

### Edge Functions

| Technique | Application |
|-----------|-------------|
| Cold start mitigation | Keep functions lean; shared imports in `_shared/` |
| Timeout awareness | 60s limit; long operations (report gen) are async events |
| Batch processing | AI operations and report generation via event consumers |
| Idempotency | Prevent duplicate processing on retries |

### Realtime

| Rule | Detail |
|------|--------|
| Scoped channels | Per org, per lease, per vendor — never global |
| Throttle UI updates | Debounce rapid status changes in lists |
| Fallback | Polling for critical statuses if Realtime disconnects |

---

## Storage Performance

| Rule | Detail |
|------|--------|
| Image transforms | Supabase Storage transforms for thumbnails |
| Lazy loading | Property photos below fold |
| Upload chunking | Large documents (> 5MB) via chunked upload |
| CDN | Storage CDN enabled in production |

---

## AI Performance

| Capability | Strategy |
|------------|----------|
| Draft generation | Stream tokens to UI where possible |
| Classification | Use gpt-4o-mini for speed; gpt-4o for quality drafts |
| Embeddings | Batch generation on document upload (async) |
| Search | pgvector HNSW index; pre-filter by org before similarity |
| Token budgets | Per-org limits prevent runaway costs and latency |

---

## Monitoring

| Tool | Purpose |
|------|---------|
| Vercel Analytics | Web Vitals |
| Sentry | Error tracking, performance traces |
| Supabase Dashboard | Query performance, connection pool |
| Custom metrics | Edge Function duration, AI token usage, queue depth |

### Alerts

| Condition | Action |
|-----------|--------|
| p95 Edge Function > 5s | Investigate |
| Error rate > 1% | Page on-call |
| DB connection pool > 80% | Scale review |
| AI token usage > org budget | Throttle + notify |

---

## Load Testing Milestones

| Milestone | Test Scenario |
|-----------|---------------|
| Foundation complete | 50 concurrent users, basic CRUD |
| Maintenance workflow | 200 work orders/hour creation + assignment |
| Rent collection | 1000 concurrent payment webhooks |
| Owner reports | 100 simultaneous report generations |
| Marketplace | 500 vendor search queries/minute |

---

## Related Documents

- **07** UX Principles — speed expectations
- **08** Software Architecture — caching, events
- **09** Database Architecture — indexes, materialized views
- **16** Testing Standards — performance test requirements

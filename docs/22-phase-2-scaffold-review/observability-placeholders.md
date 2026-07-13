# Observability Placeholders (Phase 2.1)

No external service integrations are implemented in this phase. This document defines the architecture contracts to avoid retrofitting cost in later phases.

## Logging

- **Interface:** `logger.info|warn|error(event, context)`
- **Shape:** JSON-first logs with `timestamp`, `level`, `request_id`, `actor_id`, `role`, `route`, `message`
- **Storage target (future):** centralized log sink (provider TBD)
- **Rule:** No PII/secrets in logs

## Analytics

- **Interface:** `track(eventName, properties)`
- **Scope now:** placeholder event taxonomy only
- **Initial event groups:**
  - Auth events (`login_success`, `login_failure`, `logout`)
  - Navigation events (`command_palette_opened`, `role_switched`)
  - Shell health (`dashboard_shell_loaded`)
- **Rule:** no business metrics in Phase 2.1

## Error Monitoring

- **Interface:** `captureException(error, metadata)`
- **Metadata required:** role, route, release, browser, request_id
- **Behavior:** non-blocking and fail-open
- **PII policy:** scrub email, phone, payment references

## Performance Monitoring

- **Interface:** `recordWebVital(metricName, value, context)`
- **Metrics:** LCP, CLS, INP, TTFB
- **Route tags:** `/login`, `/dashboard`, shell interactions
- **Budget hooks:** define thresholds in CI once tooling is integrated

## Audit Logging

- **Purpose:** compliance-grade record of sensitive mutations
- **Scope in Phase 2.1:** architecture only, no business table writes
- **Required fields (future):**
  - `audit_id`, `timestamp`, `actor_id`, `actor_role`
  - `action`, `resource_type`, `resource_id`
  - `before`, `after`, `request_id`, `ip_hash`
- **Rule:** append-only store, immutable once written

## Rollout Sequence (Later Phases)

1. Add shared observability package with typed interfaces.
2. Implement no-op adapters in local/dev.
3. Integrate provider adapters in staging.
4. Add alerting thresholds before production.

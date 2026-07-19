export type LogLevel = "info" | "warn" | "error";

export type Severity = "debug" | "info" | "warning" | "error" | "critical";

export type RuntimeEnvironment = "development" | "test" | "production";

export type LogContext = {
  requestId?: string;
  actorId?: string;
  actorRole?: string;
  route?: string;
  [key: string]: string | number | boolean | null | undefined;
};

export type AnalyticsPayload = {
  eventName: string;
  properties?: Record<string, string | number | boolean | null>;
};

export type PerformanceMetric = {
  name: "LCP" | "CLS" | "INP" | "TTFB" | string;
  value: number;
  route?: string;
};

/**
 * Standard metadata accepted by {@link captureException}. Known fields shape the error
 * envelope; additional string/number/boolean keys are attached (and string values are
 * PII-redacted) as extra context.
 */
export type CaptureMetadata = {
  module?: string;
  requestId?: string;
  organizationId?: string;
  actorId?: string;
  actorRole?: string;
  severity?: Severity;
  [key: string]: string | number | boolean | null | undefined;
};

/**
 * Compliance-grade, append-only audit event. Emitted through the observability sink;
 * a durable append-only store is a documented (Deferred) adapter, not implemented here.
 */
export type AuditEvent = {
  action: string;
  resourceType: string;
  resourceId?: string;
  actorId?: string;
  actorRole?: string;
  organizationId?: string;
  requestId?: string;
  ipHash?: string;
  severity?: Severity;
  metadata?: Record<string, string | number | boolean | null>;
};

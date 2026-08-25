export type LogLevel = "info" | "warn" | "error";

export type ErrorSeverity = "debug" | "info" | "warning" | "error" | "critical";

export type LogContext = {
  requestId?: string;
  organizationId?: string;
  actorId?: string;
  actorRole?: string;
  route?: string;
  severity?: ErrorSeverity;
  source?: "server" | "client" | "edge" | "job";
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

export type CaptureExceptionOptions = {
  severity?: ErrorSeverity;
  requestId?: string;
  organizationId?: string;
  actorId?: string;
  actorRole?: string;
  route?: string;
  source?: "server" | "client" | "edge" | "job";
  persistDurable?: boolean;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

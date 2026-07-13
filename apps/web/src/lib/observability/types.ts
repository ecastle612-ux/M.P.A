export type LogLevel = "info" | "warn" | "error";

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

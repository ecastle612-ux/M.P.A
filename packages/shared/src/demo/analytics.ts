export const DEMO_ANALYTICS_EVENTS = {
  demo_started: "demo.started",
  role_switched: "demo.role_switched",
  module_visited: "demo.module_visited",
  time_heartbeat: "demo.time_heartbeat",
  cta_clicked: "demo.cta_clicked",
  convert_to_subscription: "demo.convert_to_subscription",
  reset: "demo.reset",
  session_expired: "demo.session_expired"
} as const;

export type DemoAnalyticsEvent =
  (typeof DEMO_ANALYTICS_EVENTS)[keyof typeof DEMO_ANALYTICS_EVENTS];

export type DemoAnalyticsPayload = {
  event: DemoAnalyticsEvent;
  sessionId?: string;
  product?: string;
  persona?: string;
  moduleId?: string;
  cta?: string;
  secondsInSession?: number;
  at: string;
};

export function createDemoAnalyticsEvent(
  event: DemoAnalyticsEvent,
  fields: Omit<DemoAnalyticsPayload, "event" | "at"> = {}
): DemoAnalyticsPayload {
  return {
    event,
    ...fields,
    at: new Date().toISOString()
  };
}

import type { AnalyticsPayload } from "./types";
import { log } from "./logger";

export function trackEvent(payload: AnalyticsPayload): void {
  log("info", "analytics_event", {
    eventName: payload.eventName,
    ...payload.properties
  });
}

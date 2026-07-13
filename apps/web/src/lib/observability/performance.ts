import type { PerformanceMetric } from "./types";
import { log } from "./logger";

export function recordPerformanceMetric(metric: PerformanceMetric): void {
  const context = {
    metricName: metric.name,
    metricValue: metric.value
  } as const;

  log("info", "performance_metric", {
    ...context,
    ...(metric.route ? { route: metric.route } : {})
  });
}

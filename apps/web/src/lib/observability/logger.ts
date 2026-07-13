import type { LogContext, LogLevel } from "./types";

/**
 * Foundation placeholder logger. Replace transport in a later phase.
 */
export function log(level: LogLevel, message: string, context: LogContext = {}): void {
  // Intentionally minimal; avoids vendor lock-in during foundation stage.
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };
  if (level === "error") {
    console.error(payload);
    return;
  }
  if (level === "warn") {
    console.warn(payload);
    return;
  }
  console.info(payload);
}

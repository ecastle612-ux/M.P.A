import { scrubMetadata } from "./scrub";
import type { LogContext, LogLevel } from "./types";

/**
 * Structured production logger. Always console-safe; never throws.
 */
export function log(level: LogLevel, message: string, context: LogContext = {}): void {
  const safeContext = scrubMetadata(context as Record<string, string | number | boolean | null | undefined>);
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message: typeof message === "string" ? message.slice(0, 2000) : "log",
    ...safeContext
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

import { log } from "./logger";

export function captureException(error: unknown, metadata: Record<string, string> = {}): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  log("error", message, metadata);
}

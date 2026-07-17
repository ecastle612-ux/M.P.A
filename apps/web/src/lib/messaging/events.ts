import type { ThreadStatus } from "./contracts";

export function assertThreadMessageable(status: ThreadStatus): void {
  if (status === "archived" || status === "resolved") {
    throw new Error("This conversation is closed. Reopen the workflow before sending a new message.");
  }
}

export function nextThreadStatusAfterMessage(currentStatus: ThreadStatus): ThreadStatus {
  if (currentStatus === "archived" || currentStatus === "resolved") {
    return currentStatus;
  }
  return "unread";
}

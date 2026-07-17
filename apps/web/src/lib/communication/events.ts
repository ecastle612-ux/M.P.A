import type { AnnouncementStatus } from "./contracts";

export function assertAnnouncementPublishable(status: AnnouncementStatus): void {
  if (status !== "draft" && status !== "scheduled") {
    throw new Error("Only draft or scheduled announcements can be published.");
  }
}

export function assertAnnouncementEditable(status: AnnouncementStatus): void {
  if (status === "archived") {
    throw new Error("Archived announcements cannot be edited.");
  }
}

"use client";

import { Button, Modal } from "@mpa/ui";

type LeaveAppConfirmProps = {
  open: boolean;
  onClose: () => void;
  href: string;
  title?: string;
  description?: string;
};

/**
 * Pattern D — confirm before leaving the installed / standalone session for external providers.
 */
export function LeaveAppConfirm({
  open,
  onClose,
  href,
  title = "Leave My Property Assistant?",
  description = "You’ll open an external page in this tab. When you’re done, return here to continue.",
}: LeaveAppConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Stay here
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              onClose();
              window.location.assign(href);
            }}
          >
            Continue
          </Button>
        </div>
      }
    >
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      <p className="mt-2 break-all text-xs text-[var(--mpa-color-text-muted)]">{href}</p>
    </Modal>
  );
}

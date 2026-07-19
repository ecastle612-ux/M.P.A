"use client";

import { Button, Modal } from "@mpa/ui";

export type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  consequence: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

/**
 * UX-003 confirmation standard — explain consequence, support cancel.
 */
export function ConfirmActionDialog({
  open,
  title,
  consequence,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel
}: ConfirmActionDialogProps) {
  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onCancel();
      }}
      title={title}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">{consequence}</p>
    </Modal>
  );
}

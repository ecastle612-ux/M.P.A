"use client";

import type { ReactNode } from "react";
import { Button, Modal } from "@mpa/ui";

export function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Keep as-is",
  busy = false,
  danger = true
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      className="max-w-md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={danger ? "danger" : "primary"}
            disabled={busy}
            aria-busy={busy}
            onClick={onConfirm}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  );
}

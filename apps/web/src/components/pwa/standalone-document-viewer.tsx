"use client";

import { Button, Modal } from "@mpa/ui";
import { useEffect, useState } from "react";

import {
  fetchHrefAsObjectUrl,
  guessKindFromContentType,
  type StandaloneOpenKind,
  triggerSameWindowDownload,
} from "@/lib/pwa/standalone-open";

type StandaloneDocumentViewerProps = {
  open: boolean;
  onClose: () => void;
  href: string;
  title?: string;
};

export function StandaloneDocumentViewer({ open, onClose, href, title }: StandaloneDocumentViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [kind, setKind] = useState<StandaloneOpenKind>("document");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !href) return;
    let revoked: string | null = null;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setObjectUrl(null);

    void (async () => {
      try {
        const result = await fetchHrefAsObjectUrl(href);
        if (cancelled) {
          URL.revokeObjectURL(result.objectUrl);
          return;
        }
        revoked = result.objectUrl;
        setObjectUrl(result.objectUrl);
        setKind(guessKindFromContentType(result.contentType, href));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not open this file in the app.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [open, href]);

  const handleClose = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title ?? "Document"}
      className="max-w-4xl"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          {objectUrl ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => triggerSameWindowDownload(objectUrl, title ?? "document")}
            >
              Download
            </Button>
          ) : null}
          <Button type="button" variant="primary" onClick={handleClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="min-h-[50vh]">
        {loading ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading…</p>
        ) : null}
        {error ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              You can download the file instead, or open it in this tab if needed.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  window.location.assign(href);
                }}
              >
                Open in this tab
              </Button>
            </div>
          </div>
        ) : null}
        {!loading && !error && objectUrl && kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob preview
          <img src={objectUrl} alt={title ?? "Preview"} className="mx-auto max-h-[70vh] w-auto max-w-full object-contain" />
        ) : null}
        {!loading && !error && objectUrl && kind !== "image" ? (
          <iframe
            title={title ?? "Document preview"}
            src={objectUrl}
            className="h-[70vh] w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white"
          />
        ) : null}
      </div>
    </Modal>
  );
}

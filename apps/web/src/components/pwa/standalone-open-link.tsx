"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";

import { LeaveAppConfirm } from "./leave-app-confirm";
import { StandaloneDocumentViewer } from "./standalone-document-viewer";
import { classifyStandaloneHref, isAppOriginHref } from "../../lib/pwa/standalone-open";

type StandaloneOpenLinkProps = Omit<ComponentPropsWithoutRef<"button">, "onClick" | "type"> & {
  href: string;
  children: ReactNode;
  /** Prefer in-app viewer for docs/media; confirm before leaving for other external URLs. */
  mode?: "auto" | "viewer" | "leave-confirm" | "same-tab" | undefined;
  documentTitle?: string | undefined;
  leaveTitle?: string | undefined;
  leaveDescription?: string | undefined;
  /** When true, clone a single child element and attach the open handler (avoid nested buttons). */
  asChild?: boolean | undefined;
};

/**
 * Drop-in replacement for `target="_blank"` / `window.open` document links (PMX-004 Phase 4).
 */
export function StandaloneOpenLink({
  href,
  children,
  mode = "auto",
  documentTitle,
  leaveTitle,
  leaveDescription,
  className,
  disabled,
  asChild = false,
  ...rest
}: StandaloneOpenLinkProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const resolvedMode = (() => {
    if (mode !== "auto") return mode;
    const kind = classifyStandaloneHref(href);
    if (kind === "pdf" || kind === "image" || kind === "document") return "viewer";
    if (!isAppOriginHref(href)) return "leave-confirm";
    return "same-tab";
  })();

  const open = () => {
    if (!href || disabled) return;
    if (resolvedMode === "viewer") {
      setViewerOpen(true);
      return;
    }
    if (resolvedMode === "leave-confirm") {
      setLeaveOpen(true);
      return;
    }
    window.location.assign(href);
  };

  let trigger: ReactNode;
  if (asChild && isValidElement(children)) {
    const child = Children.only(children) as ReactElement<{
      onClick?: (event: MouseEvent) => void;
      disabled?: boolean;
    }>;
    trigger = cloneElement(child, {
      disabled: disabled || child.props.disabled || !href,
      onClick: (event: MouseEvent) => {
        child.props.onClick?.(event);
        if (!event.defaultPrevented) open();
      },
    });
  } else {
    trigger = (
      <button
        type="button"
        className={className}
        disabled={disabled || !href}
        onClick={open}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <>
      {trigger}
      <StandaloneDocumentViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        href={href}
        title={documentTitle}
      />
      <LeaveAppConfirm
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        href={href}
        title={leaveTitle}
        description={leaveDescription}
      />
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";
import {
  emitAcqFunnelEvent,
  type AcqFunnelEventName,
  type AcqFunnelProps
} from "../../lib/acquire/funnel";

/**
 * Fire a once-per-session page-view funnel event on mount (client-only).
 */
export function AcqFunnelPageView({
  eventName,
  props,
  dedupeKey
}: {
  eventName: AcqFunnelEventName;
  props?: AcqFunnelProps;
  dedupeKey?: string;
}) {
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const referrer =
      typeof document !== "undefined" && document.referrer
        ? (() => {
            try {
              return new URL(document.referrer).hostname;
            } catch {
              return "external";
            }
          })()
        : null;
    emitAcqFunnelEvent(
      eventName,
      { referrer, ...propsRef.current },
      { oncePerSession: true, dedupeKey: dedupeKey ?? eventName }
    );
  }, [eventName, dedupeKey]);

  return null;
}

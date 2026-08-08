import type { Metadata } from "next";

/** Shared demo route metadata — keeps layout reachable for boundary checks. */
export const DEMO_ROUTE_METADATA: Metadata = {
  title: "Live Demo — My Property Assistant",
  description:
    "Experience M.P.A. Property Manager, Facility Operations, or Complete Platform without creating an account.",
  robots: { index: false, follow: false }
};

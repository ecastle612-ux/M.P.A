import type { SVGProps } from "react";
import { cn } from "../lib/cn";

const PATHS = {
  missionControl:
    "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z",
  launcher:
    "M4 5h6v6H4zm10 0h6v6h-6zM4 15h6v6H4zm10 0h6v6h-6z",
  setup: "M8 6h12M8 12h12M8 18h12M5 6h.01M5 12h.01M5 18h.01",
  properties:
    "M4 20V10l5-4 5 4v10H4zm10-6h6v6h-6zM8 20v-4h2v4",
  residents:
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8.5 1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 19a5.5 5.5 0 0 1 11 0M14 19a4.5 4.5 0 0 1 7-3.7",
  leasing:
    "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6zm6 4.5v2",
  maintenance:
    "M14.7 6.3a4 4 0 0 1-5.2 5.2L4 17l3 3 5.5-5.5a4 4 0 0 1 5.2-5.2L16 8z",
  financialOperations:
    "M4 7h16v11H4zm3 4h8M7 15h5M8 7V5h8v2",
  onlinePayments:
    "M3 8h18v10H3zm0 3h18M7 16h4",
  vendors:
    "M3 16h13V8H9L7 5H3zm13 0h3l3-4h-6zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  workOrderReports:
    "M7 3h8l4 4v14H7zm3 9h6M10 15h4M10 7h3",
  operations:
    "M8 5h11v16H8zm0 4h11M8 13h11M5 8h1v10H5z",
  myWork:
    "M9 12.5 11 14.5 16 9.5M7 4h10l2 3H5zm-1 3h16v13H6z",
  assets: "M4 7h16l-2 12H6zm4-3h8l1 3H7z",
  inventory: "M4 8h16v12H4zm0 0 8-4 8 4M4 14h16",
  requestForms:
    "M7 3h8l4 4v14H7zm3 8h6M10 12h6M10 16h4",
  workTemplates:
    "M8 6h11M8 12h11M8 18h8M5 6l1 1 2-2M5 12l1 1 2-2",
  reports:
    "M5 19V9m5 10V5m5 14v-7m5 7V8",
  preventive: "M7 4h10v3H7zm-2 3h14v13H5zm4 5h6M9 16h4",
  inspections: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm6.5 1.5 3 3",
  safety:
    "M12 3 5 6v6c0 4.5 3.2 7.4 7 8.5 3.8-1.1 7-4 7-8.5V6z",
  compliance: "M8 4h8l3 3v13H8zm3 8 2 2 4-4",
  parts: "M12 8v4l3 2M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z",
  buildingSystems:
    "M5 20V8l7-4 7 4v12H5zm4-6h6v6H9z",
  documents: "M7 3h8l4 4v14H7zm4 8h5M11 12h5M11 16h3",
  tables: "M4 6h16v14H4zm0 4h16M10 6v14",
  communications:
    "M5 6h14v9H8l-3 3z",
  organization:
    "M4 20V9l6-4 6 4v11H4zm12-7h4v7h-4zM8 20v-4h4v4",
  team: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.5 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM4 19a5 5 0 0 1 10 0M14.5 19a4 4 0 0 1 6-3.5",
  billing: "M6 5h12l2 4H4zm-2 4h16v11H4zm4 5h8",
  settings:
    "M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 15a8 8 0 0 0 .1-2l2-1.2-2-3.4-2.2.6a8 8 0 0 0-1.7-1L15 5h-4l-.6 2.9a8 8 0 0 0-1.7 1L6.5 8.4l-2 3.4L6.5 13a8 8 0 0 0 .1 2l-2 1.2 2 3.4 2.2-.6a8 8 0 0 0 1.7 1L11 21h4l.6-2.9a8 8 0 0 0 1.7-1l2.2.6 2-3.4z",
  adminCommand:
    "M4 13h6V4H4zm10 7h6v-6h-6zM4 20h6v-5H4zm10-9h6V4h-6z",
  adminSupport:
    "M8 11a4 4 0 1 1 8 0c0 2-1.2 3-2.2 3.8S12 16 12 18M12 21h.01",
  adminHealth:
    "M4 13h3l2-5 3 10 2-5h6",
  customers:
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 19a5 5 0 0 1 10 0M16 8h5M16 12h5",
  operators:
    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0M12 12v3",
  viewAs: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  provisioning: "M4 8h16l-1.5 11h-13zM8 8V6h8v2",
  lifecycle: "M4 12a8 8 0 0 1 13.7-5.7L20 8M20 12a8 8 0 0 1-13.7 5.7L4 16M16 4h4v4M4 16v4h4",
  subscriptions: "M6 5h12v4H6zm0 6h12v8H6zm3 3h6",
  complimentary: "M4 9h16v11H4zm0 0 4-4h4l-2 4m6-4h4l-4 4",
  checkout: "M3 8h18v10H3zm0 3h18M8 16h3"
} as const;

export type NavIconName = keyof typeof PATHS;

export function NavIcon({
  name,
  className,
  title
}: {
  name: NavIconName;
  className?: string;
  title?: string;
}) {
  const props: SVGProps<SVGSVGElement> = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": title ? undefined : true,
    className: cn("h-5 w-5 shrink-0", className)
  };

  return (
    <svg {...props}>
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}

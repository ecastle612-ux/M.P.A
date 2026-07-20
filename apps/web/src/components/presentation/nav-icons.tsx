import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults: IconProps = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true
};

export function NavIconDashboard(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3 10.5 10 3.5l7 7" />
      <path d="M5.5 8.5V16.5h9V8.5" />
    </svg>
  );
}

export function NavIconProperties(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 16.5V8.5l6-4.5 6 4.5v8" />
      <path d="M8 16.5v-5h4v5" />
    </svg>
  );
}

export function NavIconUnits(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="3.5" y="4.5" width="13" height="12" rx="1.5" />
      <path d="M7 8.5h6M7 11.5h4" />
    </svg>
  );
}

export function NavIconTenants(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="10" cy="7" r="2.5" />
      <path d="M4.5 16.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  );
}

export function NavIconApplicants(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 16.5V6.5l6-4 6 4v10" />
      <path d="M8 16.5v-4h4v4" />
      <circle cx="14" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function NavIconLeases(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M6 4.5h8l1.5 2v10H4.5V6.5L6 4.5z" />
      <path d="M7 10.5h6M7 13h4" />
    </svg>
  );
}

export function NavIconMaintenance(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M11.5 4.5 15.5 8.5 9 15 5 16l1-4 5.5-6.5z" />
    </svg>
  );
}

export function NavIconVendors(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 7.5h12v9H4z" />
      <path d="M7 7.5V6a3 3 0 0 1 6 0v1.5" />
    </svg>
  );
}

export function NavIconCommunications(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 6.5h12v7H8l-4 3v-10z" />
    </svg>
  );
}

export function NavIconFinancials(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 15.5V8.5l6-3 6 3v7" />
      <path d="M8 12.5h4" />
    </svg>
  );
}

export function NavIconAi(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M10 3.5 12.5 8.5 17.5 9 13.5 12.5 14.5 17.5 10 15 5.5 17.5 6.5 12.5 2.5 9 7.5 8.5 10 3.5z" />
    </svg>
  );
}

export function NavIconProfile(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="10" cy="7" r="2.5" />
      <path d="M4.5 16c0-2.8 2.4-4.5 5.5-4.5s5.5 1.7 5.5 4.5" />
    </svg>
  );
}

export function NavIconPortals(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 6.5h12M4 10h12M4 13.5h8" />
      <path d="M14.5 13.5 17 16l-2.5 2.5" />
    </svg>
  );
}

export function NavIconMigration(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 6.5h12v9H4z" />
      <path d="M8 6.5V4.5h4v2" />
      <path d="M8 11.5h4M8 13.5h2" />
    </svg>
  );
}

export function NavIconSettings(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 3.5v2M10 14.5v2M3.5 10h2M14.5 10h2M5.4 5.4l1.4 1.4M13.2 13.2l1.4 1.4M5.4 14.6l1.4-1.4M13.2 6.8l1.4-1.4" />
    </svg>
  );
}

export function NavIconMasterAdmin(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 7.5h12v8H4z" />
      <path d="M7 7.5V5.5a3 3 0 0 1 6 0v2" />
      <circle cx="10" cy="11.5" r="1.2" />
    </svg>
  );
}

export const NAV_ICON_MAP: Record<string, ComponentType<IconProps>> = {
  "/dashboard": NavIconDashboard,
  "/properties": NavIconProperties,
  "/units": NavIconUnits,
  "/applicants": NavIconApplicants,
  "/tenants": NavIconTenants,
  "/leases": NavIconLeases,
  "/maintenance": NavIconMaintenance,
  "/vendors": NavIconVendors,
  "/communications": NavIconCommunications,
  "/financials": NavIconFinancials,
  "/ai-operations": NavIconAi,
  "/migration": NavIconMigration,
  "/settings": NavIconSettings,
  "/profile": NavIconProfile,
  "/portal": NavIconPortals,
  "/master-admin": NavIconMasterAdmin,
  "/master-admin/dashboards": NavIconDashboard,
  "/master-admin/providers": NavIconSettings,
  "/master-admin/testing": NavIconUnits,
  "/master-admin/health": NavIconMaintenance,
  "/master-admin/flags": NavIconAi
};

import type { ReactNode } from "react";
import { DEMO_ROUTE_METADATA } from "../../lib/demo/meta";

export const metadata = DEMO_ROUTE_METADATA;

export default function DemoGroupLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Live Demo — My Property Assistant",
  description:
    "Experience M.P.A. Property Manager, Facility Operations, or Complete Platform without creating an account.",
  robots: { index: false, follow: false }
};

export default function DemoGroupLayout({ children }: { children: ReactNode }) {
  return children;
}

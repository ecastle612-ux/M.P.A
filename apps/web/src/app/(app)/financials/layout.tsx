import type { ReactNode } from "react";
import { AccountingSubnav } from "../../../components/financial/accounting-subnav";

export default function FinancialsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-5">
      <AccountingSubnav />
      {children}
    </div>
  );
}

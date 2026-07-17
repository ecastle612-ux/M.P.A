import type { ReactNode } from "react";
import { Logo } from "./logo";

export function AuthBrandShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      <Logo size="login" priority />
      {children}
    </div>
  );
}

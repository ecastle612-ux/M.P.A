"use client";

import { createContext, useContext, type ReactNode } from "react";

type OperatorContextValue = {
  isPlatformOperator: boolean;
};

const OperatorContext = createContext<OperatorContextValue>({ isPlatformOperator: false });

export function OperatorProvider({
  children,
  isPlatformOperator
}: {
  children: ReactNode;
  isPlatformOperator: boolean;
}) {
  return <OperatorContext.Provider value={{ isPlatformOperator }}>{children}</OperatorContext.Provider>;
}

export function useOperatorContext(): OperatorContextValue {
  return useContext(OperatorContext);
}

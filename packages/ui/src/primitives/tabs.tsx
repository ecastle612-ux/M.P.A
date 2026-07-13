"use client";

import {
  createContext,
  useId,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode
} from "react";
import { cn } from "../lib/cn";

type TabsContextValue = {
  activeValue: string;
  setActiveValue: (value: string) => void;
  tabValues: string[];
  registerTabValue: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  defaultValue,
  children
}: {
  defaultValue: string;
  children: ReactNode;
}) {
  const [activeValue, setActiveValue] = useState(defaultValue);
  const [tabValues, setTabValues] = useState<string[]>([defaultValue]);
  const baseId = useId();
  const registerTabValue = useCallback((valueToRegister: string) => {
    setTabValues((current) => (current.includes(valueToRegister) ? current : [...current, valueToRegister]));
  }, []);
  const value = useMemo(
    () => ({
      activeValue,
      setActiveValue,
      tabValues,
      baseId,
      registerTabValue
    }),
    [activeValue, baseId, registerTabValue, tabValues],
  );
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used within Tabs");
  return context;
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex rounded-md bg-gray-100 p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const { activeValue, setActiveValue, tabValues, registerTabValue, baseId } = useTabsContext();
  const selected = activeValue === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  useEffect(() => {
    registerTabValue(value);
  }, [registerTabValue, value]);

  function handleArrowNavigation(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = tabValues.indexOf(value);
    if (currentIndex === -1 || tabValues.length === 0) return;

    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    event.preventDefault();

    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + delta + tabValues.length) % tabValues.length;
    const nextValue = tabValues[nextIndex];
    if (nextValue) {
      setActiveValue(nextValue);
    }
  }

  return (
    <button
      role="tab"
      id={tabId}
      aria-controls={panelId}
      type="button"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => setActiveValue(value)}
      onKeyDown={handleArrowNavigation}
      className={cn(
        "rounded-sm px-3 py-1.5 text-sm",
        selected
          ? "bg-white text-[var(--mpa-color-text-primary)] shadow-sm"
          : "text-[var(--mpa-color-text-secondary)] hover:text-[var(--mpa-color-text-primary)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const { activeValue, baseId } = useTabsContext();
  if (activeValue !== value) return null;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;
  return (
    <div role="tabpanel" id={panelId} aria-labelledby={tabId} className={className}>
      {children}
    </div>
  );
}

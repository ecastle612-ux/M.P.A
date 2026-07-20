import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Card, CardDescription, CardHeader, CardTitle } from "../primitives/card";

export function FormSection({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card variant="elevated" className={cn("space-y-3", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

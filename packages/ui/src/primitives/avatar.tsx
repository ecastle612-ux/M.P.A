import type { ImgHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type AvatarProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallback: string;
};

export function Avatar({ fallback, className, alt, src, ...props }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? fallback}
        className={cn(
          "h-8 w-8 rounded-full object-cover ring-1 ring-[var(--mpa-color-border-subtle)]",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <span
      aria-label={alt ?? fallback}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary-subtle)] text-xs font-semibold text-[var(--mpa-color-brand-primary)] ring-1 ring-[var(--mpa-color-border-subtle)]",
        className,
      )}
    >
      {fallback.slice(0, 2).toUpperCase()}
    </span>
  );
}

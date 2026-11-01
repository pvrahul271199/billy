import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article";
  padded?: boolean;
  /** "tint" (default): soft surface. "outline": white with a hairline border. */
  tone?: "tint" | "outline";
}

/** Surfaces separate with tint or hairlines, never heavy shadows. */
export function Card({ as: Tag = "div", padded = true, tone = "tint", className, ...rest }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-note",
        tone === "tint" ? "bg-tint" : "border border-line bg-white",
        padded && "p-4",
        className,
      )}
      {...rest}
    />
  );
}

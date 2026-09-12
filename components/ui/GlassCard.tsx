import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  edge?: boolean;
  as?: "div" | "section" | "article";
}

export function GlassCard({
  className,
  strong = false,
  edge = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        edge && "glass-edge",
        "rounded-3xl shadow-glass",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

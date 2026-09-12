import React from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-white/8", className)} />;
}

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8">
        <Inbox className="h-5 w-5 text-ink-100/50" />
      </div>
      <p className="text-sm font-medium text-ink-100/70">{message}</p>
      {hint && <p className="max-w-xs text-xs text-ink-100/40">{hint}</p>}
    </div>
  );
}

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "emerald" | "amber" | "danger" | "neutral";
  sublabel?: string;
  className?: string;
}

const toneStyles: Record<string, { iconBg: string; iconColor: string; ring: string }> = {
  emerald: { iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", ring: "hover:shadow-glow-emerald" },
  amber: { iconBg: "bg-amber-500/15", iconColor: "text-amber-400", ring: "" },
  danger: { iconBg: "bg-danger/15", iconColor: "text-danger", ring: "" },
  neutral: { iconBg: "bg-white/10", iconColor: "text-ink-100", ring: "" },
};

export function StatTile({ label, value, icon: Icon, tone = "neutral", sublabel, className }: StatTileProps) {
  const t = toneStyles[tone];
  return (
    <GlassCard
      edge
      className={cn(
        "p-6 flex flex-col gap-4 transition-shadow duration-300",
        t.ring,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-100/70">{label}</span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", t.iconBg)}>
          <Icon className={cn("h-[18px] w-[18px]", t.iconColor)} size={18} />
        </span>
      </div>
      <div>
        <p className="font-display text-3xl font-semibold tracking-tight text-white">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-ink-100/50">{sublabel}</p>}
      </div>
    </GlassCard>
  );
}

import React from "react";
import { LucideIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";
import { Tooltip } from "./Tooltip";

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "emerald" | "amber" | "danger" | "neutral";
  sublabel?: string;
  tooltip?: string;
  className?: string;
}

const toneStyles: Record<string, { iconBg: string; iconColor: string; ring: string }> = {
  emerald: { iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", ring: "hover:shadow-glow-emerald" },
  amber: { iconBg: "bg-amber-500/15", iconColor: "text-amber-400", ring: "" },
  danger: { iconBg: "bg-danger/15", iconColor: "text-danger", ring: "" },
  neutral: { iconBg: "bg-white/10", iconColor: "text-ink-100", ring: "" },
};

export function StatTile({ label, value, icon: Icon, tone = "neutral", sublabel, tooltip, className }: StatTileProps) {
  const toneStyle = toneStyles[tone];
  return (
    <GlassCard
      edge
      className={cn(
        "p-6 flex flex-col gap-4 transition-shadow duration-300",
        toneStyle.ring,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink-100/70">
          {label}
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="h-3.5 w-3.5 cursor-help text-ink-100/35" />
            </Tooltip>
          )}
        </span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", toneStyle.iconBg)}>
          <Icon className={cn("h-[18px] w-[18px]", toneStyle.iconColor)} size={18} />
        </span>
      </div>
      <div>
        <p className="font-display text-3xl font-semibold tracking-tight text-white">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-ink-100/50">{sublabel}</p>}
      </div>
    </GlassCard>
  );
}

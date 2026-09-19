"use client";

import React, { useEffect, useState } from "react";
import { Menu, X, ChevronDown, Languages } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { api } from "@/lib/api";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Branch } from "@/lib/types";
import { Sidebar } from "./Sidebar";

interface TopbarProps {
  title: string;
  subtitle?: string;
  activeBranchId: number | null;
  onBranchChange: (id: number | null) => void;
}

export function Topbar({ title, subtitle, activeBranchId, onBranchChange }: TopbarProps) {
  const { user } = useAuth();
  const { t, locale, toggleLocale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (user?.role === "OWNER" || user?.role === "ACCOUNTANT") {
      api.get("/branches/").then((res) => setBranches(res.data.results ?? res.data));
    }
  }, [user]);

  const showBranchSwitcher = (user?.role === "OWNER" || user?.role === "ACCOUNTANT") && branches.length > 0;

  return (
    <>
      <header className="glass sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-white md:text-xl">{title}</h1>
            {subtitle && <p className="text-xs text-ink-100/50 md:text-sm">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Tooltip content={locale === "en" ? "اردو میں دیکھیں" : "View in English"}>
            <button
              onClick={toggleLocale}
              aria-label={t("common.language")}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
            >
              <Languages className="h-4 w-4" />
              {locale === "en" ? "اردو" : "EN"}
            </button>
          </Tooltip>

          {showBranchSwitcher && (
            <div className="relative" data-tour="branch-switcher">
              <select
                value={activeBranchId ?? "ALL"}
                onChange={(e) => onBranchChange(e.target.value === "ALL" ? null : Number(e.target.value))}
                className="glass appearance-none rounded-xl border border-white/10 py-2 pl-4 pr-9 text-sm text-white outline-none focus:border-emerald-400/60"
              >
                <option value="ALL" className="bg-ink-800">{t("common.allBranches")}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-ink-800">
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            </div>
          )}
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink-900/70" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-64">
            <button
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-white/70 hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}

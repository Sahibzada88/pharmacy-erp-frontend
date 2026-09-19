"use client";

import React, { useState } from "react";
import { HelpCircle, Compass, Languages, X } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useTourStore } from "@/components/tour/tourStore";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const { startTour } = useTourStore();
  const { locale, toggleLocale, t } = useLanguage();

  return (
    <div className="fixed bottom-6 left-6 z-40" data-tour="help-button">
      {open && (
        <GlassCard edge className="absolute bottom-14 left-0 w-64 p-4 shadow-glass animate-fade-up">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-white">{t("helpMenu.title")}</p>
            <button onClick={() => setOpen(false)} className="text-ink-100/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => {
              startTour();
              setOpen(false);
            }}
            className="mb-2 flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
          >
            <Compass className="h-4 w-4 text-emerald-400" />
            <span>
              <span className="block font-medium">{t("common.replayTour")}</span>
              <span className="block text-xs text-ink-100/45">{t("helpMenu.replayTourDesc")}</span>
            </span>
          </button>

          <button
            onClick={toggleLocale}
            className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
          >
            <Languages className="h-4 w-4 text-emerald-400" />
            <span>
              <span className="block font-medium">{t("common.language")}</span>
              <span className="block text-xs text-ink-100/45">
                {locale === "en" ? "English → اردو" : "اردو → English"}
              </span>
            </span>
          </button>
        </GlassCard>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("common.help")}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-glow-emerald transition-transform hover:scale-105 active:scale-95"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    </div>
  );
}

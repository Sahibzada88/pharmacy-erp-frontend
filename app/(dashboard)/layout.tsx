"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { HelpButton } from "@/components/ui/HelpButton";
import { AppTour } from "@/components/tour/AppTour";

interface BranchFilterContextValue {
  branchId: number | null;
  setBranchId: (id: number | null) => void;
}
const BranchFilterContext = createContext<BranchFilterContextValue>({
  branchId: null,
  setBranchId: () => {},
});
export const useBranchFilter = () => useContext(BranchFilterContext);

// Keys map into the translation dictionary (lib/i18n/translations.ts).
// Add a matching `<page>: { title, subtitle }` block there for new pages.
const PAGE_META_KEYS: Record<string, { titleKey: string; subtitleKey: string }> = {
  "/owner": { titleKey: "ownerDashboard.title", subtitleKey: "ownerDashboard.subtitle" },
  "/pos": { titleKey: "pos.title", subtitleKey: "pos.subtitle" },
  "/inventory": { titleKey: "inventory.title", subtitleKey: "inventory.subtitle" },
};

// Pages not yet in the translation dictionary fall back to plain English —
// extend PAGE_META_KEYS + translations.ts to localize them too.
const PAGE_META_FALLBACK: Record<string, { title: string; subtitle: string }> = {
  "/invoices": { title: "Invoices", subtitle: "Browse, print & download past sales" },
  "/suppliers": { title: "Suppliers", subtitle: "Purchase orders & payables" },
  "/finance": { title: "Finance", subtitle: "Bank, cash & expenses" },
  "/crm": { title: "Customers", subtitle: "Loyalty & purchase history" },
  "/staff": { title: "Staff", subtitle: "Team & access" },
  "/branches": { title: "Branches", subtitle: "Manage your pharmacy locations" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [branchId, setBranchId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
      </div>
    );
  }

  const matchedKey =
    (pathname && pathname in PAGE_META_KEYS && pathname) ||
    Object.keys(PAGE_META_KEYS).find((key) => pathname?.startsWith(key + "/"));

  const meta = matchedKey
    ? { title: t(PAGE_META_KEYS[matchedKey].titleKey), subtitle: t(PAGE_META_KEYS[matchedKey].subtitleKey) }
    : PAGE_META_FALLBACK[pathname || ""] ||
      PAGE_META_FALLBACK[Object.keys(PAGE_META_FALLBACK).find((key) => pathname?.startsWith(key + "/")) || ""] || {
        title: "Dashboard",
        subtitle: "",
      };

  return (
    <BranchFilterContext.Provider value={{ branchId, setBranchId }}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            title={meta.title}
            subtitle={meta.subtitle}
            activeBranchId={branchId}
            onBranchChange={setBranchId}
          />
          <main className="flex-1 p-5 md:p-8">{children}</main>
        </div>
      </div>
      <HelpButton />
      <AppTour />
    </BranchFilterContext.Provider>
  );
}


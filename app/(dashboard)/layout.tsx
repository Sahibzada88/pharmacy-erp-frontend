"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

interface BranchFilterContextValue {
  branchId: number | null;
  setBranchId: (id: number | null) => void;
}
const BranchFilterContext = createContext<BranchFilterContextValue>({
  branchId: null,
  setBranchId: () => {},
});
export const useBranchFilter = () => useContext(BranchFilterContext);

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/owner": { title: "Overview", subtitle: "Chain performance at a glance" },
  "/pos": { title: "Point of Sale", subtitle: "Ring up a sale" },
  "/inventory": { title: "Inventory", subtitle: "Stock, batches & expiry" },
  "/suppliers": { title: "Suppliers", subtitle: "Purchase orders & payables" },
  "/finance": { title: "Finance", subtitle: "Bank, cash & expenses" },
  "/crm": { title: "Customers", subtitle: "Loyalty & purchase history" },
  "/staff": { title: "Staff", subtitle: "Team & access" },
  "/branches": { title: "Branches", subtitle: "Manage your pharmacy locations" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
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

  const meta = PAGE_META[pathname || ""] || { title: "Dashboard", subtitle: "" };

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
    </BranchFilterContext.Provider>
  );
}

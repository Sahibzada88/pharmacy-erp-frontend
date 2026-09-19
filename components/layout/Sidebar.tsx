"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ShoppingCart,
  Boxes,
  Truck,
  Wallet,
  Users,
  UserCog,
  Building2,
  Receipt,
  LogOut,
} from "lucide-react";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  labelKey: string;
  tourId: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/owner", labelKey: "nav.overview", tourId: "nav-overview", icon: LayoutGrid, roles: ["OWNER", "MANAGER"] },
  { href: "/pos", labelKey: "nav.pos", tourId: "nav-pos", icon: ShoppingCart, roles: ["OWNER", "MANAGER", "CASHIER"] },
  { href: "/invoices", labelKey: "nav.invoices", tourId: "nav-invoices", icon: Receipt, roles: ["OWNER", "MANAGER", "CASHIER", "ACCOUNTANT"] },
  { href: "/inventory", labelKey: "nav.inventory", tourId: "nav-inventory", icon: Boxes, roles: ["OWNER", "MANAGER", "PHARMACIST"] },
  { href: "/suppliers", labelKey: "nav.suppliers", tourId: "nav-suppliers", icon: Truck, roles: ["OWNER", "MANAGER", "ACCOUNTANT"] },
  { href: "/finance", labelKey: "nav.finance", tourId: "nav-finance", icon: Wallet, roles: ["OWNER", "MANAGER", "ACCOUNTANT"] },
  { href: "/crm", labelKey: "nav.customers", tourId: "nav-customers", icon: Users, roles: ["OWNER", "MANAGER", "CASHIER"] },
  { href: "/staff", labelKey: "nav.staff", tourId: "nav-staff", icon: UserCog, roles: ["OWNER", "MANAGER"] },
  { href: "/branches", labelKey: "nav.branches", tourId: "nav-branches", icon: Building2, roles: ["OWNER"] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="glass sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 p-5 md:flex">
      <div data-tour="sidebar-logo" className="flex items-center gap-2.5 px-1 pb-8 pt-1">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
          <div className="absolute h-4 w-1.5 rounded-full bg-emerald-400" />
          <div className="absolute h-1.5 w-4 rounded-full bg-emerald-400" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none text-white">Rahat Pharmacy</p>
          <p className="mt-1 text-[11px] leading-none text-ink-100/45">Chain ERP</p>
        </div>
      </div>

      <nav data-tour="sidebar-nav" className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tourId}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-ink-100/65 hover:bg-white/6 hover:text-white"
              )}
            >
              <Icon className="h-[18px] w-[18px]" size={18} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 font-display text-sm font-semibold text-white">
            {(user.first_name?.[0] || user.username[0]).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
            </p>
            <p className="truncate text-xs text-ink-100/45">
              {ROLE_LABELS[user.role]}
              {user.branch_name ? ` · ${user.branch_name}` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-100/60 transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="h-[18px] w-[18px]" size={18} />
          {t("nav.signOut")}
        </button>
      </div>
    </aside>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  TrendingUp,
  Boxes,
  Landmark,
  AlertTriangle,
  Receipt,
  Clock,
  Truck,
} from "lucide-react";
import { api } from "@/lib/api";
import { useBranchFilter } from "../layout";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, EmptyState } from "@/components/ui/Skeleton";
import { SalesTrendChart } from "@/components/charts/SalesTrendChart";
import { PaymentMixChart } from "@/components/charts/PaymentMixChart";
import { formatCurrency, formatNumber, formatDate, daysAgoISO, todayISO } from "@/lib/utils";
import type { OwnerDashboardSummary } from "@/lib/types";

const DATE_FROM = daysAgoISO(30);
const DATE_TO = todayISO();

export default function OwnerDashboardPage() {
  const { branchId } = useBranchFilter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<OwnerDashboardSummary | null>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [topMedicines, setTopMedicines] = useState<any[]>([]);
  const [paymentMix, setPaymentMix] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [supplierDues, setSupplierDues] = useState<any[]>([]);

  const qs = useCallback(
    (extra: Record<string, any> = {}) => {
      const params: Record<string, any> = { date_from: DATE_FROM, date_to: DATE_TO, ...extra };
      if (branchId) params.branch = branchId;
      return params;
    },
    [branchId]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.allSettled([
      api.get("/analytics/owner-dashboard/", { params: qs() }),
      api.get("/analytics/sales/daily-trend/", { params: qs() }),
      api.get("/analytics/sales/top-medicines/", { params: qs({ limit: 6 }) }),
      api.get("/analytics/sales/payment-methods/", { params: qs() }),
      api.get("/analytics/inventory/low-stock/", { params: branchId ? { branch: branchId } : {} }),
      api.get("/analytics/inventory/expiry-report/", { params: { days: 60, ...(branchId ? { branch: branchId } : {}) } }),
      api.get("/analytics/suppliers/dues/", { params: branchId ? { branch: branchId } : {} }),
    ]).then((results) => {
      if (cancelled) return;
      const [dash, trendRes, topMed, mix, low, exp, dues] = results;
      if (dash.status === "fulfilled") setSummary(dash.value.data.summary);
      if (trendRes.status === "fulfilled") setTrend(trendRes.value.data.trend);
      if (topMed.status === "fulfilled") setTopMedicines(topMed.value.data.results);
      if (mix.status === "fulfilled") setPaymentMix(mix.value.data.results);
      if (low.status === "fulfilled") setLowStock(low.value.data.results.slice(0, 6));
      if (exp.status === "fulfilled") setExpiring(exp.value.data.results.slice(0, 6));
      if (dues.status === "fulfilled") setSupplierDues(dues.value.data.suppliers.slice(0, 6));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [qs, branchId]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-100/45">
        {t("ownerDashboard.showing")} {formatDate(DATE_FROM)} — {formatDate(DATE_TO)}
        {branchId ? "" : ` · ${t("common.allBranches").toLowerCase()}`}
      </p>

      {/* KPI hero row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading || !summary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatTile
              label={t("ownerDashboard.netSales")}
              tooltip={t("ownerDashboard.netSalesHint")}
              value={formatCurrency(summary.net_sales)}
              icon={TrendingUp}
              tone="emerald"
              sublabel={`${formatNumber(summary.total_invoices)} ${t("ownerDashboard.invoicesCount")}`}
            />
            <StatTile
              label={t("ownerDashboard.grossProfit")}
              tooltip={t("ownerDashboard.grossProfitHint")}
              value={formatCurrency(summary.gross_profit)}
              icon={Wallet}
              tone="emerald"
            />
            <StatTile
              label={t("ownerDashboard.stockValue")}
              tooltip={t("ownerDashboard.stockValueHint")}
              value={formatCurrency(summary.total_stock_value)}
              icon={Boxes}
              tone="amber"
              sublabel={`${formatNumber(summary.low_stock_items)} ${t("ownerDashboard.itemsLow")}`}
            />
            <StatTile
              label={t("ownerDashboard.bankBalance")}
              tooltip={t("ownerDashboard.bankBalanceHint")}
              value={formatCurrency(summary.total_bank_balance)}
              icon={Landmark}
              tone="neutral"
              sublabel={`${t("ownerDashboard.owedToSuppliers")}: ${formatCurrency(summary.total_supplier_dues)}`}
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <GlassCard className="p-6">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">{t("ownerDashboard.salesTrend")}</h3>
            <div className="flex items-center gap-4 text-xs text-ink-100/45">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {t("ownerDashboard.netSales")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> {t("ownerDashboard.grossProfit")}</span>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : trend.length ? (
            <SalesTrendChart data={trend} />
          ) : (
            <EmptyState message="No sales recorded in this period" hint="Once the POS logs sales, this chart fills in automatically." />
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-1 font-display text-base font-semibold text-white">{t("ownerDashboard.paymentMix")}</h3>
          {loading ? <Skeleton className="h-[240px] w-full" /> : <PaymentMixChart data={paymentMix} />}
        </GlassCard>
      </div>

      {/* Lower grid: top medicines, low stock, expiry, supplier dues */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListCard
          title={t("ownerDashboard.topMedicines")}
          icon={Receipt}
          loading={loading}
          rows={topMedicines}
          empty={t("ownerDashboard.noSalesYet")}
          renderRow={(m) => (
            <>
              <div>
                <p className="text-sm font-medium text-white">{m.medicine_name}</p>
                <p className="text-xs text-ink-100/45">{formatNumber(m.units_sold)} {t("ownerDashboard.unitsSold")}</p>
              </div>
              <p className="font-display text-sm font-semibold text-emerald-400">{formatCurrency(m.revenue)}</p>
            </>
          )}
        />

        <ListCard
          title={t("ownerDashboard.lowStock")}
          icon={AlertTriangle}
          loading={loading}
          rows={lowStock}
          empty={t("ownerDashboard.stockHealthy")}
          renderRow={(m) => (
            <>
              <div>
                <p className="text-sm font-medium text-white">{m.medicine_name}</p>
                <p className="text-xs text-ink-100/45">SKU {m.sku}</p>
              </div>
              <Badge tone="amber">{m.total_remaining} left / {m.reorder_level} min</Badge>
            </>
          )}
        />

        <ListCard
          title={t("ownerDashboard.expiringSoon")}
          icon={Clock}
          loading={loading}
          rows={expiring}
          empty={t("ownerDashboard.noExpiring")}
          renderRow={(b) => (
            <>
              <div>
                <p className="text-sm font-medium text-white">{b.medicine_name}</p>
                <p className="text-xs text-ink-100/45">
                  {b.branch_name} · Batch {b.batch_number}
                </p>
              </div>
              <Badge tone={b.days_to_expiry <= 14 ? "danger" : "amber"}>
                {b.days_to_expiry} days
              </Badge>
            </>
          )}
        />

        <ListCard
          title={t("ownerDashboard.supplierDues")}
          icon={Truck}
          loading={loading}
          rows={supplierDues.filter((s) => s.balance_due > 0)}
          empty={t("ownerDashboard.noDues")}
          renderRow={(s) => (
            <>
              <p className="text-sm font-medium text-white">{s.supplier_name}</p>
              <p className="font-display text-sm font-semibold text-amber-400">{formatCurrency(s.balance_due)}</p>
            </>
          )}
        />
      </div>
    </div>
  );
}

function ListCard({
  title,
  icon: Icon,
  rows,
  loading,
  empty,
  renderRow,
}: {
  title: string;
  icon: React.ElementType;
  rows: any[];
  loading: boolean;
  empty: string;
  renderRow: (row: any) => React.ReactNode;
}) {
  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-ink-100/50" />
        <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState message={empty} />
      ) : (
        <div className="space-y-1">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/5"
            >
              {renderRow(row)}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { useBranchFilter } from "../layout";
import { useAuth } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Sale } from "@/lib/types";

const STATUS_TONE: Record<string, "emerald" | "amber" | "danger" | "neutral"> = {
  COMPLETED: "emerald",
  PARTIALLY_RETURNED: "amber",
  RETURNED: "danger",
  VOIDED: "neutral",
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const { branchId } = useBranchFilter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Sale[]>([]);

  const effectiveBranch = user?.role === "OWNER" || user?.role === "ACCOUNTANT" ? branchId : user?.branch ?? null;

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/sales/invoices/", {
        params: {
          branch: effectiveBranch ?? undefined,
          search: search || undefined,
          status: status || undefined,
          ordering: "-created_at",
        },
      })
      .then((r) => setInvoices(r.data.results ?? r.data))
      .finally(() => setLoading(false));
  }, [effectiveBranch, search, status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-100/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number…"
            className="pl-10"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="" className="bg-ink-800">All statuses</option>
          <option value="COMPLETED" className="bg-ink-800">Completed</option>
          <option value="PARTIALLY_RETURNED" className="bg-ink-800">Partially returned</option>
          <option value="RETURNED" className="bg-ink-800">Returned</option>
          <option value="VOIDED" className="bg-ink-800">Voided</option>
        </Select>
      </div>

      <GlassCard className="p-6">
        <DataTable
          loading={loading}
          rows={invoices}
          keyField={(s) => s.id}
          emptyMessage="No invoices yet — completed sales will show up here."
          onRowClick={(s) => {
            window.location.href = `/invoices/${s.id}`;
          }}
          columns={[
            {
              header: "Invoice",
              accessor: (s) => (
                <Link href={`/invoices/${s.id}`} className="flex items-center gap-2 font-medium text-white hover:text-emerald-400">
                  <Receipt className="h-3.5 w-3.5 text-ink-100/40" />
                  {s.invoice_number}
                </Link>
              ),
            },
            { header: "Branch", accessor: (s) => s.branch_name },
            { header: "Cashier", accessor: (s) => s.cashier_name },
            { header: "Customer", accessor: (s) => s.customer_name || "Walk-in" },
            { header: "Total", accessor: (s) => <span className="font-medium text-white">{formatCurrency(s.total_amount)}</span> },
            { header: "Status", accessor: (s) => <Badge tone={STATUS_TONE[s.status] || "neutral"}>{s.status.replace(/_/g, " ")}</Badge> },
            { header: "Date", accessor: (s) => formatDateTime(s.created_at) },
          ]}
        />
      </GlassCard>
    </div>
  );
}

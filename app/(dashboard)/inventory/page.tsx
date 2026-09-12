"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, AlertTriangle, Clock } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useBranchFilter } from "../layout";
import { useAuth } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type { Medicine, Batch } from "@/lib/types";

export default function InventoryPage() {
  const { user } = useAuth();
  const { branchId } = useBranchFilter();
  const [tab, setTab] = useState("medicines");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const canManage = user && ["OWNER", "MANAGER", "PHARMACIST"].includes(user.role);
  const effectiveBranch = user?.role === "OWNER" || user?.role === "ACCOUNTANT" ? branchId : user?.branch ?? null;

  const load = useCallback(() => {
    setLoading(true);
    if (tab === "medicines") {
      api
        .get("/inventory/medicines/", { params: { search: search || undefined, ordering: "name" } })
        .then((r) => setMedicines(r.data.results ?? r.data))
        .finally(() => setLoading(false));
    } else if (tab === "batches") {
      api
        .get("/inventory/batches/", {
          params: { branch: effectiveBranch ?? undefined, ordering: "expiry_date", is_active: true },
        })
        .then((r) => setBatches(r.data.results ?? r.data))
        .finally(() => setLoading(false));
    } else if (tab === "low_stock") {
      api
        .get("/analytics/inventory/low-stock/", { params: { branch: effectiveBranch ?? undefined } })
        .then((r) => setLowStock(r.data.results))
        .finally(() => setLoading(false));
    } else if (tab === "expiring") {
      api
        .get("/analytics/inventory/expiry-report/", { params: { branch: effectiveBranch ?? undefined, days: 90 } })
        .then((r) => setExpiring(r.data.results))
        .finally(() => setLoading(false));
    }
  }, [tab, search, effectiveBranch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { key: "medicines", label: "Medicines" },
            { key: "batches", label: "Batches" },
            { key: "low_stock", label: "Low stock" },
            { key: "expiring", label: "Expiring soon" },
          ]}
          active={tab}
          onChange={setTab}
        />
        {canManage && tab === "medicines" && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add medicine
          </Button>
        )}
      </div>

      {tab === "medicines" && (
        <GlassCard className="p-6">
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-100/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, generic name or SKU…"
              className="pl-10"
            />
          </div>
          <DataTable
            loading={loading}
            rows={medicines}
            keyField={(m) => m.id}
            emptyMessage="No medicines in the catalog yet."
            columns={[
              {
                header: "Medicine",
                accessor: (m) => (
                  <div>
                    <p className="font-medium text-white">{m.name}</p>
                    <p className="text-xs text-ink-100/40">{m.generic_name || m.sku}</p>
                  </div>
                ),
              },
              { header: "SKU", accessor: (m) => m.sku },
              { header: "Category", accessor: (m) => m.category_name || "—" },
              { header: "Unit", accessor: (m) => m.unit_type },
              {
                header: "Stock",
                accessor: (m) => (
                  <Badge tone={m.total_stock <= m.reorder_level ? "amber" : "emerald"}>
                    {formatNumber(m.total_stock)}
                  </Badge>
                ),
              },
              {
                header: "Rx",
                accessor: (m) => (m.requires_prescription ? <Badge tone="danger">Rx</Badge> : "—"),
              },
            ]}
          />
        </GlassCard>
      )}

      {tab === "batches" && (
        <GlassCard className="p-6">
          <DataTable
            loading={loading}
            rows={batches}
            keyField={(b) => b.id}
            emptyMessage="No batches recorded for this branch yet."
            columns={[
              { header: "Medicine", accessor: (b) => <span className="font-medium text-white">{b.medicine_name}</span> },
              { header: "Batch #", accessor: (b) => b.batch_number },
              { header: "Branch", accessor: (b) => b.branch_name },
              { header: "Remaining", accessor: (b) => formatNumber(b.quantity_remaining) },
              { header: "Cost / Sale", accessor: (b) => `${formatCurrency(b.cost_price)} / ${formatCurrency(b.sale_price)}` },
              {
                header: "Expiry",
                accessor: (b) => (
                  <Badge tone={b.is_expired ? "danger" : b.is_near_expiry ? "amber" : "neutral"}>
                    {formatDate(b.expiry_date)}
                  </Badge>
                ),
              },
              { header: "Value", accessor: (b) => formatCurrency(b.stock_value) },
            ]}
          />
        </GlassCard>
      )}

      {tab === "low_stock" && (
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">Medicines at or below their reorder level.</p>
          </div>
          <DataTable
            loading={loading}
            rows={lowStock}
            keyField={(r) => r.medicine_id}
            emptyMessage="Nothing is low on stock right now."
            columns={[
              { header: "Medicine", accessor: (r) => <span className="font-medium text-white">{r.medicine_name}</span> },
              { header: "SKU", accessor: (r) => r.sku },
              { header: "Remaining", accessor: (r) => <Badge tone="amber">{r.total_remaining}</Badge> },
              { header: "Reorder level", accessor: (r) => r.reorder_level },
            ]}
          />
        </GlassCard>
      )}

      {tab === "expiring" && (
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-2 text-amber-400">
            <Clock className="h-4 w-4" />
            <p className="text-sm">Batches expiring within the next 90 days, soonest first.</p>
          </div>
          <DataTable
            loading={loading}
            rows={expiring}
            keyField={(r) => r.batch_id}
            emptyMessage="Nothing expiring soon."
            columns={[
              { header: "Medicine", accessor: (r) => <span className="font-medium text-white">{r.medicine_name}</span> },
              { header: "Branch", accessor: (r) => r.branch_name },
              { header: "Batch #", accessor: (r) => r.batch_number },
              { header: "Remaining", accessor: (r) => r.quantity_remaining },
              {
                header: "Expires in",
                accessor: (r) => (
                  <Badge tone={r.days_to_expiry <= 14 ? "danger" : "amber"}>{r.days_to_expiry} days</Badge>
                ),
              },
              { header: "Stock value", accessor: (r) => formatCurrency(r.stock_value) },
            ]}
          />
        </GlassCard>
      )}

      {addOpen && <AddMedicineModal onClose={() => setAddOpen(false)} onCreated={load} />}
    </div>
  );
}

function AddMedicineModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    generic_name: "",
    sku: "",
    unit_type: "TABLET",
    reorder_level: 10,
    requires_prescription: false,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/inventory/medicines/", form);
      toastSuccess("Medicine added to the catalog.");
      onCreated();
      onClose();
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add a new medicine">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Amoxicillin 500mg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Generic name</Label>
            <Input value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
          </div>
          <div>
            <Label>SKU</Label>
            <Input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Reorder level</Label>
            <Input
              type="number"
              value={form.reorder_level}
              onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 text-sm text-ink-100/70">
              <input
                type="checkbox"
                checked={form.requires_prescription}
                onChange={(e) => setForm({ ...form, requires_prescription: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-emerald-500"
              />
              Requires prescription
            </label>
          </div>
        </div>
        <Button type="submit" className="w-full" loading={submitting}>
          Add medicine
        </Button>
      </form>
    </Modal>
  );
}

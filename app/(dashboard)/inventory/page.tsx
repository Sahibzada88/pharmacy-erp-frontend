"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, AlertTriangle, Clock, Upload } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useBranchFilter } from "../layout";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import { BulkImportModal } from "@/components/inventory/BulkImportModal";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type { Medicine, Batch } from "@/lib/types";

export default function InventoryPage() {
  const { user } = useAuth();
  const { branchId } = useBranchFilter();
  const { t } = useLanguage();
  const [tab, setTab] = useState("medicines");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addBatchOpen, setAddBatchOpen] = useState(false);

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
            { key: "medicines", label: t("inventory.tabMedicines") },
            { key: "batches", label: t("inventory.tabBatches") },
            { key: "low_stock", label: t("inventory.tabLowStock") },
            { key: "expiring", label: t("inventory.tabExpiring") },
          ]}
          active={tab}
          onChange={setTab}
        />
        {canManage && tab === "medicines" && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)} data-tour="inventory-bulk-import">
              <Upload className="h-4 w-4" /> {t("inventory.bulkImport")}
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> {t("inventory.addMedicine")}
            </Button>
          </div>
        )}
        {canManage && tab === "batches" && (
          <Button onClick={() => setAddBatchOpen(true)}>
            <Plus className="h-4 w-4" /> Restock existing medicine
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
              placeholder={t("inventory.searchPlaceholder")}
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
      {importOpen && <BulkImportModal onClose={() => setImportOpen(false)} onImported={load} />}
      {addBatchOpen && (
        <AddBatchModal
          effectiveBranch={effectiveBranch}
          onClose={() => setAddBatchOpen(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}

function AddMedicineModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const { branchId } = useBranchFilter();
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const effectiveBranch = user?.role === "OWNER" ? branchId : user?.branch ?? null;

  const [form, setForm] = useState({
    // Medicine details
    name: "",
    generic_name: "",
    sku: "",
    unit_type: "TABLET",
    reorder_level: 10,
    requires_prescription: false,
    // Price & stock — entered right here, same screen, Abuzar-style
    branch: effectiveBranch ? String(effectiveBranch) : "",
    cost_price: "",
    sale_price: "",
    quantity_received: "",
    expiry_date: "",
    batch_number: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === "OWNER") {
      api.get("/branches/").then((r) => setBranches(r.data.results ?? r.data));
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Step 1: create the medicine catalog entry.
      const { data: medicine } = await api.post("/inventory/medicines/", {
        name: form.name,
        generic_name: form.generic_name,
        sku: form.sku,
        unit_type: form.unit_type,
        reorder_level: form.reorder_level,
        requires_prescription: form.requires_prescription,
      });

      // Step 2: immediately add its opening stock + price, same as Abuzar's
      // single-screen "add item with price" flow — the person filling this
      // form never sees "medicine" and "batch" as two separate concepts.
      await api.post("/inventory/batches/", {
        medicine: medicine.id,
        branch: Number(form.branch),
        batch_number: form.batch_number || `OPEN-${Date.now()}`,
        quantity_received: Number(form.quantity_received),
        quantity_remaining: Number(form.quantity_received),
        cost_price: form.cost_price,
        sale_price: form.sale_price,
        expiry_date: form.expiry_date,
      });

      toastSuccess(`${form.name} added with price and stock — ready to sell.`);
      onCreated();
      onClose();
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add new medicine" width="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Medicine name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Panadol 500mg" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Generic name</Label>
            <Input value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
          </div>
          <div>
            <Label>SKU / Code</Label>
            <Input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PAN-500" />
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-400">Price &amp; opening stock</p>

          {user?.role === "OWNER" && (
            <div className="mb-3">
              <Label>Branch</Label>
              <Select required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                <option value="" className="bg-ink-800">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-ink-800">{b.name}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Purchase price (cost)</Label>
              <Input required type="number" step="0.01" min="0" value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="e.g. 8.00" />
            </div>
            <div>
              <Label>Sale price</Label>
              <Input required type="number" step="0.01" min="0" value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: e.target.value })} placeholder="e.g. 12.00" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input required type="number" min="1" value={form.quantity_received}
                onChange={(e) => setForm({ ...form, quantity_received: e.target.value })} placeholder="e.g. 100" />
            </div>
            <div>
              <Label>Expiry date</Label>
              <Input required type="date" value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
            </div>
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
          Add medicine — ready to sell
        </Button>
      </form>
    </Modal>
  );
}

function AddBatchModal({
  effectiveBranch,
  onClose,
  onCreated,
}: {
  effectiveBranch: number | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({
    medicine: "",
    branch: effectiveBranch ? String(effectiveBranch) : "",
    batch_number: "",
    quantity_received: "",
    cost_price: "",
    sale_price: "",
    expiry_date: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/inventory/medicines/", { params: { is_active: true, ordering: "name" } })
      .then((r) => setMedicines(r.data.results ?? r.data));
    if (user?.role === "OWNER") {
      api.get("/branches/").then((r) => setBranches(r.data.results ?? r.data));
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/inventory/batches/", {
        medicine: Number(form.medicine),
        branch: Number(form.branch),
        batch_number: form.batch_number || `MANUAL-${Date.now()}`,
        quantity_received: Number(form.quantity_received),
        quantity_remaining: Number(form.quantity_received),
        cost_price: form.cost_price,
        sale_price: form.sale_price,
        expiry_date: form.expiry_date,
      });
      toastSuccess("Stock added — price and quantity are now live.");
      onCreated();
      onClose();
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add stock (sets the price)">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Medicine</Label>
          <Select required value={form.medicine} onChange={(e) => setForm({ ...form, medicine: e.target.value })}>
            <option value="" className="bg-ink-800">Select medicine</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id} className="bg-ink-800">{m.name} ({m.sku})</option>
            ))}
          </Select>
        </div>

        {user?.role === "OWNER" && (
          <div>
            <Label>Branch</Label>
            <Select required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
              <option value="" className="bg-ink-800">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-ink-800">{b.name}</option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Cost price (what you paid)</Label>
            <Input required type="number" step="0.01" min="0" value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="e.g. 8.00" />
          </div>
          <div>
            <Label>Sale price (what customer pays)</Label>
            <Input required type="number" step="0.01" min="0" value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: e.target.value })} placeholder="e.g. 12.00" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Quantity received</Label>
            <Input required type="number" min="1" value={form.quantity_received}
              onChange={(e) => setForm({ ...form, quantity_received: e.target.value })} />
          </div>
          <div>
            <Label>Expiry date</Label>
            <Input required type="date" value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
        </div>

        <div>
          <Label>Batch number (optional)</Label>
          <Input value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
            placeholder="Leave blank to auto-generate" />
        </div>

        <Button type="submit" className="w-full" loading={submitting}>
          Add stock
        </Button>
      </form>
    </Modal>
  );
}

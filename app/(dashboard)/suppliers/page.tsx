"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Truck } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Supplier } from "@/lib/types";

export default function SuppliersPage() {
  const { user } = useAuth();
  const { branchId } = useBranchFilter();
  const [tab, setTab] = useState("suppliers");
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [dues, setDues] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const effectiveBranch = user?.role === "OWNER" || user?.role === "ACCOUNTANT" ? branchId : user?.branch ?? null;
  const canManage = user && ["OWNER", "MANAGER"].includes(user.role);

  const load = useCallback(() => {
    setLoading(true);
    if (tab === "suppliers") {
      api.get("/suppliers/suppliers/").then((r) => setSuppliers(r.data.results ?? r.data)).finally(() => setLoading(false));
    } else if (tab === "orders") {
      api
        .get("/suppliers/purchase-orders/", { params: { branch: effectiveBranch ?? undefined, ordering: "-created_at" } })
        .then((r) => setPurchaseOrders(r.data.results ?? r.data))
        .finally(() => setLoading(false));
    } else if (tab === "dues") {
      api
        .get("/analytics/suppliers/dues/", { params: { branch: effectiveBranch ?? undefined } })
        .then((r) => setDues(r.data.suppliers))
        .finally(() => setLoading(false));
    }
  }, [tab, effectiveBranch]);

  useEffect(() => {
    load();
  }, [load]);

  const statusTone: Record<string, "neutral" | "amber" | "emerald" | "danger"> = {
    DRAFT: "neutral",
    ORDERED: "amber",
    PARTIALLY_RECEIVED: "amber",
    RECEIVED: "emerald",
    CANCELLED: "danger",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { key: "suppliers", label: "Suppliers" },
            { key: "orders", label: "Purchase orders" },
            { key: "dues", label: "Amounts owed" },
          ]}
          active={tab}
          onChange={setTab}
        />
        {canManage && tab === "suppliers" && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add supplier
          </Button>
        )}
      </div>

      {tab === "suppliers" && (
        <GlassCard className="p-6">
          <DataTable
            loading={loading}
            rows={suppliers}
            keyField={(s) => s.id}
            emptyMessage="No suppliers added yet."
            columns={[
              { header: "Supplier", accessor: (s) => <span className="font-medium text-white">{s.name}</span> },
              { header: "Contact", accessor: (s) => s.contact_person || "—" },
              { header: "Phone", accessor: (s) => s.phone || "—" },
              {
                header: "Payable",
                accessor: (s) => (
                  <span className={s.total_payable > 0 ? "font-medium text-amber-400" : "text-ink-100/50"}>
                    {formatCurrency(s.total_payable)}
                  </span>
                ),
              },
              { header: "Status", accessor: (s) => <Badge tone={s.is_active ? "emerald" : "neutral"}>{s.is_active ? "Active" : "Inactive"}</Badge> },
            ]}
          />
        </GlassCard>
      )}

      {tab === "orders" && (
        <GlassCard className="p-6">
          <DataTable
            loading={loading}
            rows={purchaseOrders}
            keyField={(po) => po.id}
            emptyMessage="No purchase orders yet."
            columns={[
              { header: "PO #", accessor: (po) => <span className="font-medium text-white">{po.po_number}</span> },
              { header: "Supplier", accessor: (po) => po.supplier_name },
              { header: "Branch", accessor: (po) => po.branch_name },
              { header: "Status", accessor: (po) => <Badge tone={statusTone[po.status] || "neutral"}>{po.status.replace(/_/g, " ")}</Badge> },
              { header: "Total", accessor: (po) => formatCurrency(po.total_amount) },
              { header: "Balance due", accessor: (po) => formatCurrency(po.balance_due) },
              { header: "Ordered", accessor: (po) => formatDate(po.order_date) },
            ]}
          />
        </GlassCard>
      )}

      {tab === "dues" && (
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-2 text-amber-400">
            <Truck className="h-4 w-4" />
            <p className="text-sm">What the pharmacy currently owes each supplier.</p>
          </div>
          <DataTable
            loading={loading}
            rows={dues}
            keyField={(d) => d.supplier_id}
            emptyMessage="No outstanding balances."
            columns={[
              { header: "Supplier", accessor: (d) => <span className="font-medium text-white">{d.supplier_name}</span> },
              { header: "Total purchased", accessor: (d) => formatCurrency(d.total_purchased) },
              { header: "Total paid", accessor: (d) => formatCurrency(d.total_paid) },
              {
                header: "Balance due",
                accessor: (d) => (
                  <span className={d.balance_due > 0 ? "font-semibold text-amber-400" : "text-emerald-400"}>
                    {formatCurrency(d.balance_due)}
                  </span>
                ),
              },
            ]}
          />
        </GlassCard>
      )}

      {addOpen && <AddSupplierModal onClose={() => setAddOpen(false)} onCreated={load} />}
    </div>
  );
}

function AddSupplierModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/suppliers/suppliers/", form);
      toastSuccess("Supplier added.");
      onCreated();
      onClose();
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add a supplier">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Supplier name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Contact person</Label>
            <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <Button type="submit" className="w-full" loading={submitting}>
          Add supplier
        </Button>
      </form>
    </Modal>
  );
}

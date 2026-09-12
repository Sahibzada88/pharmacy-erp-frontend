"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import type { Customer } from "@/lib/types";

export default function CrmPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/crm/customers/", { params: { search: search || undefined, ordering: "name" } })
      .then((r) => setCustomers(r.data.results ?? r.data))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-100/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…" className="pl-10" />
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add customer
        </Button>
      </div>

      <GlassCard className="p-6">
        <DataTable
          loading={loading}
          rows={customers}
          keyField={(c) => c.id}
          emptyMessage="No customers registered yet."
          columns={[
            { header: "Customer", accessor: (c) => <span className="font-medium text-white">{c.name}</span> },
            { header: "Phone", accessor: (c) => c.phone },
            { header: "Branch", accessor: (c) => c.home_branch_name || "—" },
            { header: "Loyalty pts", accessor: (c) => <Badge tone="emerald">{c.loyalty_points}</Badge> },
            { header: "Lifetime spend", accessor: (c) => formatCurrency(c.lifetime_spend) },
          ]}
        />
      </GlassCard>

      {addOpen && <AddCustomerModal onClose={() => setAddOpen(false)} onCreated={load} />}
    </div>
  );
}

function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/crm/customers/", form);
      toastSuccess("Customer registered.");
      onCreated();
      onClose();
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Register a customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XXXXXXXXX" />
        </div>
        <div>
          <Label>Email (optional)</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <Button type="submit" className="w-full" loading={submitting}>
          Register customer
        </Button>
      </form>
    </Modal>
  );
}

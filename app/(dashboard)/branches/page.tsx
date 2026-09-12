"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Building2, MapPin, Users } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton, EmptyState } from "@/components/ui/Skeleton";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import type { Branch } from "@/lib/types";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/branches/").then((r) => setBranches(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(branch: Branch) {
    try {
      await api.patch(`/branches/${branch.id}/`, { is_active: !branch.is_active });
      toastSuccess(branch.is_active ? "Branch marked inactive." : "Branch reactivated.");
      load();
    } catch (err) {
      toastError(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink-100/50">
          <Building2 className="h-4 w-4" />
          <p className="text-sm">{branches.length} location{branches.length !== 1 ? "s" : ""} in the chain</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Open new branch
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <GlassCard className="p-10">
          <EmptyState message="No branches yet." hint="Open your first pharmacy branch to get started." />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <GlassCard key={b.id} edge className="flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg font-semibold text-white">{b.name}</p>
                  <p className="text-xs text-ink-100/45">{b.code}</p>
                </div>
                <Badge tone={b.is_active ? "emerald" : "neutral"}>{b.is_active ? "Active" : "Inactive"}</Badge>
              </div>

              <div className="space-y-1.5 text-sm text-ink-100/60">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{b.address || b.city || "No address set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>{b.staff_count} staff member{b.staff_count !== 1 ? "s" : ""}</span>
                </div>
              </div>

              <Button variant="secondary" size="sm" onClick={() => toggleActive(b)} className="mt-auto">
                {b.is_active ? "Mark inactive" : "Reactivate"}
              </Button>
            </GlassCard>
          ))}
        </div>
      )}

      {addOpen && <AddBranchModal onClose={() => setAddOpen(false)} onCreated={load} />}
    </div>
  );
}

function AddBranchModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", code: "", city: "", address: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/branches/", form);
      toastSuccess("Branch opened.");
      onCreated();
      onClose();
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Open a new branch">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Branch name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. North Town Branch" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Branch code</Label>
            <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. NTH-02" />
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Address</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <Button type="submit" className="w-full" loading={submitting}>
          Open branch
        </Button>
      </form>
    </Modal>
  );
}

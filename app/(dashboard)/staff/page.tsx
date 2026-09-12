"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, UserCog } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import type { User, Branch } from "@/lib/types";

const ROLE_TONE: Record<string, "emerald" | "amber" | "neutral" | "danger"> = {
  MANAGER: "emerald",
  CASHIER: "neutral",
  ACCOUNTANT: "amber",
  PHARMACIST: "amber",
};

export default function StaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/auth/staff/").then((r) => setStaff(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink-100/50">
          <UserCog className="h-4 w-4" />
          <p className="text-sm">
            {user?.role === "OWNER" ? "All staff across every branch." : "Staff at your branch."}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add staff
        </Button>
      </div>

      <GlassCard className="p-6">
        <DataTable
          loading={loading}
          rows={staff}
          keyField={(s) => s.id}
          emptyMessage="No staff accounts yet."
          columns={[
            {
              header: "Name",
              accessor: (s) => (
                <div>
                  <p className="font-medium text-white">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-ink-100/40">@{s.username}</p>
                </div>
              ),
            },
            { header: "Role", accessor: (s) => <Badge tone={ROLE_TONE[s.role] || "neutral"}>{ROLE_LABELS[s.role]}</Badge> },
            { header: "Branch", accessor: (s) => s.branch_name || "—" },
            { header: "Phone", accessor: (s) => s.phone || "—" },
            { header: "Status", accessor: (s) => <Badge tone={s.is_active_staff ? "emerald" : "danger"}>{s.is_active_staff ? "Active" : "Inactive"}</Badge> },
          ]}
        />
      </GlassCard>

      {addOpen && <AddStaffModal onClose={() => setAddOpen(false)} onCreated={load} />}
    </div>
  );
}

function AddStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "CASHIER",
    branch: "",
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
      const payload: any = { ...form };
      if (form.branch) payload.branch = Number(form.branch);
      else delete payload.branch;
      await api.post("/auth/staff/", payload);
      toastSuccess("Staff account created.");
      onCreated();
      onClose();
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add a staff member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>First name</Label>
            <Input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <Label>Last name</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Username</Label>
            <Input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <Label>Password</Label>
            <Input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="MANAGER" className="bg-ink-800">Branch Manager</option>
              <option value="CASHIER" className="bg-ink-800">Cashier</option>
              <option value="ACCOUNTANT" className="bg-ink-800">Accountant</option>
              <option value="PHARMACIST" className="bg-ink-800">Pharmacist</option>
            </Select>
          </div>
          {user?.role === "OWNER" && (
            <div>
              <Label>Branch</Label>
              <Select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                <option value="" className="bg-ink-800">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-ink-800">{b.name}</option>
                ))}
              </Select>
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
    </Modal>
  );
}

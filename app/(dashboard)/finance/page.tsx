"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Landmark, TrendingUp, TrendingDown } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useBranchFilter } from "../layout";
import { useAuth } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { StatTile } from "@/components/ui/StatTile";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import { formatCurrency, daysAgoISO, todayISO } from "@/lib/utils";

export default function FinancePage() {
  const { user } = useAuth();
  const { branchId } = useBranchFilter();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [pnl, setPnl] = useState<any | null>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [addBankOpen, setAddBankOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  const effectiveBranch = user?.role === "OWNER" || user?.role === "ACCOUNTANT" ? branchId : user?.branch ?? null;
  const canManage = user && ["OWNER", "ACCOUNTANT"].includes(user.role);
  const dateFrom = daysAgoISO(30);
  const dateTo = todayISO();

  const load = useCallback(() => {
    setLoading(true);
    if (tab === "overview") {
      Promise.allSettled([
        api.get("/analytics/finance/profit-and-loss/", { params: { branch: effectiveBranch ?? undefined, date_from: dateFrom, date_to: dateTo } }),
        api.get("/analytics/finance/bank-balance/", { params: { branch: effectiveBranch ?? undefined } }),
      ]).then(([pnlRes, bankRes]) => {
        if (pnlRes.status === "fulfilled") setPnl(pnlRes.value.data);
        if (bankRes.status === "fulfilled") setBankAccounts(bankRes.value.data.accounts);
        setLoading(false);
      });
    } else if (tab === "bank") {
      api.get("/finance/bank-accounts/").then((r) => setBankAccounts(r.data.results ?? r.data)).finally(() => setLoading(false));
    } else if (tab === "expenses") {
      api
        .get("/finance/expenses/", { params: { branch: effectiveBranch ?? undefined, ordering: "-expense_date" } })
        .then((r) => setExpenses(r.data.results ?? r.data))
        .finally(() => setLoading(false));
    }
  }, [tab, effectiveBranch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { key: "overview", label: "Overview" },
            { key: "bank", label: "Bank accounts" },
            { key: "expenses", label: "Expenses" },
          ]}
          active={tab}
          onChange={setTab}
        />
        {canManage && tab === "bank" && (
          <Button onClick={() => setAddBankOpen(true)}>
            <Plus className="h-4 w-4" /> Add bank account
          </Button>
        )}
        {canManage && tab === "expenses" && (
          <Button onClick={() => setAddExpenseOpen(true)}>
            <Plus className="h-4 w-4" /> Record expense
          </Button>
        )}
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          <p className="text-sm text-ink-100/45">Last 30 days · {effectiveBranch ? "selected branch" : "all branches"}</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatTile label="Net sales" value={pnl ? formatCurrency(pnl.summary.net_sales) : "—"} icon={TrendingUp} tone="emerald" />
            <StatTile label="Cost of goods" value={pnl ? formatCurrency(pnl.summary.cost_of_goods_sold) : "—"} icon={TrendingDown} tone="neutral" />
            <StatTile label="Gross profit" value={pnl ? formatCurrency(pnl.summary.gross_profit) : "—"} icon={TrendingUp} tone="emerald" />
            <StatTile label="Expenses" value={pnl ? formatCurrency(pnl.summary.total_expenses) : "—"} icon={TrendingDown} tone="amber" />
            <StatTile
              label="Net profit"
              value={pnl ? formatCurrency(pnl.summary.net_profit) : "—"}
              icon={pnl && pnl.summary.net_profit >= 0 ? TrendingUp : TrendingDown}
              tone={pnl && pnl.summary.net_profit >= 0 ? "emerald" : "danger"}
            />
          </div>

          <GlassCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-ink-100/50" />
              <h3 className="font-display text-base font-semibold text-white">Bank accounts (manual bookkeeping)</h3>
            </div>
            <DataTable
              loading={loading}
              rows={bankAccounts}
              keyField={(a) => a.bank_account_id ?? a.id}
              emptyMessage="No bank accounts added yet."
              columns={[
                { header: "Bank", accessor: (a) => <span className="font-medium text-white">{a.bank_name}</span> },
                { header: "Account #", accessor: (a) => a.account_number },
                { header: "Branch", accessor: (a) => a.branch_name },
                { header: "Balance", accessor: (a) => <span className="font-medium text-emerald-400">{formatCurrency(a.current_balance)}</span> },
              ]}
            />
          </GlassCard>
        </div>
      )}

      {tab === "bank" && (
        <GlassCard className="p-6">
          <p className="mb-4 text-sm text-ink-100/45">
            Manual bank bookkeeping — no live bank integration. Record deposits, payments and transfers via transactions.
          </p>
          <DataTable
            loading={loading}
            rows={bankAccounts}
            keyField={(a) => a.id}
            emptyMessage="No bank accounts added yet."
            columns={[
              { header: "Bank", accessor: (a) => <span className="font-medium text-white">{a.bank_name}</span> },
              { header: "Account title", accessor: (a) => a.account_title },
              { header: "Account #", accessor: (a) => a.account_number },
              { header: "Branch", accessor: (a) => a.branch_name },
              { header: "Balance", accessor: (a) => <span className="font-medium text-emerald-400">{formatCurrency(a.current_balance)}</span> },
              { header: "Status", accessor: (a) => <Badge tone={a.is_active ? "emerald" : "neutral"}>{a.is_active ? "Active" : "Inactive"}</Badge> },
            ]}
          />
        </GlassCard>
      )}

      {tab === "expenses" && (
        <GlassCard className="p-6">
          <DataTable
            loading={loading}
            rows={expenses}
            keyField={(e) => e.id}
            emptyMessage="No expenses recorded yet."
            columns={[
              { header: "Category", accessor: (e) => <span className="font-medium text-white">{e.category_name}</span> },
              { header: "Branch", accessor: (e) => e.branch_name },
              { header: "Description", accessor: (e) => e.description || "—" },
              { header: "Paid from", accessor: (e) => <Badge tone="neutral">{e.paid_from}</Badge> },
              { header: "Amount", accessor: (e) => formatCurrency(e.amount) },
              { header: "Date", accessor: (e) => e.expense_date },
            ]}
          />
        </GlassCard>
      )}

      {addBankOpen && <AddBankAccountModal onClose={() => setAddBankOpen(false)} onCreated={load} />}
      {addExpenseOpen && <AddExpenseModal onClose={() => setAddExpenseOpen(false)} onCreated={load} />}
    </div>
  );
}

function AddBankAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ bank_name: "", account_title: "", account_number: "", iban: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/finance/bank-accounts/", form);
      toastSuccess("Bank account added.");
      onCreated();
      onClose();
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add a bank account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Bank name</Label>
          <Input required value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="e.g. Meezan Bank" />
        </div>
        <div>
          <Label>Account title</Label>
          <Input required value={form.account_title} onChange={(e) => setForm({ ...form, account_title: e.target.value })} />
        </div>
        <div>
          <Label>Account number</Label>
          <Input required value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
        </div>
        <Button type="submit" className="w-full" loading={submitting}>
          Add account
        </Button>
      </form>
    </Modal>
  );
}

function AddExpenseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ category: "", amount: "", paid_from: "CASH", description: "" });
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/finance/expense-categories/").then((r) => setCategories(r.data.results ?? r.data));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/finance/expenses/", { ...form, category: Number(form.category) });
      toastSuccess("Expense recorded.");
      onCreated();
      onClose();
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Record an expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Category</Label>
          <Select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="" className="bg-ink-800">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-ink-800">{c.name}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Amount</Label>
            <Input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <Label>Paid from</Label>
            <Select value={form.paid_from} onChange={(e) => setForm({ ...form, paid_from: e.target.value })}>
              <option value="CASH" className="bg-ink-800">Cash register</option>
              <option value="BANK" className="bg-ink-800">Bank account</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Monthly shop rent" />
        </div>
        <Button type="submit" className="w-full" loading={submitting}>
          Record expense
        </Button>
      </form>
    </Modal>
  );
}

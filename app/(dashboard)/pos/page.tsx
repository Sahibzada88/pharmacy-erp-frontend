"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, apiErrorMessage } from "@/lib/api";
import { useBranchFilter } from "../layout";
import { MedicineSearch } from "@/components/pos/MedicineSearch";
import { PosCart } from "@/components/pos/PosCart";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import type { CartLine, Medicine, Batch, Sale } from "@/lib/types";

export default function PosPage() {
  const { user } = useAuth();
  const { branchId } = useBranchFilter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const effectiveBranchId = user?.role === "OWNER" ? branchId : user?.branch ?? null;
  const ownerNeedsBranch = (user?.role === "OWNER") && !effectiveBranchId;

  function handleAdd(med: Medicine, batch: Batch) {
    setLines((prev) => {
      const existing = prev.find((l) => l.batch_id === batch.id);
      if (existing) {
        if (existing.quantity >= batch.quantity_remaining) return prev;
        return prev.map((l) =>
          l.batch_id === batch.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          medicine_id: med.id,
          medicine_name: med.name,
          batch_id: batch.id,
          available_qty: batch.quantity_remaining,
          unit_price: parseFloat(batch.sale_price),
          quantity: 1,
          discount_amount: 0,
        },
      ];
    });
  }

  function handleUpdateQty(batchId: number, qty: number) {
    setLines((prev) => prev.map((l) => (l.batch_id === batchId ? { ...l, quantity: qty } : l)));
  }

  function handleRemove(batchId: number) {
    setLines((prev) => prev.filter((l) => l.batch_id !== batchId));
  }

  async function handleCheckout(payments: { method: string; amount: number }[]) {
    setSubmitting(true);
    try {
      const payload: any = {
        items: lines.map((l) => ({
          medicine_id: l.medicine_id,
          quantity: l.quantity,
          batch_id: l.batch_id,
          discount_amount: l.discount_amount,
        })),
        payments: payments.map((p) => ({ method: p.method, amount: p.amount.toFixed(2) })),
      };
      if (user?.role === "OWNER" && branchId) payload.branch = branchId;

      const { data } = await api.post<Sale>("/sales/checkout/", payload);
      setLastSale(data);
      setLines([]);
      toastSuccess(`Sale completed — invoice ${data.invoice_number}`);
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (ownerNeedsBranch) {
    return (
      <GlassCard className="mx-auto max-w-md p-8 text-center">
        <p className="text-sm text-ink-100/60">
          Select a branch from the switcher above to operate the POS as owner.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="min-h-[600px]">
        <MedicineSearch branchId={effectiveBranchId} onAdd={handleAdd} />
      </div>
      <div className="min-h-[600px]">
        <PosCart
          lines={lines}
          onUpdateQty={handleUpdateQty}
          onRemove={handleRemove}
          onCheckout={handleCheckout}
          submitting={submitting}
        />
      </div>

      {lastSale && (
        <ReceiptModal sale={lastSale} onClose={() => setLastSale(null)} />
      )}
    </div>
  );
}

function ReceiptModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm" onClick={onClose} />
      <GlassCard strong edge className="relative w-full max-w-sm p-6 text-center animate-fade-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <h3 className="font-display text-lg font-semibold text-white">Sale completed</h3>
        <p className="mt-1 text-sm text-ink-100/50">Invoice {sale.invoice_number}</p>
        <p className="mt-4 font-display text-3xl font-semibold text-white">
          {formatCurrency(sale.total_amount)}
        </p>
        <div className="mt-5 space-y-1.5 rounded-xl bg-white/5 p-3 text-left">
          {sale.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-ink-100/70">
                {item.medicine_name_snapshot} × {item.quantity}
              </span>
              <span className="text-white">{formatCurrency(item.line_total)}</span>
            </div>
          ))}
        </div>
        <Button className="mt-5 w-full" onClick={onClose}>
          New sale
        </Button>
      </GlassCard>
    </div>
  );
}

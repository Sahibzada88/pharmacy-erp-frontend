"use client";

import React, { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { api, apiErrorMessage } from "@/lib/api";
import { useBranchFilter } from "../layout";
import { MedicineSearch } from "@/components/pos/MedicineSearch";
import { PosCart } from "@/components/pos/PosCart";
import { InvoiceReceipt } from "@/components/pos/InvoiceReceipt";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { toastSuccess, toastError } from "@/components/ui/Toast";
import type { CartLine, Medicine, Batch, Sale } from "@/lib/types";

export default function PosPage() {
  const { user } = useAuth();
  const { branchId } = useBranchFilter();
  const { t } = useLanguage();
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
          {t("pos.selectBranchFirst")}
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="min-h-[600px]" data-tour="pos-search">
        <MedicineSearch branchId={effectiveBranchId} onAdd={handleAdd} />
      </div>
      <div className="min-h-[600px]" data-tour="pos-cart">
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
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-fade-up">
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-white/60 hover:text-white"
        >
          <X className="h-4 w-4" /> {t("common.close")}
        </button>

        <div className="mb-4 flex items-center justify-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">{t("pos.saleCompleted")}</span>
        </div>

        <InvoiceReceipt sale={sale} compact />

        <Button variant="secondary" className="mt-3 w-full" onClick={onClose}>
          {t("pos.newSale")}
        </Button>
      </div>
    </div>
  );
}

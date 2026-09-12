"use client";

import React, { useMemo, useState } from "react";
import { Trash2, Plus, Minus, Banknote, CreditCard, Landmark, Smartphone, Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatCurrency } from "@/lib/utils";
import type { CartLine } from "@/lib/types";

interface PaymentSplit {
  method: string;
  amount: number;
}

const METHODS = [
  { key: "CASH", label: "Cash", icon: Banknote },
  { key: "CARD", label: "Card", icon: CreditCard },
  { key: "BANK_TRANSFER", label: "Bank transfer", icon: Landmark },
  { key: "MOBILE_WALLET", label: "Mobile wallet", icon: Smartphone },
];

interface PosCartProps {
  lines: CartLine[];
  onUpdateQty: (batchId: number, qty: number) => void;
  onRemove: (batchId: number) => void;
  onCheckout: (payments: PaymentSplit[]) => Promise<void>;
  submitting: boolean;
}

export function PosCart({ lines, onUpdateQty, onRemove, onCheckout, submitting }: PosCartProps) {
  const [method, setMethod] = useState("CASH");

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.unit_price * l.quantity - l.discount_amount, 0),
    [lines]
  );

  async function handleCheckout() {
    if (lines.length === 0) return;
    await onCheckout([{ method, amount: Math.round(subtotal * 100) / 100 }]);
  }

  return (
    <GlassCard edge className="flex h-full flex-col p-5">
      <div className="mb-4 flex items-center gap-2">
        <Receipt className="h-4 w-4 text-ink-100/50" />
        <h3 className="font-display text-base font-semibold text-white">Current sale</h3>
        {lines.length > 0 && (
          <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            {lines.length} item{lines.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-none">
        {lines.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
            <Receipt className="h-8 w-8 text-white/15" />
            <p className="text-sm text-ink-100/40">Cart is empty. Search a medicine to add it.</p>
          </div>
        ) : (
          lines.map((line) => (
            <div key={line.batch_id} className="rounded-xl bg-white/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{line.medicine_name}</p>
                  <p className="text-xs text-ink-100/40">{formatCurrency(line.unit_price)} each</p>
                </div>
                <button
                  onClick={() => onRemove(line.batch_id)}
                  className="shrink-0 rounded-lg p-1 text-ink-100/30 hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
                  <button
                    onClick={() => onUpdateQty(line.batch_id, Math.max(1, line.quantity - 1))}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-white/60 hover:bg-white/10"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-white">{line.quantity}</span>
                  <button
                    onClick={() => onUpdateQty(line.batch_id, Math.min(line.available_qty, line.quantity + 1))}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-white/60 hover:bg-white/10"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="font-display text-sm font-semibold text-white">
                  {formatCurrency(line.unit_price * line.quantity - line.discount_amount)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-100/60">Total</span>
          <span className="font-display text-2xl font-semibold text-white">{formatCurrency(subtotal)}</span>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-ink-100/50">Payment method</p>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-400"
                      : "border-white/10 bg-white/5 text-ink-100/60 hover:bg-white/8"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={lines.length === 0}
          loading={submitting}
          onClick={handleCheckout}
        >
          Complete sale · {formatCurrency(subtotal)}
        </Button>
      </div>
    </GlassCard>
  );
}

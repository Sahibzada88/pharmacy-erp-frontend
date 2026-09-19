"use client";

import React, { useState } from "react";
import { Printer, Download } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { downloadInvoicePdf, printInvoicePdf } from "@/lib/pdf";
import type { Sale } from "@/lib/types";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  MOBILE_WALLET: "Mobile wallet",
  CREDIT: "Store credit",
};

const STATUS_TONE: Record<string, "emerald" | "amber" | "danger" | "neutral"> = {
  COMPLETED: "emerald",
  PARTIALLY_RETURNED: "amber",
  RETURNED: "danger",
  VOIDED: "neutral",
};

interface InvoiceReceiptProps {
  sale: Sale;
  /** Compact mode is used inside the "sale completed" checkout modal. */
  compact?: boolean;
}

export function InvoiceReceipt({ sale, compact = false }: InvoiceReceiptProps) {
  const { t } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      downloadInvoicePdf(sale);
    } finally {
      setDownloading(false);
    }
  }

  async function handlePrint() {
    setPrinting(true);
    try {
      printInvoicePdf(sale);
    } finally {
      setPrinting(false);
    }
  }

  return (
    <GlassCard edge className={compact ? "p-6" : "p-8"}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold text-white">{sale.invoice_number}</p>
          <p className="mt-0.5 text-xs text-ink-100/45">
            {sale.branch_name} · {formatDateTime(sale.created_at)}
          </p>
        </div>
        <Badge tone={STATUS_TONE[sale.status] || "neutral"}>{sale.status.replace(/_/g, " ")}</Badge>
      </div>

      {!compact && (
        <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl bg-white/5 p-4 text-sm">
          <div>
            <p className="text-xs text-ink-100/45">Served by</p>
            <p className="mt-0.5 font-medium text-white">{sale.cashier_name}</p>
          </div>
          <div>
            <p className="text-xs text-ink-100/45">Customer</p>
            <p className="mt-0.5 font-medium text-white">{sale.customer_name || "Walk-in customer"}</p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {sale.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate text-white/90">{item.medicine_name_snapshot}</p>
              <p className="text-xs text-ink-100/40">
                {item.quantity - item.quantity_returned} × {formatCurrency(item.unit_price)}
                {parseFloat(item.discount_amount) > 0 && ` · -${formatCurrency(item.discount_amount)} off`}
              </p>
            </div>
            <p className="shrink-0 font-medium text-white">{formatCurrency(item.line_total)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
        <Row label="Subtotal" value={formatCurrency(sale.subtotal)} />
        {parseFloat(sale.discount_amount) > 0 && (
          <Row label="Discount" value={`- ${formatCurrency(sale.discount_amount)}`} />
        )}
        {parseFloat(sale.tax_amount) > 0 && <Row label="Tax" value={formatCurrency(sale.tax_amount)} />}
        <div className="flex items-center justify-between pt-2">
          <span className="font-display text-base font-semibold text-white">Total paid</span>
          <span className="font-display text-xl font-semibold text-emerald-400">
            {formatCurrency(sale.total_amount)}
          </span>
        </div>
      </div>

      {sale.payments.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {sale.payments.map((p) => (
            <Badge key={p.id} tone="neutral">
              {METHOD_LABELS[p.method] || p.method} · {formatCurrency(p.amount)}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={handlePrint} loading={printing}>
          <Printer className="h-4 w-4" /> {t("pos.print")}
        </Button>
        <Button className="flex-1" onClick={handleDownload} loading={downloading}>
          <Download className="h-4 w-4" /> {t("pos.downloadPdf")}
        </Button>
      </div>
    </GlassCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-ink-100/60">
      <span>{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}

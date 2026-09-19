"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { InvoiceReceipt } from "@/components/pos/InvoiceReceipt";
import { Skeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/GlassCard";
import { toastError } from "@/components/ui/Toast";
import type { Sale } from "@/lib/types";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    api
      .get<Sale>(`/sales/invoices/${id}/`)
      .then((res) => setSale(res.data))
      .catch((err) => {
        setNotFound(true);
        toastError(apiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [params]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button
        onClick={() => router.push("/invoices")}
        className="flex items-center gap-1.5 text-sm text-ink-100/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </button>

      {loading ? (
        <GlassCard className="p-8">
          <Skeleton className="h-6 w-40" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </GlassCard>
      ) : notFound || !sale ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm text-ink-100/60">This invoice could not be found.</p>
        </GlassCard>
      ) : (
        <InvoiceReceipt sale={sale} />
      )}
    </div>
  );
}

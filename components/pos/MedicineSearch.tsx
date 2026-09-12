"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, Package } from "lucide-react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Skeleton, EmptyState } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import type { Medicine, Batch } from "@/lib/types";

interface MedicineSearchProps {
  branchId: number | null;
  onAdd: (medicine: Medicine, batch: Batch) => void;
}

export function MedicineSearch({ branchId, onAdd }: MedicineSearchProps) {
  const [query, setQuery] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchCache, setBatchCache] = useState<Record<number, Batch[]>>({});

  const search = useCallback(
    (q: string) => {
      setLoading(true);
      api
        .get("/inventory/medicines/", {
          params: { search: q || undefined, is_active: true, ordering: "name", branch: branchId ?? undefined },
        })
        .then((res) => setMedicines(res.data.results ?? res.data))
        .finally(() => setLoading(false));
    },
    [branchId]
  );

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  async function handlePick(med: Medicine) {
    let batches = batchCache[med.id];
    if (!batches) {
      const res = await api.get("/inventory/batches/", {
        params: { medicine: med.id, branch: branchId ?? undefined, is_active: true, ordering: "expiry_date" },
      });
      batches = (res.data.results ?? res.data).filter((b: Batch) => b.quantity_remaining > 0);
      setBatchCache((c) => ({ ...c, [med.id]: batches }));
    }
    if (batches.length === 0) return;
    onAdd(med, batches[0]); // FEFO — soonest-expiring batch first, matches backend logic
  }

  return (
    <GlassCard className="flex h-full flex-col p-5">
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-100/40" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medicine by name, generic name, SKU or barcode…"
          className="pl-10"
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1 scrollbar-none">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : medicines.length === 0 ? (
          <EmptyState message="No medicines found" hint="Try a different name, SKU, or barcode." />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {medicines.map((med) => (
              <button
                key={med.id}
                onClick={() => handlePick(med)}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-white/8 bg-white/5 p-4 text-left transition-all hover:border-emerald-400/40 hover:bg-white/8"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                  <Package className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{med.name}</p>
                  <p className="text-xs text-ink-100/40">{med.pack_size || med.unit_type}</p>
                </div>
                <span className="mt-auto text-xs font-medium text-ink-100/50">
                  {med.total_stock > 0 ? `${med.total_stock} in stock` : "Out of stock"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

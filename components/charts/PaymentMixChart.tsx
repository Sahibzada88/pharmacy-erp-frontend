"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MethodRow {
  method: string;
  total_amount: number;
  transaction_count: number;
}

const COLORS = ["#0F9D74", "#E8A33D", "#2AB98A", "#B8F1DE", "#E0574C"];

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  MOBILE_WALLET: "Mobile wallet",
  CREDIT: "Store credit",
};

export function PaymentMixChart({ data }: { data: MethodRow[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-ink-100/40">
        No payments recorded in this period
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total_amount"
          nameKey="method"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "rgba(11,18,32,0.92)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(value: number, _n, entry: any) => [
            formatCurrency(value),
            METHOD_LABELS[entry.payload.method] || entry.payload.method,
          ]}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              {METHOD_LABELS[value] || value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface TrendPoint {
  sale_date: string;
  net_sales: number;
  gross_profit: number;
}

export function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F9D74" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#0F9D74" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8A33D" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#E8A33D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="sale_date"
          tickFormatter={(v) => format(parseISO(v), "d MMM")}
          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(11,18,32,0.92)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "rgba(255,255,255,0.5)" }}
          formatter={(value: number, name: string) => [
            formatCurrency(value),
            name === "net_sales" ? "Net sales" : "Gross profit",
          ]}
          labelFormatter={(v) => format(parseISO(v as string), "d MMM yyyy")}
        />
        <Area
          type="monotone"
          dataKey="net_sales"
          stroke="#2AB98A"
          strokeWidth={2}
          fill="url(#salesFill)"
        />
        <Area
          type="monotone"
          dataKey="gross_profit"
          stroke="#EDB35C"
          strokeWidth={2}
          fill="url(#profitFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

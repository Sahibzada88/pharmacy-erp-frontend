"use client";

import React, { useEffect } from "react";
import { create } from "zustand";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, type: "success" | "error") => void;
  dismiss: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, type) =>
    set((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), message, type }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toastSuccess(message: string) {
  useToastStore.getState().push(message, "success");
}
export function toastError(message: string) {
  useToastStore.getState().push(message, "error");
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), 4500));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "glass-strong pointer-events-auto flex w-80 items-start gap-3 rounded-2xl p-4 shadow-glass animate-fade-up",
            "border",
            t.type === "success" ? "border-emerald-500/30" : "border-danger/30"
          )}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          )}
          <p className="flex-1 text-sm text-white/90">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="text-white/40 hover:text-white/80">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

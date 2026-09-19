"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toastError, toastSuccess } from "@/components/ui/Toast";

interface BulkImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface JobStatusResponse {
  job_id: number;
  status: JobStatus;
  created_medicines: number;
  updated_medicines: number;
  created_batches: number;
  total_rows: number;
  error_count: number;
  errors: { row: number; error: string }[];
  failure_reason: string;
}

const POLL_INTERVAL_MS = 1500;

const TEMPLATE_HEADERS = [
  "name",
  "generic_name",
  "sku",
  "barcode",
  "category",
  "manufacturer",
  "unit_type",
  "pack_size",
  "reorder_level",
  "requires_prescription",
  "branch_code",
  "batch_number",
  "quantity",
  "cost_price",
  "sale_price",
  "expiry_date",
];

const TEMPLATE_EXAMPLE_ROWS = [
  [
    "Panadol 500mg", "Paracetamol", "PAN-500", "8964000123456", "Analgesics", "GSK",
    "TABLET", "10 tablets/strip", "20", "FALSE",
    "MAIN-01", "", "500", "8.50", "12.00", "2027-12-31",
  ],
  [
    "Augmentin 625mg", "Amoxicillin+Clavulanate", "AUG-625", "", "Antibiotics", "GSK",
    "TABLET", "6 tablets/strip", "15", "TRUE",
    "", "", "", "", "", "",
  ],
];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS];
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "medicines-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function BulkImportModal({ onClose, onImported }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false); // true only for the initial upload POST
  const [jobId, setJobId] = useState<number | null>(null);
  const [result, setResult] = useState<JobStatusResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const isProcessing = jobId !== null && (!result || result.status === "PENDING" || result.status === "PROCESSING");

  const pollStatus = useCallback((id: number) => {
    pollTimer.current = setInterval(async () => {
      try {
        const { data } = await api.get<JobStatusResponse>(`/inventory/medicines/bulk-import/${id}/status/`);
        setResult(data);
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          clearInterval(pollTimer.current);
          if (data.status === "COMPLETED" && data.error_count === 0) {
            toastSuccess(`Imported ${data.created_medicines + data.updated_medicines} medicines successfully.`);
          } else if (data.status === "FAILED") {
            toastError(data.failure_reason || "Import failed unexpectedly.");
          }
          onImported(); // refresh the medicines list with whatever succeeded so far
        }
      } catch (err) {
        clearInterval(pollTimer.current);
        toastError(apiErrorMessage(err));
      }
    }, POLL_INTERVAL_MS);
  }, [onImported]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  async function handleUpload() {
    if (!file) return;
    setSubmitting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // Fires the import and returns immediately (202) — the actual row-by-row
      // work happens in a background thread on the server, so this request
      // never blocks other API calls while a large catalog is importing.
      const { data } = await api.post<{ job_id: number; status: JobStatus }>(
        "/inventory/medicines/bulk-import/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setJobId(data.job_id);
      pollStatus(data.job_id);
    } catch (err) {
      toastError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const isDone = result?.status === "COMPLETED" || result?.status === "FAILED";

  return (
    <Modal open onClose={onClose} title="Bulk import medicines" width="max-w-xl">
      <div className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="text-sm text-ink-100/70">
              <p className="mb-1 font-medium text-white">How it works</p>
              <p>
                Download the template, fill in your medicines in Excel or Google Sheets, save as{" "}
                <span className="text-white/90">CSV</span>, then upload it here. Large files are
                processed in the background — feel free to keep using the app while it imports.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-ink-100/50">
                <li><span className="text-white/70">name</span> and <span className="text-white/70">sku</span> are required — everything else is optional.</li>
                <li>Re-uploading the same SKU later updates that medicine instead of duplicating it.</li>
                <li>
                  To also set opening stock, fill in <span className="text-white/70">branch_code</span>,{" "}
                  <span className="text-white/70">quantity</span>, <span className="text-white/70">cost_price</span>,{" "}
                  <span className="text-white/70">sale_price</span> and <span className="text-white/70">expiry_date</span> together
                  (leave all five blank to import the medicine without stock).
                </li>
              </ul>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="mt-3" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5" /> Download CSV template
          </Button>
        </div>

        {!jobId && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/5 px-4 py-8 text-center transition-colors hover:border-emerald-400/40 hover:bg-white/8"
            >
              <Upload className="h-6 w-6 text-ink-100/40" />
              {file ? (
                <p className="text-sm font-medium text-white">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-white">Click to choose a CSV file</p>
                  <p className="text-xs text-ink-100/40">or drag and drop</p>
                </>
              )}
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-white">Importing in the background…</p>
              <p className="text-xs text-ink-100/50">
                You can close this window — the import keeps running, and your medicines list will
                update automatically. Come back anytime to check progress.
              </p>
            </div>
          </div>
        )}

        {result && isDone && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
            {result.status === "FAILED" ? (
              <div className="flex items-center gap-2 text-sm text-danger">
                <AlertCircle className="h-4 w-4" /> Import failed: {result.failure_reason || "Unknown error"}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="emerald">{result.created_medicines} created</Badge>
                  <Badge tone="neutral">{result.updated_medicines} updated</Badge>
                  <Badge tone="amber">{result.created_batches} opening batches</Badge>
                  {result.error_count > 0 && <Badge tone="danger">{result.error_count} errors</Badge>}
                </div>

                {result.error_count === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> All rows imported successfully.
                  </div>
                ) : (
                  <div className="max-h-48 space-y-1.5 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg bg-danger/10 p-2 text-xs">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                        <span className="text-white/80">
                          <span className="font-medium text-danger">Row {e.row}:</span> {e.error}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {isDone || !jobId ? "Cancel" : "Close (keeps importing)"}
          </Button>
          {!jobId && (
            <Button className="flex-1" onClick={handleUpload} loading={submitting} disabled={!file}>
              Upload &amp; import
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}


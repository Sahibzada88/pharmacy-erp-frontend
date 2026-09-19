import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDateTime } from "./utils";
import type { Sale } from "./types";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  MOBILE_WALLET: "Mobile wallet",
  CREDIT: "Store credit",
};

/**
 * Builds a clean, text-based invoice PDF (no screenshot/canvas rendering —
 * crisp at any zoom, small file size, prints reliably on thermal or A4).
 * Returns the jsPDF instance so callers can either .save() (download) or
 * open it in a new tab for printing.
 */
export function buildInvoicePdf(sale: Sale): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 50;

  // ---- Header ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 157, 116); // emerald
  doc.text("Rahat Pharmacy", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 107, 125);
  doc.text(sale.branch_name || "", marginX, y + 16);

  doc.setFontSize(20);
  doc.setTextColor(20, 29, 43);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 555, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 107, 125);
  doc.text(sale.invoice_number, 555, y + 16, { align: "right" });
  doc.text(formatDateTime(sale.created_at), 555, y + 30, { align: "right" });

  y += 55;
  doc.setDrawColor(225, 229, 233);
  doc.line(marginX, y, 555, y);
  y += 25;

  // ---- Meta: cashier / customer ----
  doc.setFontSize(10);
  doc.setTextColor(90, 107, 125);
  doc.text("Served by", marginX, y);
  doc.text("Customer", 300, y);
  doc.setTextColor(20, 29, 43);
  doc.setFont("helvetica", "bold");
  doc.text(sale.cashier_name || "-", marginX, y + 14);
  doc.text(sale.customer_name || "Walk-in customer", 300, y + 14);
  doc.setFont("helvetica", "normal");

  y += 40;

  // ---- Line items table ----
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: 40 },
    head: [["Medicine", "Qty", "Unit price", "Discount", "Line total"]],
    body: sale.items.map((item) => [
      item.medicine_name_snapshot,
      String(item.quantity - item.quantity_returned),
      formatCurrency(item.unit_price),
      formatCurrency(item.discount_amount),
      formatCurrency(item.line_total),
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: [20, 29, 43] },
    headStyles: { fillColor: [15, 157, 116], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 248, 247] },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  // @ts-expect-error - jspdf-autotable augments doc with lastAutoTable at runtime
  y = doc.lastAutoTable.finalY + 25;

  // ---- Totals block ----
  const totalsX = 360;
  const rows: [string, string][] = [
    ["Subtotal", formatCurrency(sale.subtotal)],
    ["Discount", `- ${formatCurrency(sale.discount_amount)}`],
    ["Tax", formatCurrency(sale.tax_amount)],
  ];
  doc.setFontSize(10);
  rows.forEach(([label, value], i) => {
    doc.setTextColor(90, 107, 125);
    doc.text(label, totalsX, y + i * 16);
    doc.setTextColor(20, 29, 43);
    doc.text(value, 555, y + i * 16, { align: "right" });
  });

  y += rows.length * 16 + 8;
  doc.setDrawColor(225, 229, 233);
  doc.line(totalsX, y, 555, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 157, 116);
  doc.text("Total paid", totalsX, y);
  doc.text(formatCurrency(sale.total_amount), 555, y, { align: "right" });
  doc.setFont("helvetica", "normal");

  y += 30;

  // ---- Payments ----
  if (sale.payments.length) {
    doc.setFontSize(10);
    doc.setTextColor(90, 107, 125);
    doc.text("Paid via:", marginX, y);
    doc.setTextColor(20, 29, 43);
    const paymentText = sale.payments
      .map((p) => `${METHOD_LABELS[p.method] || p.method} (${formatCurrency(p.amount)})`)
      .join("  ·  ");
    doc.text(paymentText, marginX + 55, y);
    y += 25;
  }

  // ---- Footer ----
  doc.setFontSize(8.5);
  doc.setTextColor(140, 152, 164);
  doc.text(
    "Thank you for choosing Rahat Pharmacy. Please retain this invoice for warranty/return purposes.",
    marginX,
    780
  );

  return doc;
}

/** Triggers a browser download of the invoice as a PDF file. */
export function downloadInvoicePdf(sale: Sale) {
  const doc = buildInvoicePdf(sale);
  doc.save(`Invoice-${sale.invoice_number}.pdf`);
}

/** Opens the invoice PDF in a new tab, ready for the browser's print dialog. */
export function printInvoicePdf(sale: Sale) {
  const doc = buildInvoicePdf(sale);
  doc.autoPrint();
  const blobUrl = doc.output("bloburl");
  window.open(blobUrl, "_blank");
}

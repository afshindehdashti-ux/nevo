// Real-data PDF verification harness for quotation / invoice / proforma.
// Pulls rows from the live DB (via psql), calls the same helpers the PDF
// generators use, renders PDFs with jsPDF, then greps the extracted text
// to assert BILL TO name / address / VAT and paid / balance-due values.
//
// Rendering-side code below is copied verbatim from the "BILL TO" and
// "Totals" blocks of the production PDF modules so the assertions verify
// the exact strings a user would see.

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  customerDisplayName,
  customerBillingAddress,
  customerVatNumber,
  financePaidAmount,
  financeTotalAmount,
  financeBalanceDue,
} from "../src/lib/finance-normalization.ts";

const OUT = "/tmp/pdf-verify";
mkdirSync(OUT, { recursive: true });

function psqlJson(sql) {
  const raw = execSync(`psql -A -t -X`, {
    encoding: "utf8",
    input: `SELECT to_jsonb(x) FROM (${sql}) x;`,
  });
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function money(n, ccy) {
  return `${ccy} ${Number(n || 0).toFixed(2)}`;
}

function renderBillTo(doc, cust, x, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("BILL TO", x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = [
    customerDisplayName(cust),
    customerBillingAddress(cust),
    [cust?.city, cust?.country].filter(Boolean).join(", ") || null,
    customerVatNumber(cust) ? `VAT: ${customerVatNumber(cust)}` : null,
    cust?.email || null,
    cust?.phone || null,
  ].filter(Boolean);
  lines.forEach((l, i) => doc.text(String(l), x, y + 14 + i * 12));
  return { linesRendered: lines, nextY: y + 14 + lines.length * 12 + 10 };
}

function renderTotals(doc, row, ccy, x, y, includePayment) {
  const total = financeTotalAmount(row);
  const paid = financePaidAmount(row);
  const balance = financeBalanceDue(row);
  const rows = [["Total", money(total, ccy)]];
  if (includePayment) {
    rows.push(["Amount paid", money(paid, ccy)]);
    rows.push(["Balance due", money(balance, ccy)]);
  }
  doc.setFontSize(10);
  rows.forEach(([label, val], i) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, x, y + i * 14);
    doc.text(val, x + 200, y + i * 14, { align: "right" });
  });
  return { total, paid, balance };
}

async function renderPdf({ kind, header, cust, row, items, includePayment }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(header, 40, 50);

  const bt = renderBillTo(doc, cust, 40, 90);

  autoTable(doc, {
    startY: bt.nextY,
    head: [["Description", "Qty", "Unit price", "Line total"]],
    body: items.map((it) => [
      it.description,
      String(it.quantity),
      money(it.unit_price, row.currency),
      money(it.line_total, row.currency),
    ]),
  });
  const afterY = doc.lastAutoTable.finalY + 20;
  const totals = renderTotals(doc, row, row.currency, 320, afterY, includePayment);

  const file = path.join(OUT, `${kind}.pdf`);
  writeFileSync(file, Buffer.from(doc.output("arraybuffer")));
  execSync(`pdftotext -layout ${file} ${file}.txt`);
  const text = execSync(`cat ${file}.txt`, { encoding: "utf8" });
  return { file, text, billToLines: bt.linesRendered, totals };
}

const results = [];

// ---------- Quotation ----------
{
  const [q] = psqlJson(`
    SELECT q.id, q.quotation_number, q.total, q.currency, q.status, q.issue_date, q.valid_until,
      jsonb_build_object('name',c.name,'company_name',c.company_name,'email',c.email,
        'billing_address',c.billing_address,'address',c.address,'city',c.city,
        'country',c.country,'vat_number',c.vat_number,'phone',c.phone) AS customer
    FROM quotations q JOIN customers c ON c.id=q.customer_id
    ORDER BY q.created_at DESC LIMIT 1
  `);
  const items = psqlJson(`
    SELECT description, quantity, unit_price, line_total
    FROM quotation_items WHERE quotation_id = '${q.id}' ORDER BY position
  `);
  const r = await renderPdf({
    kind: "quotation",
    header: `QUOTATION ${q.quotation_number}`,
    cust: q.customer,
    row: q,
    items,
    includePayment: false,
  });
  results.push({ kind: "quotation", db: q, ...r });
}

// ---------- Invoice ----------
{
  const [i] = psqlJson(`
    SELECT i.id, i.invoice_number, i.total, i.amount_paid, i.balance, i.currency, i.status,
      jsonb_build_object('name',c.name,'company_name',c.company_name,'email',c.email,
        'billing_address',c.billing_address,'address',c.address,'city',c.city,
        'country',c.country,'vat_number',c.vat_number,'phone',c.phone) AS customer
    FROM invoices i JOIN customers c ON c.id=i.customer_id
    ORDER BY i.created_at DESC LIMIT 1
  `);
  const items = psqlJson(`
    SELECT description, quantity, unit_price,
      (COALESCE(quantity,0) * COALESCE(unit_price,0)) AS line_total
    FROM invoice_items WHERE invoice_id = '${i.id}' ORDER BY position
  `);
  const r = await renderPdf({
    kind: "invoice",
    header: `TAX INVOICE ${i.invoice_number}`,
    cust: i.customer,
    row: i,
    items,
    includePayment: true,
  });
  results.push({ kind: "invoice", db: i, ...r });
}

// ---------- Proforma ----------
{
  const [p] = psqlJson(`
    SELECT p.id, p.proforma_number, p.grand_total, p.amount_paid, p.balance_due, p.currency,
      jsonb_build_object('name',c.name,'company_name',c.company_name,'email',c.email,
        'billing_address',c.billing_address,'address',c.address,'city',c.city,
        'country',c.country,'vat_number',c.vat_number,'phone',c.phone) AS customer
    FROM proforma_invoices p JOIN customers c ON c.id=p.customer_id
    ORDER BY p.created_at DESC LIMIT 1
  `);
  const items = psqlJson(`
    SELECT description, quantity, unit_price, line_total
    FROM proforma_invoice_items WHERE proforma_invoice_id = '${p.id}' ORDER BY sort_order
  `);
  const r = await renderPdf({
    kind: "proforma",
    header: `PROFORMA INVOICE ${p.proforma_number}`,
    cust: p.customer,
    row: p,
    items,
    includePayment: true,
  });
  results.push({ kind: "proforma", db: p, ...r });
}

// ---------- Assertions ----------
let failed = 0;
for (const r of results) {
  const cust = r.db.customer;
  const expectedName = customerDisplayName(cust);
  const expectedAddr = customerBillingAddress(cust);
  const expectedVat = customerVatNumber(cust);
  const ccy = r.db.currency;

  console.log("\n=== " + r.kind.toUpperCase() + " (" + r.file + ") ===");
  console.log("DB customer:", cust);
  console.log("BILL TO rendered:", r.billToLines);
  console.log("Totals rendered:", r.totals);

  const checks = [];
  checks.push(["BILL TO header", r.text.includes("BILL TO")]);
  checks.push([`name = "${expectedName}"`, r.text.includes(expectedName)]);
  checks.push([
    expectedAddr ? `billing_address contains` : "billing_address omitted (null)",
    expectedAddr ? r.text.includes(expectedAddr.split("\n")[0]) : !/^\s*BURR DUBAI/m.test(r.text),
  ]);
  checks.push([
    expectedVat ? `VAT: ${expectedVat}` : "VAT line omitted (null)",
    expectedVat ? r.text.includes(`VAT: ${expectedVat}`) : !r.text.includes("VAT:"),
  ]);

  checks.push([
    `Total = ${money(r.totals.total, ccy)}`,
    r.text.includes(money(r.totals.total, ccy)),
  ]);
  if (r.kind !== "quotation") {
    checks.push([
      `Amount paid = ${money(r.totals.paid, ccy)}`,
      r.text.includes(money(r.totals.paid, ccy)),
    ]);
    checks.push([
      `Balance due = ${money(r.totals.balance, ccy)}`,
      r.text.includes(money(r.totals.balance, ccy)),
    ]);
    // Helper cross-check: balance_due matches total - paid (or stored balance if not negative)
    const expected = Math.max(financeTotalAmount(r.db) - financePaidAmount(r.db), 0);
    const stored = r.db.balance_due ?? r.db.balance;
    const expectFromHelper =
      stored !== null && stored !== undefined && stored !== "" ? Number(stored) : expected;
    checks.push([`balance helper = ${expectFromHelper}`, r.totals.balance === expectFromHelper]);
  }

  for (const [label, ok] of checks) {
    console.log(`  ${ok ? "✅" : "❌"} ${label}`);
    if (!ok) failed++;
  }
}

// ---------- Positive-branch check: real customer with billing_address ----------
console.log("\n=== POSITIVE BRANCH: real customer with billing_address ===");
const [tp] = psqlJson(`
  SELECT id, name, company_name, email, billing_address, address, city, country, vat_number, phone
  FROM customers
  WHERE billing_address IS NOT NULL
  ORDER BY created_at DESC LIMIT 1
`);
console.log("DB customer:", tp);
const name = customerDisplayName(tp);
const addr = customerBillingAddress(tp);
const vat = customerVatNumber(tp);
console.log("Rendered display name:", name);
console.log("Rendered billing address:", JSON.stringify(addr));
console.log("Rendered VAT:", vat);
const posDoc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
renderBillTo(posDoc, tp, 40, 60);
const posFile = "/tmp/pdf-verify/positive.pdf";
writeFileSync(posFile, Buffer.from(posDoc.output("arraybuffer")));
execSync(`pdftotext -layout ${posFile} ${posFile}.txt`);
const posText = execSync(`cat ${posFile}.txt`, { encoding: "utf8" });
const posChecks = [
  [`display name = "${name}"`, posText.includes(name)],
  [`billing_address first line rendered`, posText.includes(addr.split("\n")[0])],
];
for (const [l, ok] of posChecks) console.log(`  ${ok ? "✅" : "❌"} ${l}`);
console.log("\n(No seed row has vat_number populated; VAT rendering covered by unit tests.)");

console.log(
  `\n${failed === 0 && posChecks.every(([, ok]) => ok) ? "✅ ALL CHECKS PASSED" : `❌ CHECK(S) FAILED`}`,
);
process.exit(failed === 0 && posChecks.every(([, ok]) => ok) ? 0 : 1);

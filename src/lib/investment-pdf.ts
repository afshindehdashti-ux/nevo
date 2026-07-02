import jsPDF from "jspdf";

type Currency = "USD" | "EUR" | "AED" | "SAR";

const SYMBOL: Record<Currency, string> = {
  USD: "$",
  EUR: "EUR ",
  AED: "AED ",
  SAR: "SAR ",
};
const FX: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  AED: 3.67,
  SAR: 3.75,
};

const money = (v: number, c: Currency) =>
  `${SYMBOL[c]}${Math.round(v * FX[c]).toLocaleString()}`;

export type ReportKind =
  | "investment"
  | "roi"
  | "cashflow"
  | "specification"
  | "summary";

interface Inputs {
  capacity: number;
  panel: string;
  line: string;
  country: string;
  currency: Currency;
  electricity: number;
  labor: number;
  ownership: string;
  landPrice: number;
  automation: string;
  workingDays: number;
  shifts: number;
  sellingPrice: number;
}

interface Model {
  totalCapex: number;
  breakdown: { name: string; value: number }[];
  opexBreakdown: { name: string; value: number }[];
  landArea: number;
  buildingArea: number;
  landCost: number;
  workingCapital: number;
  totalInvestment: number;
  powerKw: number;
  waterM3: number;
  compressedAir: number;
  steam: number;
  operators: number;
  annualProduction: number;
  revenue: number;
  opex: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  roi5: number;
  payback: number;
  npv: number;
  irr: number;
  breakEvenMonths: number;
  marginOfSafety: number;
  costPerM2Day: number;
  cashflow: { year: string; Inflow: number; Outflow: number; Net: number }[];
}

const REPORT_META: Record<ReportKind, { title: string; subtitle: string; file: string }> = {
  investment: {
    title: "Investment Report",
    subtitle: "CAPEX breakdown, land, working capital and total investment",
    file: "NEVO-Investment-Report.pdf",
  },
  roi: {
    title: "ROI Report",
    subtitle: "Profitability, margins, ROI, IRR, NPV and payback analysis",
    file: "NEVO-ROI-Report.pdf",
  },
  cashflow: {
    title: "Cash Flow Report",
    subtitle: "5-year inflow, outflow and net cash flow projection",
    file: "NEVO-Cash-Flow-Report.pdf",
  },
  specification: {
    title: "Factory Specification",
    subtitle: "Technical requirements, utilities, area and manpower",
    file: "NEVO-Factory-Specification.pdf",
  },
  summary: {
    title: "Project Summary",
    subtitle: "Executive overview of the sandwich panel plant business case",
    file: "NEVO-Project-Summary.pdf",
  },
};

export function downloadInvestmentReport(
  kind: ReportKind,
  inputs: Inputs,
  model: Model,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const meta = REPORT_META[kind];
  const cur = inputs.currency;

  let y = 0;

  const header = () => {
    doc.setFillColor(15, 20, 25);
    doc.rect(0, 0, W, 110, "F");
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 110, W, 3, "F");
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NEVO INDUSTRIAL", 40, 42);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(meta.title, 40, 68);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(200, 210, 215);
    doc.text(meta.subtitle, 40, 88);
    y = 140;
  };

  const footer = (page: number) => {
    doc.setDrawColor(220);
    doc.setLineWidth(0.5);
    doc.line(40, H - 40, W - 40, H - 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "NEVO Industrial — Factory Investment Calculator | nevoindustrial.com | solutions@nevoindustrial.com",
      40,
      H - 26,
    );
    doc.text(`Page ${page}`, W - 40, H - 26, { align: "right" });
    doc.text(
      "Indicative estimates for planning purposes. Contact NEVO for a validated proposal.",
      40,
      H - 14,
    );
  };

  let page = 1;
  header();

  const ensure = (needed: number) => {
    if (y + needed > H - 60) {
      footer(page);
      doc.addPage();
      page += 1;
      header();
    }
  };

  const sectionTitle = (t: string) => {
    ensure(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(t, 40, y);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1.2);
    doc.line(40, y + 4, 90, y + 4);
    y += 22;
  };

  const kv = (rows: [string, string][]) => {
    doc.setFontSize(10);
    rows.forEach(([k, v], idx) => {
      ensure(22);
      if (idx % 2 === 0) {
        doc.setFillColor(245, 247, 249);
        doc.rect(40, y - 12, W - 80, 20, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90, 100, 110);
      doc.text(k, 50, y + 2);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(v, W - 50, y + 2, { align: "right" });
      y += 20;
    });
    y += 8;
  };

  const table = (cols: string[], rows: string[][], widths: number[]) => {
    doc.setFillColor(15, 20, 25);
    doc.rect(40, y - 12, W - 80, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    let x = 50;
    cols.forEach((c, idx) => {
      const align = idx === 0 ? "left" : "right";
      doc.text(c, align === "left" ? x : x + widths[idx] - 10, y + 2, { align });
      x += widths[idx];
    });
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 40, 50);
    rows.forEach((r, ri) => {
      ensure(20);
      if (ri % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(40, y - 10, W - 80, 18, "F");
      }
      let xx = 50;
      r.forEach((cell, idx) => {
        const align = idx === 0 ? "left" : "right";
        doc.text(cell, align === "left" ? xx : xx + widths[idx] - 10, y + 2, { align });
        xx += widths[idx];
      });
      y += 18;
    });
    y += 10;
  };

  const paragraph = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 75);
    const lines = doc.splitTextToSize(text, W - 80);
    lines.forEach((ln: string) => {
      ensure(16);
      doc.text(ln, 40, y);
      y += 14;
    });
    y += 6;
  };

  const configRows: [string, string][] = [
    ["Country", inputs.country],
    ["Panel Type", inputs.panel],
    ["Production Line", inputs.line],
    ["Automation Level", inputs.automation],
    ["Daily Capacity", `${inputs.capacity.toLocaleString()} m²/day`],
    ["Working Days", `${inputs.workingDays} days/yr`],
    ["Shifts", `${inputs.shifts}`],
    ["Selling Price", `${money(inputs.sellingPrice, cur)} / m²`],
  ];

  paragraph(
    `Prepared for a ${inputs.capacity.toLocaleString()} m²/day ${inputs.panel} sandwich panel plant in ${inputs.country}, ` +
      `operating a ${inputs.line.toLowerCase()} line with ${inputs.automation.toLowerCase()} automation on ${inputs.shifts} shift(s) across ${inputs.workingDays} working days per year. ` +
      `All monetary values are shown in ${cur}.`,
  );

  sectionTitle("Project Configuration");
  kv(configRows);

  if (kind === "investment" || kind === "summary") {
    sectionTitle("CAPEX Breakdown");
    table(
      ["Category", "Amount", "Share"],
      model.breakdown.map((b) => [
        b.name,
        money(b.value, cur),
        `${((b.value / model.totalCapex) * 100).toFixed(1)}%`,
      ]),
      [260, 130, 90],
    );
    sectionTitle("Total Investment");
    kv([
      ["Base CAPEX", money(model.totalCapex, cur)],
      ["Land Cost", money(model.landCost, cur)],
      ["Working Capital", money(model.workingCapital, cur)],
      ["Total Investment", money(model.totalInvestment, cur)],
      ["Investment / m²·day", money(model.costPerM2Day, cur)],
    ]);
  }

  if (kind === "roi" || kind === "summary") {
    sectionTitle("Revenue & Profitability");
    kv([
      ["Annual Production", `${Math.round(model.annualProduction).toLocaleString()} m²`],
      ["Annual Revenue", money(model.revenue, cur)],
      ["Annual OPEX", money(model.opex, cur)],
      ["Gross Profit", money(model.grossProfit, cur)],
      ["Gross Margin", `${(model.grossMargin * 100).toFixed(1)}%`],
      ["Net Profit (after tax)", money(model.netProfit, cur)],
    ]);
    sectionTitle("Return Metrics");
    kv([
      ["5-Year ROI", `${(model.roi5 * 100).toFixed(1)}%`],
      ["IRR (5y, est.)", `${(model.irr * 100).toFixed(1)}%`],
      ["NPV (10% discount, 5y)", money(model.npv, cur)],
      ["Payback Period", `${model.payback.toFixed(2)} years`],
      ["Break-even", `${model.breakEvenMonths} months`],
      ["Margin of Safety", `${(model.marginOfSafety * 100).toFixed(1)}%`],
    ]);
    sectionTitle("OPEX Composition");
    table(
      ["Cost Item", "Annual", "Share"],
      model.opexBreakdown.map((o) => [
        o.name,
        money(o.value, cur),
        `${((o.value / model.opex) * 100).toFixed(1)}%`,
      ]),
      [260, 130, 90],
    );
  }

  if (kind === "cashflow" || kind === "summary") {
    sectionTitle("5-Year Cash Flow");
    table(
      ["Year", "Inflow", "Outflow", "Net"],
      model.cashflow.map((c) => [
        c.year,
        money(c.Inflow, cur),
        money(c.Outflow, cur),
        money(c.Net, cur),
      ]),
      [90, 130, 130, 130],
    );
    paragraph(
      "Year 0 reflects initial CAPEX and working capital deployment. Revenue ramps from 80% of nameplate in Year 1 and grows at ~5% per year while OPEX inflates at ~3% per year.",
    );
  }

  if (kind === "specification" || kind === "summary") {
    sectionTitle("Facility Requirements");
    kv([
      ["Land Area", `${model.landArea.toLocaleString()} m²`],
      ["Building Area", `${model.buildingArea.toLocaleString()} m²`],
      ["Land Ownership", inputs.ownership],
      ["Installed Power", `${model.powerKw.toLocaleString()} kW`],
      ["Water Consumption", `${model.waterM3} m³/day`],
      ["Compressed Air", `${model.compressedAir.toLocaleString()} Nm³/h`],
      ["Steam Demand", model.steam ? `${model.steam} kg/h` : "Not required"],
      ["Operators (total)", `${model.operators}`],
      ["Electricity Tariff", `${money(inputs.electricity, cur)} / kWh`],
      ["Operator Wage", `${money(inputs.labor, cur)} / month`],
    ]);
  }

  if (kind === "summary") {
    sectionTitle("Executive Summary");
    paragraph(
      `The proposed ${inputs.panel} sandwich panel plant requires an estimated ${money(model.totalInvestment, cur)} total investment ` +
        `and is expected to generate ${money(model.revenue, cur)} in annual revenue with a ${(model.grossMargin * 100).toFixed(1)}% gross margin. ` +
        `Payback is projected at ${model.payback.toFixed(2)} years with a 5-year ROI of ${(model.roi5 * 100).toFixed(1)}% and an NPV of ${money(model.npv, cur)} at a 10% discount rate. ` +
        `Facility footprint: ${model.landArea.toLocaleString()} m² of land with a ${model.buildingArea.toLocaleString()} m² building and ${model.powerKw.toLocaleString()} kW installed power, operated by ${model.operators} personnel.`,
    );
    paragraph(
      "Next step: request a detailed proposal from NEVO Industrial to validate assumptions, refine the layout and produce a bankable feasibility study.",
    );
  }

  footer(page);
  doc.save(meta.file);
}

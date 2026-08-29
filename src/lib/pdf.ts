// Client-only: builds the "Business Snapshot" PDF directly with jsPDF's drawing API.
// NOTE: this app's design tokens are oklch() colors, which html2canvas (also installed)
// cannot parse — a DOM screenshot approach would throw. Drawing the report natively
// avoids that entirely and produces a smaller, sharper, text-selectable PDF.
import type { AiOutput } from "./ai.server";
import { money, type Leakage, type Scores } from "./scoring";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLOR = {
  ink: [34, 27, 18] as [number, number, number],
  muted: [107, 97, 86] as [number, number, number],
  primary: [169, 117, 46] as [number, number, number],
  border: [230, 220, 200] as [number, number, number],
  cardBg: [251, 247, 239] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export async function downloadReportPdf(opts: {
  scores: Scores;
  leakage: Leakage;
  ai: AiOutput;
  fullName?: string | null;
  company?: string | null;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const { scores, leakage, ai } = opts;

  let y = MARGIN;

  function newPage() {
    doc.addPage();
    y = MARGIN;
  }

  function ensureRoom(height: number) {
    if (y + height > PAGE_H - MARGIN - 24) newPage();
  }

  function setInk() {
    doc.setTextColor(...COLOR.ink);
  }
  function setMuted() {
    doc.setTextColor(...COLOR.muted);
  }

  function heading(text: string) {
    ensureRoom(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    setInk();
    doc.text(text, MARGIN, y);
    y += 10;
    doc.setDrawColor(...COLOR.border);
    doc.setLineWidth(1);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 20;
  }

  function paragraph(
    text: string,
    opts2?: { size?: number; color?: [number, number, number]; bold?: boolean },
  ) {
    const size = opts2?.size ?? 10.5;
    doc.setFont("helvetica", opts2?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts2?.color ?? COLOR.ink));
    const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
    ensureRoom(lines.length * (size + 3.5));
    doc.text(lines, MARGIN, y);
    y += lines.length * (size + 3.5) + 6;
  }

  function bulletList(items: string[]) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    setMuted();
    for (const item of items) {
      const lines = doc.splitTextToSize(item, CONTENT_W - 14) as string[];
      ensureRoom(lines.length * 14 + 4);
      doc.setFillColor(...COLOR.primary);
      doc.circle(MARGIN + 3, y - 3.5, 1.6, "F");
      doc.text(lines, MARGIN + 14, y);
      y += lines.length * 14 + 6;
    }
  }

  function scoreBar(label: string, score: number) {
    ensureRoom(26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    setInk();
    doc.text(label, MARGIN, y);
    doc.setFont("helvetica", "bold");
    doc.text(String(Math.round(score)), PAGE_W - MARGIN, y, { align: "right" });
    y += 8;
    const barW = CONTENT_W;
    doc.setFillColor(...COLOR.border);
    doc.roundedRect(MARGIN, y, barW, 6, 3, 3, "F");
    doc.setFillColor(...COLOR.primary);
    doc.roundedRect(
      MARGIN,
      y,
      Math.max(6, (barW * Math.max(0, Math.min(100, score))) / 100),
      6,
      3,
      3,
      "F",
    );
    y += 22;
  }

  // ---- Header ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setInk();
  doc.text("AI Business Compass™", MARGIN, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  setMuted();
  const dateLabel = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const who = [opts.fullName, opts.company].filter(Boolean).join(" • ");
  doc.text(
    who ? `Business Snapshot — ${who} — ${dateLabel}` : `Business Snapshot — ${dateLabel}`,
    MARGIN,
    y,
  );
  y += 26;

  // ---- Overall score ----
  heading("Your Compass score");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(...COLOR.primary);
  doc.text(String(Math.round(scores.overall)), MARGIN, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setMuted();
  doc.text("/ 100 overall", MARGIN + 62, y + 6);
  y += 34;

  scoreBar("Marketing", scores.marketing);
  scoreBar("Sales", scores.sales);
  scoreBar("Systems", scores.systems);
  scoreBar("Operations", scores.operations);
  scoreBar("Growth readiness", scores.growth);

  paragraph(ai.summary, { color: COLOR.muted });

  // ---- Primary bottleneck ----
  heading("Primary bottleneck");
  paragraph(ai.primary_bottleneck, { size: 14, bold: true, color: COLOR.primary });
  paragraph(ai.bottleneck_explanation, { color: COLOR.muted });

  // ---- Revenue leakage ----
  heading("Estimated revenue leakage");
  paragraph(`${money(leakage.monthlyLow)} – ${money(leakage.monthlyHigh)} / month`, {
    size: 16,
    bold: true,
    color: COLOR.primary,
  });
  paragraph(`Up to ${money(leakage.annualHigh)} per year, based on your own numbers.`, {
    color: COLOR.muted,
  });
  for (const cause of leakage.causes) {
    ensureRoom(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    setInk();
    doc.text(cause.label, MARGIN, y);
    doc.text(`${money(cause.amount)}/mo`, PAGE_W - MARGIN, y, { align: "right" });
    y += 14;
    paragraph(cause.reason, { color: COLOR.muted, size: 9.5 });
  }

  // ---- Strengths / Weaknesses / Blind spots ----
  heading("Strengths");
  bulletList(ai.strengths);
  heading("Weaknesses");
  bulletList(ai.weaknesses);
  heading("Blind spots");
  bulletList(ai.blind_spots);

  // ---- Growth Roadmap ----
  heading("Your Growth Roadmap");
  ai.priorities.forEach((p, i) => {
    ensureRoom(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.primary);
    doc.text(String(i + 1).padStart(2, "0"), MARGIN, y);
    y += 14;
    paragraph(p.title, { size: 12.5, bold: true });
    paragraph(p.why_it_matters, { color: COLOR.muted });
    paragraph(p.cost_of_inaction, { color: COLOR.primary, size: 9.5 });
    y += 4;
  });

  // ---- Revenue opportunities + next action ----
  heading("Revenue opportunities");
  bulletList(ai.revenue_opportunities);
  heading("Next best action");
  paragraph(ai.next_best_action, { color: COLOR.muted });

  // ---- Footer on every page ----
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.muted);
    doc.text(
      "AI Business Compass™ is a diagnostic tool. It identifies bottlenecks and revenue leakage — it does not provide implementation.",
      MARGIN,
      PAGE_H - 28,
    );
    doc.text(`${p} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 28, { align: "right" });
  }

  doc.save(`AI-Business-Compass-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

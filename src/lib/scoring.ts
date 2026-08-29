import { QUESTION_MAP, type Question, type Section } from "./questions";

export type AnswerValue = string | number | string[] | null;
export type Answers = Record<string, AnswerValue>;

export type Scores = {
  overall: number;
  marketing: number;
  sales: number;
  systems: number;
  operations: number;
  growth: number;
};

export type LeakageCause = { label: string; amount: number; reason: string };

export type Leakage = {
  monthlyLow: number;
  monthlyHigh: number;
  annualHigh: number;
  causes: LeakageCause[];
};

const REVENUE_MIDPOINT: Record<string, number> = {
  "<10k": 6000,
  "10-25k": 17500,
  "25-50k": 37500,
  "50-100k": 75000,
  "100-250k": 175000,
  "250-500k": 375000,
};

function scoreOf(question: Question, value: AnswerValue): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (question.type === "scale") {
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    return Math.max(0, Math.min(100, n * 10));
  }
  if (question.type === "multi" && Array.isArray(value)) {
    const scored = value
      .map((v) => question.options?.find((o) => o.value === v)?.score)
      .filter((n): n is number => typeof n === "number");
    if (!scored.length) return null;
    const avg = scored.reduce((a, b) => a + b, 0) / scored.length;
    // Breadth bonus: doing several healthy things is better than one.
    const breadth = Math.min(15, (scored.length - 1) * 5);
    return Math.max(0, Math.min(100, avg + (avg > 50 ? breadth : 0)));
  }
  const opt = question.options?.find((o) => o.value === value);
  return typeof opt?.score === "number" ? opt.score : null;
}

function sectionScore(answers: Answers, sections: Section[]): number {
  const values: number[] = [];
  for (const [key, value] of Object.entries(answers)) {
    const q = QUESTION_MAP.get(key);
    if (!q || !sections.includes(q.section)) continue;
    const s = scoreOf(q, value);
    if (s !== null) values.push(s);
  }
  if (!values.length) return 50;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function computeScores(answers: Answers): Scores {
  const marketing = sectionScore(answers, ["Marketing"]);
  const sales = sectionScore(answers, ["Sales"]);
  const systems = sectionScore(answers, ["Systems"]);
  const operations = sectionScore(answers, ["Operations"]);
  const growth = Math.round(
    sectionScore(answers, ["Offer", "Team", "Revenue"]) * 0.7 + ((systems + operations) / 2) * 0.3,
  );
  const overall = Math.round(
    marketing * 0.25 + sales * 0.25 + systems * 0.2 + operations * 0.15 + growth * 0.15,
  );
  return { overall, marketing, sales, systems, operations, growth };
}

export function scoreTone(score: number): "good" | "warn" | "bad" {
  if (score >= 75) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

export function scoreColorVar(score: number): string {
  const tone = scoreTone(score);
  return tone === "good" ? "var(--success)" : tone === "warn" ? "var(--warning)" : "var(--danger)";
}

export function computeLeakage(answers: Answers, scores: Scores): Leakage {
  const revenue = REVENUE_MIDPOINT[String(answers.monthly_revenue ?? "")] ?? 25000;
  const causes: LeakageCause[] = [];

  const add = (label: string, pct: number, reason: string) => {
    if (pct <= 0) return;
    causes.push({ label, amount: Math.round(revenue * pct), reason });
  };

  const followup = String(answers.followup ?? "");
  add(
    "Poor follow-up",
    followup === "nothing" ? 0.18 : followup === "manual" ? 0.11 : followup === "some" ? 0.05 : 0.01,
    "Leads that don't buy immediately are never systematically re-engaged.",
  );

  const close = String(answers.close_rate ?? "");
  add(
    "Low close rate",
    close === "<10" ? 0.16 : close === "10-20" ? 0.1 : close === "20-35" ? 0.05 : 0.02,
    "Conversations are reaching the offer but not converting at market rate.",
  );

  add(
    "Weak marketing performance",
    scores.marketing < 40 ? 0.12 : scores.marketing < 65 ? 0.07 : 0.02,
    "Demand generation is inconsistent or untracked, so spend and effort are unmeasured.",
  );

  const automation = String(answers.automation ?? "");
  add(
    "Missing automation",
    automation === "none" ? 0.09 : automation === "little" ? 0.06 : automation === "some" ? 0.03 : 0.01,
    "Manual handoffs introduce delay and dropped leads at every stage.",
  );

  const crm = String(answers.crm ?? "");
  add(
    "No functioning CRM",
    crm === "none" ? 0.08 : crm === "basic" ? 0.05 : 0.01,
    "Without a single source of truth, pipeline value is invisible and unmanaged.",
  );

  add(
    "Broken operational systems",
    scores.operations < 40 ? 0.08 : scores.operations < 65 ? 0.04 : 0.01,
    "Undocumented delivery creates rework, churn risk, and owner dependency.",
  );

  const show = String(answers.show_rate ?? "");
  add(
    "Appointment no-shows",
    show === "<40" ? 0.07 : show === "40-60" ? 0.04 : show === "60-80" ? 0.02 : 0.005,
    "Booked opportunities never reach a conversation.",
  );

  causes.sort((a, b) => b.amount - a.amount);
  const total = causes.reduce((a, c) => a + c.amount, 0);
  const capped = Math.min(total, Math.round(revenue * 0.55));
  const ratio = total > 0 ? capped / total : 0;
  const scaled = causes.map((c) => ({ ...c, amount: Math.round(c.amount * ratio) }));

  return {
    monthlyLow: Math.round(capped * 0.7),
    monthlyHigh: capped,
    annualHigh: capped * 12,
    causes: scaled,
  };
}

export function primaryBottleneckFallback(scores: Scores): string {
  const entries: [string, number][] = [
    ["Marketing", scores.marketing],
    ["Sales", scores.sales],
    ["Systems", scores.systems],
    ["Operations", scores.operations],
    ["Growth Readiness", scores.growth],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
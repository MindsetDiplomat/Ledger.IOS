export type DuplicateCandidateInput = {
  description: string;
  amount: number;
  currency: string;
  occurred_on: string;
  kind: string;
  account?: string | null;
  category?: string | null;
};

export type ExistingTransaction = DuplicateCandidateInput & { id: string };

export type DuplicateMatch = {
  transaction: ExistingTransaction;
  score: number;
  confidence: "high" | "medium" | "low";
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / DAY_MS;
}

function wordsOf(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1),
  );
}

function nameSimilarity(a: string, b: string): number {
  const wa = wordsOf(a);
  const wb = wordsOf(b);
  if (!wa.size || !wb.size) return 0;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / Math.max(wa.size, wb.size);
}

function confidenceFor(score: number): DuplicateMatch["confidence"] {
  if (score >= 7) return "high";
  if (score >= 5) return "medium";
  return "low";
}

export function scoreDuplicate(a: DuplicateCandidateInput, b: DuplicateCandidateInput): number {
  let score = 0;

  const amountDiffPct =
    a.amount === 0 ? (b.amount === 0 ? 0 : 1) : Math.abs(a.amount - b.amount) / Math.abs(a.amount);
  if (amountDiffPct <= 0.01) score += 4;
  else if (amountDiffPct <= 0.05) score += 1;

  const dayGap = daysBetween(a.occurred_on, b.occurred_on);
  if (dayGap === 0) score += 3;
  else if (dayGap <= 1) score += 2;
  else if (dayGap <= 3) score += 1;

  score += nameSimilarity(a.description, b.description) * 2;

  if (a.currency.toUpperCase() === b.currency.toUpperCase()) score += 0.5;
  if (a.kind === b.kind) score += 0.5;
  if (a.account && b.account && a.account === b.account) score += 0.5;
  if (a.category && b.category && a.category === b.category) score += 0.5;

  return Math.round(score * 10) / 10;
}

/** Scans ±3 days for transactions with amount within ~1% and scores them for likely duplication. */
export function findDuplicateCandidates(
  candidate: DuplicateCandidateInput,
  existing: ExistingTransaction[],
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const tx of existing) {
    if (daysBetween(candidate.occurred_on, tx.occurred_on) > 3) continue;
    const amountDiffPct =
      candidate.amount === 0
        ? tx.amount === 0
          ? 0
          : 1
        : Math.abs(candidate.amount - tx.amount) / Math.abs(candidate.amount);
    if (amountDiffPct > 0.01) continue;

    const score = scoreDuplicate(candidate, tx);
    matches.push({ transaction: tx, score, confidence: confidenceFor(score) });
  }

  return matches.sort((a, b) => b.score - a.score);
}

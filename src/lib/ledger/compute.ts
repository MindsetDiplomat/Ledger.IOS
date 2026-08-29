import type { DateRates } from "./fx";
import { toUsd } from "./fx";
import type { LedgerTransaction } from "./data.functions";

export function usdAmount(tx: LedgerTransaction, rates: Record<string, DateRates>): number {
  return toUsd(tx.amount, tx.currency, rates[tx.occurred_on]);
}

export function signedUsd(tx: LedgerTransaction, rates: Record<string, DateRates>): number {
  const amount = usdAmount(tx, rates);
  return tx.kind === "income" ? amount : -amount;
}

export function dayKey(dateISO: string): string {
  return dateISO.slice(0, 10);
}

export function weekKey(dateISO: string): string {
  const d = new Date(dateISO);
  const day = d.getUTCDay();
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7);
}

export type Granularity = "day" | "week" | "month";

export function keyFor(dateISO: string, granularity: Granularity): string {
  if (granularity === "day") return dayKey(dateISO);
  if (granularity === "week") return weekKey(dateISO);
  return monthKey(dateISO);
}

export type PeriodTotals = { key: string; income: number; expense: number; net: number };

export function groupByPeriod(
  transactions: LedgerTransaction[],
  rates: Record<string, DateRates>,
  granularity: Granularity,
): PeriodTotals[] {
  const map = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    const key = keyFor(tx.occurred_on, granularity);
    const bucket = map.get(key) ?? { income: 0, expense: 0 };
    const amount = usdAmount(tx, rates);
    if (tx.kind === "income") bucket.income += amount;
    else bucket.expense += amount;
    map.set(key, bucket);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, income: v.income, expense: v.expense, net: v.income - v.expense }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function totals(transactions: LedgerTransaction[], rates: Record<string, DateRates>) {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    const amount = usdAmount(tx, rates);
    if (tx.kind === "income") income += amount;
    else expense += amount;
  }
  return { income, expense, net: income - expense };
}

export function isBusiness(tx: LedgerTransaction): boolean {
  return (
    Boolean(tx.account && /business/i.test(tx.account)) ||
    /software|office|utilities|rent|marketing/i.test(tx.category)
  );
}

export type Scope = "personal" | "business" | "combined" | "gross";

export function filterByScope(
  transactions: LedgerTransaction[],
  scope: Scope,
): LedgerTransaction[] {
  if (scope === "combined" || scope === "gross") return transactions;
  if (scope === "business") return transactions.filter(isBusiness);
  return transactions.filter((t) => !isBusiness(t));
}

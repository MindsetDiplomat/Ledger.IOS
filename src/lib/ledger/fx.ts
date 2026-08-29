import type { CurrencyCode } from "./currencies";
import { normalizeCurrency } from "./currencies";

export type DateRates = Record<CurrencyCode, number>;

// Fallback USD-base rates used when the live rate lookup fails, or for currencies
// Frankfurter (ECB) does not carry historically, like TWD.
const FALLBACK_RATES: DateRates = { USD: 1, THB: 36, TWD: 32, GBP: 0.79, EUR: 0.92 };

const FRANKFURTER_SUPPORTED: CurrencyCode[] = ["THB", "GBP", "EUR"];

const cache = new Map<string, DateRates>();

async function fetchFrankfurterRates(dateISO: string): Promise<Partial<DateRates> | null> {
  try {
    const symbols = FRANKFURTER_SUPPORTED.join(",");
    const res = await fetch(`https://api.frankfurter.app/${dateISO}?from=USD&to=${symbols}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { rates?: Record<string, number> };
    return (json.rates as Partial<DateRates> | undefined) ?? null;
  } catch {
    return null;
  }
}

/** Historical USD-base exchange rates for a given transaction date, cached by date. */
export async function getRatesForDate(dateISO: string): Promise<DateRates> {
  const cached = cache.get(dateISO);
  if (cached) return cached;

  const live = await fetchFrankfurterRates(dateISO);
  const rates: DateRates = { ...FALLBACK_RATES, ...(live ?? {}) };
  cache.set(dateISO, rates);
  return rates;
}

export async function getRatesForDates(dates: string[]): Promise<Record<string, DateRates>> {
  const unique = Array.from(new Set(dates));
  const entries = await Promise.all(
    unique.map(async (d) => [d, await getRatesForDate(d)] as const),
  );
  return Object.fromEntries(entries);
}

export function rateFor(rates: DateRates | undefined, currency: string): number {
  const code = normalizeCurrency(currency);
  return rates?.[code] ?? FALLBACK_RATES[code] ?? 1;
}

/** Converts an amount from its native currency to USD using the given date's rates. */
export function toUsd(amount: number, currency: string, rates: DateRates | undefined): number {
  return amount / rateFor(rates, currency);
}

export function convert(
  amount: number,
  from: string,
  to: string,
  rates: DateRates | undefined,
): number {
  const usd = toUsd(amount, from, rates);
  return usd * rateFor(rates, to);
}

export { FALLBACK_RATES };

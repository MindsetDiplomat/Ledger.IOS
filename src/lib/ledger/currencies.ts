export type CurrencyCode = "USD" | "THB" | "TWD" | "GBP" | "EUR";

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "USD", label: "USD — US Dollar", symbol: "$" },
  { code: "THB", label: "THB — Thai Baht", symbol: "฿" },
  { code: "TWD", label: "NTD — New Taiwan Dollar", symbol: "NT$" },
  { code: "GBP", label: "GBP — British Pound", symbol: "£" },
  { code: "EUR", label: "EUR — Euro", symbol: "€" },
];

const ALIASES: Record<string, CurrencyCode> = {
  NTD: "TWD",
};

export function normalizeCurrency(currency: string | null | undefined): CurrencyCode {
  const upper = (currency ?? "USD").toUpperCase();
  const aliased = ALIASES[upper];
  if (aliased) return aliased;
  const match = CURRENCIES.find((c) => c.code === upper);
  return match ? match.code : "USD";
}

export function currencySymbol(currency: string): string {
  const code = normalizeCurrency(currency);
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? "$";
}

export function formatCurrency(amount: number, currency: string, decimals = 2): string {
  const code = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${currencySymbol(code)}${amount.toFixed(decimals)}`;
  }
}

import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { totals } from "@/lib/ledger/compute";
import type { LedgerTransaction } from "@/lib/ledger/data.functions";
import type { DateRates } from "@/lib/ledger/fx";
import { formatCurrency } from "@/lib/ledger/currencies";

function Kpi({
  label,
  usd,
  thb,
  icon,
  tone,
}: {
  label: string;
  usd: number;
  thb: number;
  icon: React.ReactNode;
  tone: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-500"
      : tone === "negative"
        ? "text-rose-500"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <span className={toneClass}>{icon}</span>
        </div>
        <p className={`mt-2 font-display text-2xl ${toneClass}`}>{formatCurrency(usd, "USD", 0)}</p>
        <p className="text-xs text-muted-foreground">≈ {formatCurrency(thb, "THB", 0)}</p>
      </CardContent>
    </Card>
  );
}

export function KpiCards({
  transactions,
  rates,
}: {
  transactions: LedgerTransaction[];
  rates: Record<string, DateRates>;
}) {
  const { income, expense, net } = useMemo(
    () => totals(transactions, rates),
    [transactions, rates],
  );
  const rate = Object.values(rates)[0]?.THB ?? 36;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Kpi
        label="Income"
        usd={income}
        thb={income * rate}
        icon={<ArrowUpRight className="h-4 w-4" />}
        tone="positive"
      />
      <Kpi
        label="Expenses"
        usd={expense}
        thb={expense * rate}
        icon={<ArrowDownRight className="h-4 w-4" />}
        tone="negative"
      />
      <Kpi
        label="Net cash flow"
        usd={net}
        thb={net * rate}
        icon={<Scale className="h-4 w-4" />}
        tone={net >= 0 ? "positive" : "negative"}
      />
    </div>
  );
}

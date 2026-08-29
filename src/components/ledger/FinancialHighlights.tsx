import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usdAmount, totals } from "@/lib/ledger/compute";
import type { LedgerTransaction } from "@/lib/ledger/data.functions";
import type { DateRates } from "@/lib/ledger/fx";
import { formatCurrency } from "@/lib/ledger/currencies";

export function FinancialHighlights({
  transactions,
  rates,
}: {
  transactions: LedgerTransaction[];
  rates: Record<string, DateRates>;
}) {
  const { highestIncome, highestExpense, stats } = useMemo(() => {
    let highestIncome: LedgerTransaction | null = null;
    let highestExpense: LedgerTransaction | null = null;
    for (const tx of transactions) {
      const usd = usdAmount(tx, rates);
      if (tx.kind === "income" && (!highestIncome || usd > usdAmount(highestIncome, rates)))
        highestIncome = tx;
      if (tx.kind === "expense" && (!highestExpense || usd > usdAmount(highestExpense, rates)))
        highestExpense = tx;
    }
    return { highestIncome, highestExpense, stats: totals(transactions, rates) };
  }, [transactions, rates]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial highlights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Highest income</p>
            {highestIncome ? (
              <>
                <p className="mt-1 font-medium">
                  {formatCurrency(usdAmount(highestIncome, rates), "USD")}
                </p>
                <p className="text-xs text-muted-foreground">{highestIncome.description}</p>
              </>
            ) : (
              <p className="mt-1 text-muted-foreground">—</p>
            )}
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Highest expense</p>
            {highestExpense ? (
              <>
                <p className="mt-1 font-medium">
                  {formatCurrency(usdAmount(highestExpense, rates), "USD")}
                </p>
                <p className="text-xs text-muted-foreground">{highestExpense.description}</p>
              </>
            ) : (
              <p className="mt-1 text-muted-foreground">—</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
          <span className="text-muted-foreground">
            {transactions.length} transactions this period
          </span>
          <span className={stats.net >= 0 ? "text-emerald-500" : "text-rose-500"}>
            {formatCurrency(stats.net, "USD", 0)} net
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

import { useMemo } from "react";
import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { totals } from "@/lib/ledger/compute";
import type { LedgerTransaction } from "@/lib/ledger/data.functions";
import type { DateRates } from "@/lib/ledger/fx";
import { formatCurrency } from "@/lib/ledger/currencies";

export function ExpenseRatioGauge({
  transactions,
  rates,
}: {
  transactions: LedgerTransaction[];
  rates: Record<string, DateRates>;
}) {
  const { income, expense } = useMemo(() => totals(transactions, rates), [transactions, rates]);
  const ratio = income > 0 ? Math.min(150, (expense / income) * 100) : expense > 0 ? 150 : 0;
  const color = ratio < 50 ? "#3ba55d" : ratio < 85 ? "#b67b22" : "#e15b6b";
  const data = [{ name: "ratio", value: ratio, fill: color }];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense-to-income ratio</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative h-40 w-40">
          <RadialBarChart
            width={160}
            height={160}
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 150]} angleAxisId={0} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={12} />
          </RadialBarChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl" style={{ color }}>
              {Math.round(ratio)}%
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              of income spent
            </span>
          </div>
        </div>
        <div className="mt-4 grid w-full grid-cols-2 gap-3 text-center text-xs text-muted-foreground">
          <div>
            <div className="font-medium text-foreground">{formatCurrency(income, "USD", 0)}</div>
            income (0–$1M scale)
          </div>
          <div>
            <div className="font-medium text-foreground">{formatCurrency(expense, "USD", 0)}</div>
            expenses
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

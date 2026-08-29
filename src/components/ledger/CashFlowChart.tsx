import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DateRates } from "@/lib/ledger/fx";
import { groupByPeriod, type Granularity } from "@/lib/ledger/compute";
import type { LedgerTransaction } from "@/lib/ledger/data.functions";
import { formatCurrency } from "@/lib/ledger/currencies";

type RangeOption = { label: string; days: number | null; granularity: Granularity };

const RANGES: RangeOption[] = [
  { label: "Daily", days: 30, granularity: "day" },
  { label: "Monthly", days: 180, granularity: "month" },
  { label: "Quarterly", days: 365, granularity: "month" },
  { label: "180d", days: 180, granularity: "week" },
  { label: "YTD", days: null, granularity: "month" },
];

export function CashFlowChart({
  transactions,
  rates,
}: {
  transactions: LedgerTransaction[];
  rates: Record<string, DateRates>;
}) {
  const [range, setRange] = useState<RangeOption>(RANGES[1]);

  const data = useMemo(() => {
    let filtered = transactions;
    if (range.days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - range.days);
      const cutoffKey = cutoff.toISOString().slice(0, 10);
      filtered = transactions.filter((t) => t.occurred_on >= cutoffKey);
    } else {
      const yearStart = `${new Date().getFullYear()}-01-01`;
      filtered = transactions.filter((t) => t.occurred_on >= yearStart);
    }
    return groupByPeriod(filtered, rates, range.granularity).map((p) => ({
      period: p.key,
      Income: Math.round(p.income),
      Expenses: Math.round(p.expense),
    }));
  }, [transactions, rates, range]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Cash flow</CardTitle>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.label}
              size="sm"
              variant={r.label === range.label ? "default" : "ghost"}
              onClick={() => setRange(r)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="ledgerIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b67b22" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#b67b22" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ledgerExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d6ba6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0d6ba6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                width={44}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value, "USD", 0)}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              <Area
                type="monotone"
                dataKey="Income"
                stroke="#b67b22"
                fill="url(#ledgerIncome)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Expenses"
                stroke="#0d6ba6"
                fill="url(#ledgerExpense)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

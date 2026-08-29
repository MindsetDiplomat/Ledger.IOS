import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { groupByPeriod, filterByScope, type Granularity, type Scope } from "@/lib/ledger/compute";
import type { LedgerTransaction } from "@/lib/ledger/data.functions";
import type { DateRates } from "@/lib/ledger/fx";
import { formatCurrency } from "@/lib/ledger/currencies";

const GRANULARITIES: Granularity[] = ["day", "week", "month"];
const SCOPES: Scope[] = ["personal", "business", "combined", "gross"];

export function PeriodBreakdown({
  transactions,
  rates,
}: {
  transactions: LedgerTransaction[];
  rates: Record<string, DateRates>;
}) {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [scope, setScope] = useState<Scope>("combined");

  const rows = useMemo(() => {
    const scoped = filterByScope(transactions, scope);
    return groupByPeriod(scoped, rates, granularity).slice(-12).reverse();
  }, [transactions, rates, scope, granularity]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Income &amp; expense grid</CardTitle>
        <div className="flex flex-wrap gap-1">
          {GRANULARITIES.map((g) => (
            <Button
              key={g}
              size="sm"
              variant={g === granularity ? "default" : "ghost"}
              onClick={() => setGranularity(g)}
            >
              {g[0].toUpperCase() + g.slice(1)}
            </Button>
          ))}
          <span className="mx-1 w-px self-stretch bg-border" />
          {SCOPES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === scope ? "default" : "ghost"}
              onClick={() => setScope(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No transactions in this period.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">{r.key}</TableCell>
                  <TableCell className="text-right text-emerald-500">
                    {formatCurrency(r.income, "USD", 0)}
                  </TableCell>
                  <TableCell className="text-right text-rose-500">
                    {formatCurrency(r.expense, "USD", 0)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(r.net, "USD", 0)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

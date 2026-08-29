import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isToday,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usdAmount } from "@/lib/ledger/compute";
import type { LedgerTransaction, LedgerPeriod } from "@/lib/ledger/data.functions";
import type { DateRates } from "@/lib/ledger/fx";
import { formatCurrency } from "@/lib/ledger/currencies";
import { getReceiptSignedUrl } from "@/lib/ledger/receipts";

export function CalendarView({
  transactions,
  periods,
  rates,
  onEditTransaction,
}: {
  transactions: LedgerTransaction[];
  periods: LedgerPeriod[];
  rates: Record<string, DateRates>;
  onEditTransaction: (tx: LedgerTransaction) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<
      string,
      { income: number; expense: number; receipts: number; txs: LedgerTransaction[] }
    >();
    for (const tx of transactions) {
      const bucket = map.get(tx.occurred_on) ?? { income: 0, expense: 0, receipts: 0, txs: [] };
      const usd = usdAmount(tx, rates);
      if (tx.kind === "income") bucket.income += usd;
      else bucket.expense += usd;
      if (tx.receipt_path) bucket.receipts += 1;
      bucket.txs.push(tx);
      map.set(tx.occurred_on, bucket);
    }
    return map;
  }, [transactions, rates]);

  const periodsByDay = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of periods) {
      for (const d of eachDayOfInterval({
        start: new Date(p.start_date),
        end: new Date(p.end_date),
      })) {
        map.set(format(d, "yyyy-MM-dd"), p.color);
      }
    }
    return map;
  }, [periods]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month],
  );

  const dayData = selectedDay ? byDay.get(selectedDay) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-28 text-center text-sm font-medium">
            {format(month, "MMMM yyyy")}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const data = byDay.get(key);
            const periodColor = periodsByDay.get(key);
            const inMonth = isSameMonth(day, month);
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(key)}
                className={`relative flex h-16 flex-col items-start rounded-md border p-1 text-left text-xs transition hover:border-primary ${
                  inMonth ? "border-border" : "border-transparent opacity-40"
                } ${isToday(day) ? "ring-1 ring-primary" : ""}`}
                style={
                  periodColor ? { borderBottomColor: periodColor, borderBottomWidth: 3 } : undefined
                }
              >
                <span className="font-medium">{format(day, "d")}</span>
                {data?.income ? (
                  <span className="text-[10px] text-emerald-500">+{Math.round(data.income)}</span>
                ) : null}
                {data?.expense ? (
                  <span className="text-[10px] text-rose-500">-{Math.round(data.expense)}</span>
                ) : null}
                {data?.receipts ? (
                  <span className="absolute right-1 top-1 flex items-center gap-0.5 text-muted-foreground">
                    <Receipt className="h-2.5 w-2.5" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={Boolean(selectedDay)} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay ? format(new Date(selectedDay), "MMMM d, yyyy") : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {!dayData?.txs.length ? (
              <p className="text-sm text-muted-foreground">No transactions on this day.</p>
            ) : (
              dayData.txs.map((tx) => (
                <DayTransactionRow key={tx.id} tx={tx} onClick={() => onEditTransaction(tx)} />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DayTransactionRow({ tx, onClick }: { tx: LedgerTransaction; onClick: () => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (tx.receipt_path) {
      void getReceiptSignedUrl(tx.receipt_path).then((u) => {
        if (!cancelled) setUrl(u);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [tx.receipt_path]);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left text-sm hover:border-primary"
    >
      {url ? (
        <img src={url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
          <Receipt className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{tx.description}</p>
        <p className="text-xs text-muted-foreground">{tx.category}</p>
      </div>
      <span className={tx.kind === "income" ? "text-emerald-500" : "text-rose-500"}>
        {tx.kind === "income" ? "+" : "-"}
        {formatCurrency(tx.amount, tx.currency)}
      </span>
    </button>
  );
}

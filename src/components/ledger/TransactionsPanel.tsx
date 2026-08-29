import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Receipt, AlertTriangle, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/ledger/currencies";
import { listTransactionsPage, type LedgerTransaction } from "@/lib/ledger/data.functions";
import { getReceiptSignedUrl } from "@/lib/ledger/receipts";

function monthOptions(transactions: LedgerTransaction[]): { value: string; label: string }[] {
  const set = new Set(transactions.map((t) => t.occurred_on.slice(0, 7)));
  return Array.from(set)
    .sort((a, b) => b.localeCompare(a))
    .map((m) => ({
      value: m,
      label: new Date(`${m}-01`).toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    }));
}

export function TransactionsPanel({
  allTransactions,
  refreshKey,
  onEdit,
}: {
  allTransactions: LedgerTransaction[];
  refreshKey: number;
  onEdit: (tx: LedgerTransaction) => void;
}) {
  const [month, setMonth] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LedgerTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const runList = useServerFn(listTransactionsPage);
  const pageSize = 30;

  const months = useMemo(() => monthOptions(allTransactions), [allTransactions]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    runList({ data: { page, pageSize, month: month === "all" ? undefined : month } })
      .then((res) => {
        if (cancelled) return;
        setRows(res.rows);
        setTotal(res.total);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, month, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [month]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const receiptRows = rows.filter((r) => r.receipt_path);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Transactions</CardTitle>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-6">
        {receiptRows.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Receipts</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {receiptRows.map((tx) => (
                <ReceiptThumb key={tx.id} path={tx.receipt_path!} onClick={setLightbox} />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Recent transactions
          </p>
          <div className="space-y-1.5">
            {loading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transactions found.
              </p>
            ) : (
              rows.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => onEdit(tx)}
                  className="flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left text-sm transition hover:border-border hover:bg-muted/40"
                >
                  {tx.receipt_path ? (
                    <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <span className="w-4" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.occurred_on} · {tx.category}
                    </p>
                  </div>
                  {tx.is_refund ? (
                    <Badge variant="outline" className="gap-1">
                      <Undo2 className="h-3 w-3" /> Refund
                    </Badge>
                  ) : null}
                  {tx.duplicate_status === "duplicate" ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" /> Possible duplicate
                    </Badge>
                  ) : null}
                  <span className={tx.kind === "income" ? "text-emerald-500" : "text-rose-500"}>
                    {tx.kind === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                </button>
              ))
            )}
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={p === page ? "default" : "ghost"}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>

      <Dialog open={Boolean(lightbox)} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-2xl">
          {lightbox ? <img src={lightbox} alt="Receipt" className="w-full rounded-lg" /> : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ReceiptThumb({ path, onClick }: { path: string; onClick: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getReceiptSignedUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!url) return <div className="aspect-square animate-pulse rounded-lg bg-muted" />;

  return (
    <button
      onClick={() => onClick(url)}
      className="aspect-square overflow-hidden rounded-lg border border-border"
    >
      <img
        src={url}
        alt="Receipt"
        className="h-full w-full object-cover transition hover:scale-105"
      />
    </button>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, FileUp, Plus } from "lucide-react";
import { LedgerShell } from "@/components/ledger/LedgerShell";
import { Button } from "@/components/ui/button";
import { KpiCards } from "@/components/ledger/KpiCards";
import { CashFlowChart } from "@/components/ledger/CashFlowChart";
import { ExpenseRatioGauge } from "@/components/ledger/ExpenseRatioGauge";
import { InvestmentLedger } from "@/components/ledger/InvestmentLedger";
import { SubscriptionLeakDetector } from "@/components/ledger/SubscriptionLeakDetector";
import { FinancialHighlights } from "@/components/ledger/FinancialHighlights";
import { PeriodsPanel } from "@/components/ledger/PeriodsPanel";
import { PeriodBreakdown } from "@/components/ledger/PeriodBreakdown";
import { CalendarView } from "@/components/ledger/CalendarView";
import { TransactionsPanel } from "@/components/ledger/TransactionsPanel";
import { TransactionModal } from "@/components/ledger/TransactionModal";
import { SnapReceiptModal } from "@/components/ledger/SnapReceiptModal";
import { UploadStatementModal } from "@/components/ledger/UploadStatementModal";
import { getLedgerDashboard, type LedgerTransaction } from "@/lib/ledger/data.functions";
import type { ExistingTransaction } from "@/lib/ledger/duplicates";

export const Route = createFileRoute("/ledger/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Ledger" }],
  }),
  component: DashboardPage,
});

type Bundle = Awaited<ReturnType<typeof getLedgerDashboard>>;

function DashboardPage() {
  const runGet = useServerFn(getLedgerDashboard);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<LedgerTransaction | null>(null);
  const [snapOpen, setSnapOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const reload = useCallback(() => {
    runGet({ data: {} })
      .then((b) => {
        setBundle(b);
        setLoadError(null);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not refresh."));
  }, [runGet]);

  useEffect(() => {
    setLoading(true);
    runGet({ data: {} })
      .then((b) => {
        setBundle(b);
        setLoadError(null);
      })
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Could not load your ledger."),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const existingForDuplicateCheck: ExistingTransaction[] = useMemo(
    () =>
      (bundle?.transactions ?? []).map((t) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        currency: t.currency,
        occurred_on: t.occurred_on,
        kind: t.kind,
        account: t.account,
        category: t.category,
      })),
    [bundle],
  );

  function bump() {
    setRefreshKey((k) => k + 1);
    reload();
  }

  function openEdit(tx: LedgerTransaction) {
    setEditingTx(tx);
    setTxModalOpen(true);
  }

  function openEditById(id: string) {
    const tx = bundle?.transactions.find((t) => t.id === id);
    if (tx) openEdit(tx);
  }

  if (loadError) {
    return (
      <LedgerShell>
        <div className="flex h-96 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
          <p>Couldn't load your ledger: {loadError}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLoadError(null);
              setLoading(true);
              reload();
              setLoading(false);
            }}
          >
            Try again
          </Button>
        </div>
      </LedgerShell>
    );
  }

  if (loading || !bundle) {
    return (
      <LedgerShell>
        <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
          Loading your ledger…
        </div>
      </LedgerShell>
    );
  }

  return (
    <LedgerShell>
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl">Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
              <FileUp className="h-4 w-4" />
              Upload statement
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSnapOpen(true)}>
              <Camera className="h-4 w-4" />
              Snap receipt
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add transaction
            </Button>
          </div>
        </div>

        <KpiCards transactions={bundle.transactions} rates={bundle.rates} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CashFlowChart transactions={bundle.transactions} rates={bundle.rates} />
          </div>
          <ExpenseRatioGauge transactions={bundle.transactions} rates={bundle.rates} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <InvestmentLedger
            investments={bundle.investments}
            onChange={(rows) => setBundle((b) => (b ? { ...b, investments: rows } : b))}
          />
          <SubscriptionLeakDetector
            subscriptions={bundle.subscriptions}
            onChange={(rows) => setBundle((b) => (b ? { ...b, subscriptions: rows } : b))}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <FinancialHighlights transactions={bundle.transactions} rates={bundle.rates} />
          <PeriodsPanel
            periods={bundle.periods}
            onChange={(rows) => setBundle((b) => (b ? { ...b, periods: rows } : b))}
          />
        </div>

        <PeriodBreakdown transactions={bundle.transactions} rates={bundle.rates} />

        <CalendarView
          transactions={bundle.transactions}
          periods={bundle.periods}
          rates={bundle.rates}
          onEditTransaction={openEdit}
        />

        <TransactionsPanel
          allTransactions={bundle.transactions}
          refreshKey={refreshKey}
          onEdit={openEdit}
        />
      </div>

      <TransactionModal
        open={txModalOpen}
        onOpenChange={setTxModalOpen}
        transaction={editingTx}
        existingForDuplicateCheck={existingForDuplicateCheck}
        onSaved={bump}
        onDeleted={bump}
        onOpenExisting={openEditById}
      />

      <SnapReceiptModal
        open={snapOpen}
        onOpenChange={setSnapOpen}
        existingForDuplicateCheck={existingForDuplicateCheck}
        onSaved={bump}
      />

      <UploadStatementModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        existingForDuplicateCheck={existingForDuplicateCheck}
        onImported={bump}
      />
    </LedgerShell>
  );
}

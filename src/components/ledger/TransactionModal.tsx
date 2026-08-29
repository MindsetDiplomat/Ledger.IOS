import { useEffect, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryPicker } from "./CategoryPicker";
import { DuplicateWarning } from "./DuplicateWarning";
import { SnapReceiptModal } from "./SnapReceiptModal";
import { CURRENCIES } from "@/lib/ledger/currencies";
import {
  findDuplicateCandidates,
  type DuplicateMatch,
  type ExistingTransaction,
} from "@/lib/ledger/duplicates";
import {
  deleteTransaction,
  upsertTransaction,
  type LedgerTransaction,
} from "@/lib/ledger/data.functions";
import { useServerFn } from "@tanstack/react-start";

type FormState = {
  description: string;
  amount: string;
  currency: string;
  occurred_on: string;
  category: string;
  kind: "income" | "expense";
  account: string;
  is_refund: boolean;
  receipt_path: string | null;
};

function emptyForm(): FormState {
  return {
    description: "",
    amount: "",
    currency: "USD",
    occurred_on: new Date().toISOString().slice(0, 10),
    category: "Other",
    kind: "expense",
    account: "",
    is_refund: false,
    receipt_path: null,
  };
}

export function TransactionModal({
  open,
  onOpenChange,
  transaction,
  existingForDuplicateCheck,
  onSaved,
  onDeleted,
  onOpenExisting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: LedgerTransaction | null;
  existingForDuplicateCheck: ExistingTransaction[];
  onSaved: (tx: LedgerTransaction) => void;
  onDeleted?: (id: string) => void;
  onOpenExisting?: (id: string) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);
  const runUpsert = useServerFn(upsertTransaction);
  const runDelete = useServerFn(deleteTransaction);

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setForm({
        description: transaction.description,
        amount: String(transaction.amount),
        currency: transaction.currency,
        occurred_on: transaction.occurred_on,
        category: transaction.category,
        kind: transaction.kind,
        account: transaction.account ?? "",
        is_refund: transaction.is_refund,
        receipt_path: transaction.receipt_path,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, transaction]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function doSave() {
    const amount = Number(form.amount);
    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a description and a valid amount.");
      return;
    }

    setSaving(true);
    try {
      const row = await runUpsert({
        data: {
          id: transaction?.id,
          description: form.description.trim(),
          amount,
          currency: form.currency,
          occurred_on: form.occurred_on,
          category: form.category || "Other",
          kind: form.kind,
          account: form.account.trim() || null,
          is_refund: form.is_refund,
          receipt_path: form.receipt_path,
        },
      });
      toast.success(transaction ? "Transaction updated." : "Transaction added.");
      onSaved(row);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (transaction) {
      void doSave();
      return;
    }
    const amount = Number(form.amount);
    const candidates = findDuplicateCandidates(
      {
        description: form.description,
        amount,
        currency: form.currency,
        occurred_on: form.occurred_on,
        kind: form.kind,
        account: form.account || null,
        category: form.category,
      },
      existingForDuplicateCheck,
    );
    const meaningful = candidates.filter((c) => c.confidence !== "low");
    if (meaningful.length) {
      setDuplicates(meaningful);
      return;
    }
    void doSave();
  }

  async function handleDelete() {
    if (!transaction) return;
    setSaving(true);
    try {
      await runDelete({ data: { id: transaction.id } });
      toast.success("Transaction deleted.");
      onDeleted?.(transaction.id);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete transaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{transaction ? "Edit transaction" : "Add transaction"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={form.kind === "expense" ? "default" : "outline"}
                size="sm"
                onClick={() => set("kind", "expense")}
              >
                Expense
              </Button>
              <Button
                type="button"
                variant={form.kind === "income" ? "default" : "outline"}
                size="sm"
                onClick={() => set("kind", "income")}
              >
                Income
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setScanOpen(true)}
              >
                <Camera className="h-4 w-4" />
                Scan receipt
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Coffee shop, client payment, etc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occurred_on">Date</Label>
                <Input
                  id="occurred_on"
                  type="date"
                  value={form.occurred_on}
                  onChange={(e) => set("occurred_on", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <CategoryPicker value={form.category} onChange={(v) => set("category", v)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account (optional)</Label>
              <Input
                id="account"
                value={form.account}
                onChange={(e) => set("account", e.target.value)}
                placeholder="Personal card, business checking, cash…"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_refund}
                onCheckedChange={(v) => set("is_refund", Boolean(v))}
              />
              This is a refund
            </label>

            <DialogFooter className="gap-2">
              {transaction ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SnapReceiptModal
        open={scanOpen}
        onOpenChange={setScanOpen}
        onExtracted={(extracted, receiptPath) => {
          set("description", extracted.description);
          set("amount", String(extracted.amount));
          set("currency", extracted.currency);
          set("occurred_on", extracted.occurred_on);
          set("category", extracted.category);
          set("kind", extracted.kind);
          set("receipt_path", receiptPath);
          setScanOpen(false);
        }}
      />

      {duplicates ? (
        <DuplicateWarning
          open={Boolean(duplicates)}
          matches={duplicates}
          onOpenChange={(o) => !o && setDuplicates(null)}
          onCancel={() => setDuplicates(null)}
          onKeepBoth={() => {
            setDuplicates(null);
            void doSave();
          }}
          onReview={(match) => {
            setDuplicates(null);
            onOpenChange(false);
            onOpenExisting?.(match.transaction.id);
          }}
        />
      ) : null}
    </>
  );
}

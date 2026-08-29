import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/ledger/currencies";
import {
  deleteSubscription,
  upsertSubscription,
  type LedgerSubscription,
} from "@/lib/ledger/data.functions";

const FREQUENCY_TO_MONTHLY: Record<LedgerSubscription["frequency"], number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

export function SubscriptionLeakDetector({
  subscriptions,
  onChange,
}: {
  subscriptions: LedgerSubscription[];
  onChange: (rows: LedgerSubscription[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    currency: "USD",
    frequency: "monthly" as LedgerSubscription["frequency"],
    next_billing_date: "",
    category: "Software",
  });
  const runUpsert = useServerFn(upsertSubscription);
  const runDelete = useServerFn(deleteSubscription);

  const monthlyTotal = useMemo(
    () => subscriptions.reduce((sum, s) => sum + s.amount * FREQUENCY_TO_MONTHLY[s.frequency], 0),
    [subscriptions],
  );

  async function save() {
    const amount = Number(form.amount);
    if (!form.name.trim() || !Number.isFinite(amount)) {
      toast.error("Enter a name and a valid amount.");
      return;
    }
    try {
      const row = await runUpsert({
        data: {
          name: form.name.trim(),
          amount,
          currency: form.currency,
          frequency: form.frequency,
          next_billing_date: form.next_billing_date || null,
          category: form.category,
        },
      });
      onChange(
        [...subscriptions, row].sort((a, b) =>
          (a.next_billing_date ?? "").localeCompare(b.next_billing_date ?? ""),
        ),
      );
      setOpen(false);
      setForm({
        name: "",
        amount: "",
        currency: "USD",
        frequency: "monthly",
        next_billing_date: "",
        category: "Software",
      });
      toast.success("Subscription added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save subscription.");
    }
  }

  async function remove(id: string) {
    try {
      await runDelete({ data: { id } });
      onChange(subscriptions.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete subscription.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-rose-500" />
          Subscription leaks
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{formatCurrency(monthlyTotal, "USD")}</span>{" "}
          committed per month across {subscriptions.length} subscription
          {subscriptions.length === 1 ? "" : "s"}.
        </p>
        <div className="space-y-2">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recurring subscriptions tracked yet.</p>
          ) : (
            subscriptions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.category} · {s.frequency}
                    {s.next_billing_date ? ` · next ${s.next_billing_date}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{formatCurrency(s.amount, s.currency)}</Badge>
                  <button
                    onClick={() => remove(s.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Frequency</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, frequency: v as LedgerSubscription["frequency"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Next billing date</Label>
              <Input
                type="date"
                value={form.next_billing_date}
                onChange={(e) => setForm((f) => ({ ...f, next_billing_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

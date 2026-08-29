import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/ledger/currencies";
import {
  deleteInvestment,
  upsertInvestment,
  type LedgerInvestment,
} from "@/lib/ledger/data.functions";
import { differenceInCalendarDays } from "date-fns";

export function InvestmentLedger({
  investments,
  onChange,
}: {
  investments: LedgerInvestment[];
  onChange: (rows: LedgerInvestment[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Stock",
    value: "",
    currency: "USD",
    cost_basis: "",
    entry_date: "",
  });
  const runUpsert = useServerFn(upsertInvestment);
  const runDelete = useServerFn(deleteInvestment);

  async function save() {
    const value = Number(form.value);
    if (!form.name.trim() || !Number.isFinite(value)) {
      toast.error("Enter a name and a valid value.");
      return;
    }
    try {
      const row = await runUpsert({
        data: {
          name: form.name.trim(),
          type: form.type,
          value,
          currency: form.currency,
          cost_basis: form.cost_basis ? Number(form.cost_basis) : null,
          entry_date: form.entry_date || null,
        },
      });
      onChange([row, ...investments]);
      setOpen(false);
      setForm({
        name: "",
        type: "Stock",
        value: "",
        currency: "USD",
        cost_basis: "",
        entry_date: "",
      });
      toast.success("Investment added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save investment.");
    }
  }

  async function remove(id: string) {
    try {
      await runDelete({ data: { id } });
      onChange(investments.filter((i) => i.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete investment.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Investment ledger</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {investments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No investments tracked yet.</p>
        ) : (
          investments.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
            >
              <div>
                <div className="font-medium">{inv.name}</div>
                <div className="text-xs text-muted-foreground">
                  {inv.type}
                  {inv.entry_date
                    ? ` · held ${differenceInCalendarDays(new Date(), new Date(inv.entry_date))}d`
                    : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{formatCurrency(inv.value, inv.currency)}</span>
                <button
                  onClick={() => remove(inv.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add investment</DialogTitle>
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
                <Label>Type</Label>
                <Input
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Value</Label>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Entry date</Label>
              <Input
                type="date"
                value={form.entry_date}
                onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))}
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

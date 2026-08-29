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
import { deletePeriod, upsertPeriod, type LedgerPeriod } from "@/lib/ledger/data.functions";

const SWATCHES = ["#b67b22", "#0d6ba6", "#3ba55d", "#e15b6b", "#a56be0"];

export function PeriodsPanel({
  periods,
  onChange,
}: {
  periods: LedgerPeriod[];
  onChange: (rows: LedgerPeriod[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    color: SWATCHES[0],
  });
  const runUpsert = useServerFn(upsertPeriod);
  const runDelete = useServerFn(deletePeriod);

  async function save() {
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      toast.error("Name, start date, and end date are required.");
      return;
    }
    try {
      const row = await runUpsert({ data: form });
      onChange([row, ...periods]);
      setOpen(false);
      setForm({ name: "", description: "", start_date: "", end_date: "", color: SWATCHES[0] });
      toast.success("Period created.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save period.");
    }
  }

  async function remove(id: string) {
    try {
      await runDelete({ data: { id } });
      onChange(periods.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete period.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Financial periods</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New period
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {periods.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No periods yet — mark a vacation, project, or event to see it on the calendar.
          </p>
        ) : (
          periods.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.start_date} – {p.end_date}
                  </div>
                </div>
              </div>
              <button
                onClick={() => remove(p.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New financial period</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Vacation, Q3 project…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>End</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="flex gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className="h-6 w-6 rounded-full ring-offset-2"
                    style={{
                      backgroundColor: c,
                      boxShadow: form.color === c ? `0 0 0 2px ${c}` : undefined,
                    }}
                  />
                ))}
              </div>
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

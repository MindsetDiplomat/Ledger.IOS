import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DuplicateMatch } from "@/lib/ledger/duplicates";
import { formatCurrency } from "@/lib/ledger/currencies";

export function DuplicateWarning({
  open,
  matches,
  onOpenChange,
  onReview,
  onKeepBoth,
  onCancel,
}: {
  open: boolean;
  matches: DuplicateMatch[];
  onOpenChange: (open: boolean) => void;
  onReview: (match: DuplicateMatch) => void;
  onKeepBoth: () => void;
  onCancel: () => void;
}) {
  const top = matches[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Possible duplicate</DialogTitle>
          <DialogDescription>
            This looks similar to{" "}
            {matches.length > 1
              ? `${matches.length} existing transactions`
              : "an existing transaction"}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {matches.map((m) => (
            <div
              key={m.transaction.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
            >
              <div>
                <div className="font-medium">{m.transaction.description}</div>
                <div className="text-xs text-muted-foreground">
                  {m.transaction.occurred_on} ·{" "}
                  {formatCurrency(m.transaction.amount, m.transaction.currency)}
                </div>
              </div>
              <Badge
                variant={
                  m.confidence === "high"
                    ? "destructive"
                    : m.confidence === "medium"
                      ? "secondary"
                      : "outline"
                }
              >
                {m.confidence} match
              </Badge>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onKeepBoth}>
            Keep both
          </Button>
          {top ? <Button onClick={() => onReview(top)}>Review existing</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

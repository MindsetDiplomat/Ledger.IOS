import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileUp, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { categorizeRows } from "@/lib/ledger/ai.functions";
import { upsertTransaction, type LedgerTransaction } from "@/lib/ledger/data.functions";
import { findDuplicateCandidates, type ExistingTransaction } from "@/lib/ledger/duplicates";

type ParsedRow = { description: string; amount: number; occurred_on: string };

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function findColumn(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const candidate of candidates) {
    const idx = lower.findIndex((h) => h.includes(candidate));
    if (idx !== -1) return idx;
  }
  return -1;
}

function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(trimmed);
  if (iso) return iso[0];
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

export function UploadStatementModal({
  open,
  onOpenChange,
  existingForDuplicateCheck,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingForDuplicateCheck: ExistingTransaction[];
  onImported: (rows: LedgerTransaction[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "importing" | "done">("idle");
  const [progress, setProgress] = useState({ imported: 0, skipped: 0, total: 0 });
  const runCategorize = useServerFn(categorizeRows);
  const runUpsert = useServerFn(upsertTransaction);

  async function handleFile(file: File) {
    setStatus("parsing");
    try {
      const text = await file.text();
      const table = parseCsv(text);
      if (table.length < 2) throw new Error("This file doesn't look like a bank export.");

      const headers = table[0];
      const dateCol = findColumn(headers, ["date"]);
      const descCol = findColumn(headers, [
        "description",
        "memo",
        "payee",
        "merchant",
        "narrative",
      ]);
      const amountCol = findColumn(headers, ["amount"]);
      const debitCol = findColumn(headers, ["debit", "withdrawal"]);
      const creditCol = findColumn(headers, ["credit", "deposit"]);

      if (
        dateCol === -1 ||
        descCol === -1 ||
        (amountCol === -1 && debitCol === -1 && creditCol === -1)
      ) {
        throw new Error("Couldn't find date/description/amount columns in this file.");
      }

      const parsed: ParsedRow[] = [];
      for (const cells of table.slice(1)) {
        const occurred_on = normalizeDate(cells[dateCol] ?? "");
        const description = (cells[descCol] ?? "").trim();
        if (!occurred_on || !description) continue;

        let amount: number;
        if (amountCol !== -1) {
          amount = Number((cells[amountCol] ?? "0").replace(/[^0-9.-]/g, ""));
        } else {
          const debit = Number((cells[debitCol] ?? "0").replace(/[^0-9.-]/g, "")) || 0;
          const credit = Number((cells[creditCol] ?? "0").replace(/[^0-9.-]/g, "")) || 0;
          amount = credit - debit;
        }
        if (!Number.isFinite(amount) || amount === 0) continue;
        parsed.push({ description, amount, occurred_on });
      }

      if (!parsed.length) throw new Error("No usable rows found in this file.");

      setStatus("importing");
      setProgress({ imported: 0, skipped: 0, total: parsed.length });

      const categories = await runCategorize({
        data: { rows: parsed.map((r) => ({ description: r.description, amount: r.amount })) },
      });

      const saved: LedgerTransaction[] = [];
      const seen: ExistingTransaction[] = [...existingForDuplicateCheck];
      let skipped = 0;

      for (let i = 0; i < parsed.length; i++) {
        const row = parsed[i];
        const kind: "income" | "expense" = row.amount >= 0 ? "income" : "expense";
        const amount = Math.abs(row.amount);

        const matches = findDuplicateCandidates(
          {
            description: row.description,
            amount,
            currency: "USD",
            occurred_on: row.occurred_on,
            kind,
          },
          seen,
        );
        if (matches.some((m) => m.confidence === "high")) {
          skipped++;
          setProgress({ imported: saved.length, skipped, total: parsed.length });
          continue;
        }

        const category = categories[i]?.category ?? "Other";
        const finalKind = categories[i]?.kind ?? kind;

        try {
          const savedRow = await runUpsert({
            data: {
              description: row.description,
              amount,
              currency: "USD",
              occurred_on: row.occurred_on,
              category,
              kind: finalKind,
            },
          });
          saved.push(savedRow);
          seen.push({
            id: savedRow.id,
            description: savedRow.description,
            amount: savedRow.amount,
            currency: savedRow.currency,
            occurred_on: savedRow.occurred_on,
            kind: savedRow.kind,
          });
        } catch {
          skipped++;
        }
        setProgress({ imported: saved.length, skipped, total: parsed.length });
      }

      onImported(saved);
      setStatus("done");
      toast.success(
        `Imported ${saved.length} transactions${skipped ? `, skipped ${skipped} likely duplicates` : ""}.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not import this file.");
      setStatus("idle");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setStatus("idle");
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload bank statement</DialogTitle>
          <DialogDescription>
            CSV export from your bank or card. We'll auto-detect the columns.
          </DialogDescription>
        </DialogHeader>

        {status === "idle" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <FileUp className="h-10 w-10 text-muted-foreground" />
            <Button onClick={() => fileInputRef.current?.click()}>Choose CSV file</Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
        ) : null}

        {status === "parsing" ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Reading file…</p>
          </div>
        ) : null}

        {status === "importing" ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Importing {progress.imported} of {progress.total}
              {progress.skipped ? ` (${progress.skipped} skipped)` : ""}…
            </p>
          </div>
        ) : null}

        {status === "done" ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-muted-foreground">
              Imported {progress.imported} transactions
              {progress.skipped ? `, skipped ${progress.skipped}` : ""}.
            </p>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryPicker } from "./CategoryPicker";
import { DuplicateWarning } from "./DuplicateWarning";
import { CURRENCIES } from "@/lib/ledger/currencies";
import { extractReceipt, type ExtractedReceipt } from "@/lib/ledger/ai.functions";
import { deleteReceiptFile, uploadReceipt } from "@/lib/ledger/receipts";
import { supabase } from "@/integrations/supabase/client";
import { upsertTransaction, type LedgerTransaction } from "@/lib/ledger/data.functions";
import {
  findDuplicateCandidates,
  type DuplicateMatch,
  type ExistingTransaction,
} from "@/lib/ledger/duplicates";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SnapReceiptModal({
  open,
  onOpenChange,
  onExtracted,
  onSaved,
  existingForDuplicateCheck = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtracted?: (data: ExtractedReceipt, receiptPath: string | null) => void;
  onSaved?: (tx: LedgerTransaction) => void;
  existingForDuplicateCheck?: ExistingTransaction[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"pick" | "scanning" | "review">("pick");
  const [extracted, setExtracted] = useState<ExtractedReceipt | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);
  const runExtract = useServerFn(extractReceipt);
  const runUpsert = useServerFn(upsertTransaction);

  function reset() {
    setStep("pick");
    setExtracted(null);
    setReceiptPath(null);
    setDuplicates(null);
  }

  function close(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function handleFile(file: File) {
    setStep("scanning");
    try {
      const dataUrl = await fileToDataUrl(file);
      const [result, uploadedPath] = await Promise.all([
        runExtract({ data: { imageDataUrl: dataUrl } }),
        (async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user.id) return null;
          try {
            return await uploadReceipt(session.user.id, file);
          } catch {
            try {
              return await uploadReceipt(session.user.id, file);
            } catch {
              toast.warning("Receipt image failed to upload — saving details without the image.");
              return null;
            }
          }
        })(),
      ]);
      setExtracted(result);
      setReceiptPath(uploadedPath);
      setStep("review");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read the receipt.");
      setStep("pick");
    }
  }

  function set<K extends keyof ExtractedReceipt>(key: K, value: ExtractedReceipt[K]) {
    setExtracted((e) => (e ? { ...e, [key]: value } : e));
  }

  async function doSave() {
    if (!extracted) return;
    setSaving(true);
    try {
      const row = await runUpsert({
        data: {
          description: extracted.description,
          amount: extracted.amount,
          currency: extracted.currency,
          occurred_on: extracted.occurred_on,
          category: extracted.category,
          kind: extracted.kind,
          receipt_path: receiptPath,
        },
      });
      toast.success("Transaction saved.");
      onSaved?.(row);
      close(false);
    } catch (err) {
      if (receiptPath) await deleteReceiptFile(receiptPath).catch(() => {});
      toast.error(err instanceof Error ? err.message : "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  }

  function handleConfirm() {
    if (!extracted) return;
    if (onExtracted) {
      onExtracted(extracted, receiptPath);
      close(false);
      return;
    }
    const candidates = findDuplicateCandidates(
      {
        description: extracted.description,
        amount: extracted.amount,
        currency: extracted.currency,
        occurred_on: extracted.occurred_on,
        kind: extracted.kind,
        category: extracted.category,
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

  return (
    <>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Snap receipt</DialogTitle>
          </DialogHeader>

          {step === "pick" ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Camera className="h-10 w-10 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground">
                Take a photo of a receipt and Ledger's AI will read the amount, date, and merchant.
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>Open camera</Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          ) : null}

          {step === "scanning" ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Reading receipt…</p>
            </div>
          ) : null}

          {step === "review" && extracted ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={extracted.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={extracted.amount}
                    onChange={(e) => set("amount", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={extracted.currency} onValueChange={(v) => set("currency", v)}>
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
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={extracted.occurred_on}
                    onChange={(e) => set("occurred_on", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <CategoryPicker value={extracted.category} onChange={(v) => set("category", v)} />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => close(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={saving}>
                  {saving ? "Saving…" : onExtracted ? "Use this" : "Save transaction"}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

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
          onReview={() => setDuplicates(null)}
        />
      ) : null}
    </>
  );
}

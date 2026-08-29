import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AI_CATEGORY_NAMES } from "./categories";

export type ExtractedReceipt = {
  description: string;
  amount: number;
  currency: string;
  occurred_on: string;
  category: string;
  kind: "income" | "expense";
};

const RECEIPT_SYSTEM_PROMPT = `You read receipt and invoice photos for a financial ledger app.

Extract: description (merchant or purpose, short), amount (number, no currency symbol), currency (ISO 4217 code, guess from symbols/context, default USD), occurred_on (ISO 8601 date YYYY-MM-DD), category (one of: ${AI_CATEGORY_NAMES.join(", ")}), kind ("income" or "expense", almost always "expense" for a receipt).

CRITICAL DATE RULE: Thai receipts often print the date in the Buddhist Era (BE), not Gregorian. If the printed year is 2500 or greater, it is a Buddhist Era year — subtract 543 to get the Gregorian year (e.g. 2568 BE -> 2025 CE). Thai month abbreviations map to numbers: ม.ค.=01, ก.พ.=02, มี.ค.=03, เม.ย.=04, พ.ค.=05, มิ.ย.=06, ก.ค.=07, ส.ค.=08, ก.ย.=09, ต.ค.=10, พ.ย.=11, ธ.ค.=12.

Return ONLY valid JSON: { "description": string, "amount": number, "currency": string, "occurred_on": string, "category": string, "kind": "income" | "expense" }. No markdown fences, no commentary.`;

function parseJsonBlock<T>(text: string): T {
  return JSON.parse(text.replace(/^```json\s*|```$/g, "").trim()) as T;
}

async function callClaudeVision(
  imageDataUrl: string,
  system: string,
  userText: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
  if (!apiKey) throw new Error("AI is not configured. Set ANTHROPIC_API_KEY.");

  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  const [, mediaType, base64Data] = match;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
            { type: "text", text: userText },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[ledger ai] anthropic error", res.status, body);
    throw new Error("AI extraction failed. Please try again or enter the details manually.");
  }

  const json = (await res.json()) as { content?: { type?: string; text?: string }[] };
  const content = json.content?.find((block) => block.type === "text")?.text;
  if (!content) throw new Error("AI returned no content.");
  return content;
}

export const extractReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageDataUrl: string }) => {
    if (!input?.imageDataUrl) throw new Error("Missing image data");
    return input;
  })
  .handler(async ({ data }): Promise<ExtractedReceipt> => {
    const text = await callClaudeVision(
      data.imageDataUrl,
      RECEIPT_SYSTEM_PROMPT,
      "Extract the transaction details from this receipt image.",
    );
    const parsed = parseJsonBlock<Partial<ExtractedReceipt>>(text);
    return {
      description: parsed.description ?? "Receipt",
      amount: typeof parsed.amount === "number" ? parsed.amount : Number(parsed.amount) || 0,
      currency: (parsed.currency ?? "USD").toUpperCase(),
      occurred_on: parsed.occurred_on ?? new Date().toISOString().slice(0, 10),
      category: parsed.category ?? "Other",
      kind: parsed.kind === "income" ? "income" : "expense",
    };
  });

const CATEGORIZE_SYSTEM_PROMPT = `You categorize bank/credit-card transactions for a financial ledger app.

Categories: ${AI_CATEGORY_NAMES.join(", ")}. kind is "income" for money in, "expense" for money out.

Return ONLY a valid JSON array, one object per input row in the same order: [{ "category": string, "kind": "income" | "expense" }, ...]. No markdown fences, no commentary.`;

export const categorizeRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { rows: { description: string; amount: number }[] }) => {
    if (!Array.isArray(input?.rows)) throw new Error("Missing rows");
    return input;
  })
  .handler(async ({ data }): Promise<{ category: string; kind: "income" | "expense" }[]> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
    const fallback = data.rows.map((r) => ({
      category: "Other",
      kind: (r.amount >= 0 ? "income" : "expense") as "income" | "expense",
    }));
    if (!apiKey || !data.rows.length) return fallback;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          system: CATEGORIZE_SYSTEM_PROMPT,
          messages: [{ role: "user", content: JSON.stringify(data.rows) }],
        }),
      });
      if (!res.ok) return fallback;

      const json = (await res.json()) as { content?: { type?: string; text?: string }[] };
      const content = json.content?.find((block) => block.type === "text")?.text;
      if (!content) return fallback;

      const parsed = parseJsonBlock<{ category: string; kind: string }[]>(content);
      if (!Array.isArray(parsed) || parsed.length !== data.rows.length) return fallback;
      return parsed.map((p) => ({
        category: p.category || "Other",
        kind: p.kind === "income" ? "income" : "expense",
      }));
    } catch (error) {
      console.error("[ledger ai] categorize failed", error);
      return fallback;
    }
  });

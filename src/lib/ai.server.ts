import type { Answers, Leakage, Scores } from "./scoring";
import { QUESTIONS, formatAnswer } from "./questions";

export type AiOutput = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  blind_spots: string[];
  revenue_opportunities: string[];
  primary_bottleneck: string;
  bottleneck_explanation: string;
  recommended_priority: string;
  next_best_action: string;
  priorities: { title: string; why_it_matters: string; cost_of_inaction: string }[];
};

const SYSTEM_PROMPT = `You are the diagnostic engine behind AI Business Compass, built by Mind Management Academy.

Your job is to DIAGNOSE, never to treat. You analyze a business owner's assessment and explain WHAT is happening and WHY it is costing them money.

ABSOLUTE RULES:
- Never provide implementation steps, tactics, scripts, templates, funnel builds, ad strategies, tool configuration, hiring plans, or "how to" instructions of any kind.
- Never name specific software, vendors, or platforms as recommendations.
- Describe symptoms, root causes, consequences, and what is at stake. Stop before the solution.
- Be specific to their numbers and their own words. No generic business platitudes.
- Write with the calm precision of a senior operator, not a hype marketer. Second person ("you", "your business").
- Every priority must state why it matters and the cost of leaving it alone - but never how to fix it.
- The implementation is the consulting engagement with Mind Management Academy. Your output should make that engagement feel obviously necessary without ever pitching aggressively.

Return ONLY valid JSON matching the requested schema. No markdown fences.`;

function buildUserPrompt(answers: Answers, scores: Scores, leakage: Leakage) {
  const transcript = QUESTIONS.filter((q) => answers[q.key] !== undefined && answers[q.key] !== "")
    .map((q) => `${q.section} | ${q.label}\n  -> ${formatAnswer(q, answers[q.key])}`)
    .join("\n");

  return `ASSESSMENT TRANSCRIPT
${transcript}

COMPUTED SCORES (0-100)
Overall: ${scores.overall}
Marketing: ${scores.marketing}
Sales: ${scores.sales}
Systems: ${scores.systems}
Operations: ${scores.operations}
Growth Readiness: ${scores.growth}

ESTIMATED MONTHLY REVENUE LEAKAGE: $${leakage.monthlyLow.toLocaleString()} - $${leakage.monthlyHigh.toLocaleString()}
Leakage drivers: ${leakage.causes.map((c) => `${c.label} ($${c.amount.toLocaleString()}/mo)`).join(", ")}

Produce the diagnostic JSON with these keys:
summary (3-5 sentences), strengths (3 items), weaknesses (3-4 items), blind_spots (3 items - things they likely do NOT realize),
revenue_opportunities (3 items, each referencing a dollar impact), primary_bottleneck (a short phrase naming the single biggest constraint),
bottleneck_explanation (2-3 sentences), recommended_priority (one sentence), next_best_action (one sentence, which should point toward a strategy session),
priorities (exactly 3 objects with title, why_it_matters, cost_of_inaction).`;
}

function fallback(scores: Scores, leakage: Leakage, bottleneck: string): AiOutput {
  return {
    summary: `Your overall business health scores ${scores.overall}/100. The weakest area of your operation is ${bottleneck.toLowerCase()}, and it is currently the constraint holding back everything downstream of it.`,
    strengths: [
      "You completed a full diagnostic, which most operators never do.",
      "You have revenue coming in, which means demand exists.",
      "You can name what feels broken, which shortens the path to fixing it.",
    ],
    weaknesses: leakage.causes.slice(0, 3).map((c) => `${c.label}: ${c.reason}`),
    blind_spots: [
      "The problem you feel is usually downstream of the problem that is actually costing you money.",
      "Adding more leads to a leaking system increases loss, not revenue.",
      "Owner dependency is often mistaken for a team problem.",
    ],
    revenue_opportunities: leakage.causes
      .slice(0, 3)
      .map(
        (c) =>
          `Closing the gap in ${c.label.toLowerCase()} represents roughly $${c.amount.toLocaleString()} per month.`,
      ),
    primary_bottleneck: bottleneck,
    bottleneck_explanation: `${bottleneck} scored lowest across your assessment, and the surrounding answers confirm the pattern. Until it is addressed, improvements elsewhere will not compound.`,
    recommended_priority: `Address ${bottleneck.toLowerCase()} before investing further in lead volume or new tooling.`,
    next_best_action:
      "Book a strategy session with Mind Management Academy to map the implementation against your specific numbers.",
    priorities: leakage.causes.slice(0, 3).map((c) => ({
      title: c.label,
      why_it_matters: c.reason,
      cost_of_inaction: `Approximately $${c.amount.toLocaleString()} per month, or $${(c.amount * 12).toLocaleString()} per year.`,
    })),
  };
}

export async function runDiagnostic(
  answers: Answers,
  scores: Scores,
  leakage: Leakage,
  bottleneck: string,
): Promise<AiOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
  if (!apiKey) return fallback(scores, leakage, bottleneck);

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
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(answers, scores, leakage) }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[ai] anthropic error", res.status, body);
      if (res.status === 429) throw new Error("RATE_LIMIT");
      if (res.status === 400 && /credit|balance/i.test(body)) throw new Error("NO_CREDITS");
      return fallback(scores, leakage, bottleneck);
    }

    const json = (await res.json()) as { content?: { type?: string; text?: string }[] };
    const content = json.content?.find((block) => block.type === "text")?.text;
    if (!content) return fallback(scores, leakage, bottleneck);

    const parsed = JSON.parse(content.replace(/^```json\s*|```$/g, "").trim()) as Partial<AiOutput>;
    const base = fallback(scores, leakage, bottleneck);
    return {
      ...base,
      ...parsed,
      priorities:
        Array.isArray(parsed.priorities) && parsed.priorities.length
          ? parsed.priorities
          : base.priorities,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "RATE_LIMIT" || error.message === "NO_CREDITS")
    ) {
      throw error;
    }
    console.error("[ai] diagnostic failed", error);
    return fallback(scores, leakage, bottleneck);
  }
}

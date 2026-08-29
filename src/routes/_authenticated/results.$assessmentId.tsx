import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ScoreBar, ScoreRing } from "@/components/brand/ScoreRing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReport, redeemAccessCode } from "@/lib/assessment.functions";
import { money, type Leakage, type Scores } from "@/lib/scoring";
import type { AiOutput } from "@/lib/ai.server";

const WHOP_URL = "https://whop.com/mind-management-academy-hq/your-ai-business-compass";
const CALENDLY_URL = "https://calendly.com/mind-management/lets-connect";

export const Route = createFileRoute("/_authenticated/results/$assessmentId")({
  head: () => ({
    meta: [
      { title: "Your results — AI Business Compass™" },
      { name: "description", content: "Your business scores, revenue leakage and primary bottleneck." },
      { property: "og:title", content: "Your results — AI Business Compass™" },
      { property: "og:description", content: "Your scores, revenue leakage and primary bottleneck." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Results,
});

function Results() {
  const { assessmentId } = Route.useParams();
  const load = useServerFn(getReport);
  const redeem = useServerFn(redeemAccessCode);
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["report", assessmentId],
    queryFn: () => load({ data: { assessmentId } }),
  });

  const unlock = useMutation({
    mutationFn: async () => redeem({ data: { assessmentId, code } }),
    onSuccess: () => {
      toast.success("Growth Roadmap unlocked.");
      queryClient.invalidateQueries({ queryKey: ["report", assessmentId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't redeem that code."),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-5 py-24 text-center">
          <h1 className="font-display text-2xl font-semibold">Report not found</h1>
          <Button className="mt-6" asChild>
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const scores = data.scores as unknown as Scores;
  const leakage = data.leakage as unknown as Leakage;
  const ai = data.ai_output as unknown as AiOutput;
  const premium = Boolean(data.has_premium);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-5 py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8 rounded-3xl border border-border/70 bg-card p-10 text-center shadow-soft"
        >
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Your Business Compass
          </span>
          <ScoreRing score={scores.overall} />
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">{ai.summary}</p>
        </motion.div>

        <div className="mt-6 grid gap-6 rounded-3xl border border-border/70 bg-card p-8 shadow-soft sm:grid-cols-2">
          <ScoreBar label="Marketing" score={scores.marketing} delay={0.05} />
          <ScoreBar label="Sales" score={scores.sales} delay={0.1} />
          <ScoreBar label="Systems" score={scores.systems} delay={0.15} />
          <ScoreBar label="Operations" score={scores.operations} delay={0.2} />
          <ScoreBar label="Growth readiness" score={scores.growth} delay={0.25} />
        </div>

        <div className="mt-6 rounded-3xl border border-primary/30 bg-card p-8 shadow-lift">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Primary bottleneck
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {ai.primary_bottleneck}
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{ai.bottleneck_explanation}</p>
        </div>

        <div className="mt-6 rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Estimated revenue leakage</h2>
          <p className="mt-3 font-display text-4xl font-semibold text-gradient-gold">
            {money(leakage.monthlyLow)} – {money(leakage.monthlyHigh)}
            <span className="ml-2 text-base font-normal text-muted-foreground">/ month</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Up to {money(leakage.annualHigh)} per year, based on your own numbers.
          </p>
          <div className="mt-6 space-y-4">
            {leakage.causes.map((c) => (
              <div key={c.label} className="border-t border-border pt-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="font-display text-sm font-semibold tabular-nums text-primary">
                    {money(c.amount)}/mo
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <ListCard title="Strengths" items={ai.strengths} />
          <ListCard title="Weaknesses" items={ai.weaknesses} />
          <ListCard title="Blind spots" items={ai.blind_spots} />
        </div>

        <div className="relative mt-6 overflow-hidden rounded-3xl border border-primary/30 bg-card p-8 shadow-lift">
          <h2 className="font-display text-2xl font-semibold">Your Growth Roadmap</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The ranked sequence of what's costing you most — and what it costs to leave it alone.
          </p>

          <div className={premium ? "mt-7 space-y-5" : "mt-7 space-y-5 select-none blur-[6px]"}>
            {(premium ? ai.priorities : ai.priorities.slice(0, 3)).map((p, i) => (
              <div key={p.title} className="rounded-2xl border border-border bg-background/60 p-6">
                <span className="font-display text-xs font-semibold tracking-widest text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.why_it_matters}</p>
                <p className="mt-2 text-sm text-primary/90">{p.cost_of_inaction}</p>
              </div>
            ))}
          </div>

          {!premium ? (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 bg-gradient-to-t from-card via-card/95 to-transparent px-8 pb-8 pt-24 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Unlock your full Growth Roadmap and revenue opportunities for $9.99.
              </p>
              <Button asChild>
                <a href={WHOP_URL} target="_blank" rel="noreferrer">
                  Unlock for $9.99
                </a>
              </Button>
              <div className="flex w-full max-w-sm gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter your access code"
                  maxLength={40}
                />
                <Button variant="outline" onClick={() => unlock.mutate()} disabled={unlock.isPending}>
                  Redeem
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {premium ? (
          <div className="mt-6 rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
            <h2 className="font-display text-xl font-semibold">Revenue opportunities</h2>
            <ul className="mt-4 space-y-3">
              {ai.revenue_opportunities.map((o) => (
                <li key={o} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {o}
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-border pt-6">
              <p className="text-sm font-medium">Next best action</p>
              <p className="mt-2 text-sm text-muted-foreground">{ai.next_best_action}</p>
            </div>
          </div>
        ) : null}

        <div className="relative mt-6 overflow-hidden rounded-3xl border border-primary/30 bg-card p-9 text-center shadow-lift">
          <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-semibold">
              Diagnosis is step one. Implementation is step two.
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              This report tells you what's broken and what it's costing you. A strategy session with Mind
              Management Academy is where we map exactly how to fix {ai.primary_bottleneck?.toLowerCase() || "it"}
              {" "}for your business.
            </p>
            <Button size="lg" asChild>
              <a href={CALENDLY_URL} target="_blank" rel="noreferrer">
                Book a Strategy Session
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Button variant="outline" asChild>
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {(items ?? []).map((item) => (
          <li key={item} className="flex gap-3 text-sm text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
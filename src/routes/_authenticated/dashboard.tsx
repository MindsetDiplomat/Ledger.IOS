import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ScoreRing } from "@/components/brand/ScoreRing";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/assessment.functions";
import { money, type Leakage, type Scores } from "@/lib/scoring";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Business Compass™" },
      { name: "description", content: "Your business diagnostics, scores and reports in one place." },
      { property: "og:title", content: "Dashboard — AI Business Compass™" },
      { property: "og:description", content: "Your business diagnostics, scores and reports." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const load = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => load({}) });

  if (isLoading || !data) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const latest = data.reports[0];
  const scores = (latest?.scores ?? null) as Scores | null;
  const leakage = (latest?.leakage ?? null) as Leakage | null;

  return (
    <AppShell isAdmin={data.isAdmin}>
      <div className="mx-auto max-w-5xl px-5 py-14">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          {data.profile?.full_name ? `Welcome back, ${data.profile.full_name.split(" ")[0]}.` : "Welcome back."}
        </h1>
        <p className="mt-2 text-muted-foreground">Your business diagnostics and reports.</p>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border/70 bg-card p-10 shadow-soft">
            {scores ? (
              <ScoreRing score={scores.overall} label="Overall Compass score" />
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No score yet.</p>
                <Button className="mt-5" asChild>
                  <Link to="/assessment">Start your diagnostic</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Estimated monthly leakage</h2>
            <p className="mt-3 font-display text-4xl font-semibold text-gradient-gold">
              {leakage ? `${money(leakage.monthlyLow)} – ${money(leakage.monthlyHigh)}` : "—"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {leakage
                ? `Roughly ${money(leakage.annualHigh)} per year based on your current numbers.`
                : "Complete a diagnostic to see what your gaps are costing you."}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {data.inProgress ? (
                <Button asChild>
                  <Link to="/assessment">Resume diagnostic</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/assessment">
                    <Plus className="h-4 w-4" />
                    New diagnostic
                  </Link>
                </Button>
              )}
              {latest ? (
                <Button variant="outline" asChild>
                  <Link to="/results/$assessmentId" params={{ assessmentId: latest.assessment_id }}>
                    View latest report
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {data.reports.length ? (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold">Past reports</h2>
            <div className="mt-4 divide-y divide-border overflow-hidden rounded-3xl border border-border/70 bg-card">
              {data.reports.map((r) => {
                const s = r.scores as unknown as Scores;
                return (
                  <Link
                    key={r.id}
                    to="/results/$assessmentId"
                    params={{ assessmentId: r.assessment_id }}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-secondary"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.has_premium ? "Growth Roadmap unlocked" : "Free diagnosis"}
                      </p>
                    </div>
                    <span className="font-display text-lg font-semibold tabular-nums">{s?.overall ?? "—"}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
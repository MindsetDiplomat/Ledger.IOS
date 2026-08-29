import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { adminGetAssessment } from "@/lib/admin.functions";
import { QUESTIONS, formatAnswer } from "@/lib/questions";

export const Route = createFileRoute("/_authenticated/admin/$assessmentId")({
  head: () => ({
    meta: [
      { title: "Submission — AI Business Compass™" },
      { name: "description", content: "Full transcript of a submitted business diagnostic." },
      { property: "og:title", content: "Submission — AI Business Compass™" },
      { property: "og:description", content: "Full transcript of a submitted diagnostic." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDetail,
});

function AdminDetail() {
  const { assessmentId } = Route.useParams();
  const load = useServerFn(adminGetAssessment);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-detail", assessmentId],
    queryFn: () => load({ data: { assessmentId } }),
  });

  if (isLoading) {
    return (
      <AppShell isAdmin>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell isAdmin>
        <p className="px-5 py-24 text-center text-sm text-destructive">Unable to load this submission.</p>
      </AppShell>
    );
  }

  return (
    <AppShell isAdmin>
      <div className="mx-auto max-w-3xl px-5 py-14">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">← All submissions</Link>
        </Button>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">
          {data.profile?.full_name || "Submission"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.profile?.email} · {data.profile?.company || "—"}
        </p>

        <div className="mt-10 divide-y divide-border overflow-hidden rounded-3xl border border-border/70 bg-card">
          {QUESTIONS.filter((q) => data.answers[q.key] !== undefined).map((q) => (
            <div key={q.key} className="px-6 py-4">
              <p className="text-xs uppercase tracking-wider text-primary">{q.section}</p>
              <p className="mt-1 text-sm font-medium">{q.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatAnswer(q, data.answers[q.key])}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
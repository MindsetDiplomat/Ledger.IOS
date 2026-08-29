import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { adminListAssessments } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — AI Business Compass™" },
      { name: "description", content: "Review submitted diagnostics and client answers." },
      { property: "og:title", content: "Admin — AI Business Compass™" },
      { property: "og:description", content: "Review submitted diagnostics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const UNLOCK_PRICE = 9.99;

function AdminPage() {
  const load = useServerFn(adminListAssessments);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-list"],
    queryFn: () => load({}),
  });
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const list = data?.rows ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) =>
      [r.name, r.email, r.company, r.industries.join(" ")].join(" ").toLowerCase().includes(term),
    );
  }, [data, q]);

  const stats = useMemo(() => {
    const all = data?.rows ?? [];
    const total = all.length;
    const premiumCount = all.filter((r) => r.hasPremium).length;
    const overalls = all.map((r) => r.overall).filter((n): n is number => n !== null);
    const avgScore = overalls.length ? overalls.reduce((a, b) => a + b, 0) / overalls.length : null;
    const conversionRate = total ? (premiumCount / total) * 100 : 0;
    const revenue = premiumCount * UNLOCK_PRICE;
    return { total, premiumCount, avgScore, conversionRate, revenue };
  }, [data]);

  return (
    <AppShell isAdmin>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Submissions</h1>
        <p className="mt-2 text-muted-foreground">
          Every completed diagnostic and the answers behind it.
        </p>

        {data ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total submissions" value={String(stats.total)} />
            <StatCard
              label="Average score"
              value={stats.avgScore !== null ? stats.avgScore.toFixed(0) : "—"}
            />
            <StatCard
              label="Premium conversion"
              value={`${stats.conversionRate.toFixed(1)}%`}
              hint={`${stats.premiumCount} of ${stats.total} unlocked`}
            />
            <StatCard
              label="Estimated revenue"
              value={stats.revenue.toLocaleString(undefined, {
                style: "currency",
                currency: "USD",
              })}
              hint={`$${UNLOCK_PRICE} × ${stats.premiumCount} unlocks`}
            />
          </div>
        ) : null}

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, company or industry"
          className="mt-8 max-w-md"
        />

        {isLoading ? (
          <div className="flex py-20 justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="mt-10 text-sm text-destructive">You don't have access to this area.</p>
        ) : (
          <div className="mt-6 divide-y divide-border overflow-hidden rounded-3xl border border-border/70 bg-card">
            {rows.map((r) => (
              <Link
                key={r.assessmentId}
                to="/admin/$assessmentId"
                params={{ assessmentId: r.assessmentId }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-secondary"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.email} · {r.company || "—"} · {r.industries.join(", ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-muted-foreground">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                  </span>
                  <span className="font-display text-lg font-semibold tabular-nums">
                    {r.overall ?? "—"}
                  </span>
                </div>
              </Link>
            ))}
            {!rows.length ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                No submissions yet.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

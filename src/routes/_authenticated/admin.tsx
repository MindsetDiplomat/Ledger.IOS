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

function AdminPage() {
  const load = useServerFn(adminListAssessments);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-list"], queryFn: () => load({}) });
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const list = data?.rows ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) =>
      [r.name, r.email, r.company, r.industries.join(" ")].join(" ").toLowerCase().includes(term),
    );
  }, [data, q]);

  return (
    <AppShell isAdmin>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Submissions</h1>
        <p className="mt-2 text-muted-foreground">Every completed diagnostic and the answers behind it.</p>

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
                  <span className="font-display text-lg font-semibold tabular-nums">{r.overall ?? "—"}</span>
                </div>
              </Link>
            ))}
            {!rows.length ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">No submissions yet.</p>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
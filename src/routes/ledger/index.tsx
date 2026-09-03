import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import {
  ArrowUpRight,
  Camera,
  Sparkles,
  TrendingDown,
  Wallet,
  Compass,
  ShieldCheck,
  Check,
} from "lucide-react";
import hero from "@/assets/hero.svg";

export const Route = createFileRoute("/ledger/")({
  head: () => ({
    meta: [
      { title: "Ledger — Stop the leaks. Grow what you keep." },
      {
        name: "description",
        content:
          "AI-powered financial audit for entrepreneurs. Upload receipts and statements, uncover hidden money leaks, and get a personalized freedom roadmap.",
      },
      { property: "og:title", content: "Ledger — Stop the leaks. Grow what you keep." },
      { property: "og:description", content: "Find $300+/mo in hidden leaks in under 15 minutes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <img
            src={hero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 md:pt-36 md:pb-44">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-bronze animate-pulse" />
              Personal financial audit · built for operators
            </div>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] md:text-7xl">
              You can&apos;t grow <span className="text-bronze">what you</span>
              <br />
              <span className="italic text-muted-foreground">can&apos;t track.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Upload receipts and bank statements. Ledger&apos;s AI categorizes every transaction,
              surfaces hidden leaks, and hands you a personalized freedom roadmap — in under 15
              minutes.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="https://whop.com/joined/mind-management-academy-hq/products/ledger-82/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-md bg-gradient-bronze px-6 py-3.5 text-sm font-medium text-bronze-foreground shadow-elegant transition hover:brightness-110"
              >
                Start your $7 audit
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <Link
                to="/ledger/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                Or track for free →
              </Link>
            </div>

            {/* Proof bar */}
            <div className="mt-16 grid max-w-2xl grid-cols-3 gap-8 border-t border-border/60 pt-8">
              <Stat value="$327" label="avg. monthly leak found" />
              <Stat value="15min" label="to first insight" />
              <Stat value="4×" label="cash-flow lift on plan" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-bronze">The audit</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Four lenses on your money.</h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
          <Feature
            icon={<Camera className="h-5 w-5" />}
            title="Receipt capture & currency"
            body="Snap a receipt in Bangkok or London. Ledger converts THB / GBP / USD using the rate from the transaction date — not today's."
          />
          <Feature
            icon={<TrendingDown className="h-5 w-5" />}
            title="Daily → yearly cash-flow"
            body="Toggle daily, monthly, quarterly, 180-day, and YTD. See the curve of every dollar in and out."
          />
          <Feature
            icon={<Wallet className="h-5 w-5" />}
            title="Investment ledger"
            body="Track every position with entry date and cost basis. Know exactly how long you've held and what it's done."
          />
          <Feature
            icon={<Sparkles className="h-5 w-5" />}
            title="Expense-to-income dashboard"
            body="A live ratio from $0 to $1M+ with YTD expense breakdown by category. Cash flow becomes obvious."
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid gap-12 md:grid-cols-[1fr,2fr] md:gap-20">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-bronze">The journey</p>
              <h2 className="mt-3 font-display text-4xl md:text-5xl">
                Upload → Analyze → Discover → Plan.
              </h2>
              <p className="mt-6 text-muted-foreground">
                Most people don&apos;t need to earn more first. They need to stop leaking. Ledger
                finds the leaks, then gives you the next move.
              </p>
            </div>
            <ol className="space-y-px overflow-hidden rounded-2xl border border-border bg-border">
              <Step
                n="01"
                title="Upload"
                body="Receipts as photos, statements as PDF/CSV/bank export. We handle the rest."
              />
              <Step
                n="02"
                title="AI categorization"
                body="Every transaction sorted, tagged, and converted to your base currency."
              />
              <Step
                n="03"
                title="Leak detection"
                body="Subscriptions, recurring fees, and spending patterns that don't match your goals."
              />
              <Step
                n="04"
                title="Freedom roadmap"
                body="A 30-day, 90-day, and annual plan — with progress tracking."
              />
            </ol>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="mx-auto max-w-4xl px-6 py-24 md:py-32 text-center">
        <p className="font-display text-3xl leading-tight md:text-5xl">
          &ldquo;You are losing <span className="text-bronze">$327/month</span> to subscriptions,
          fees, and spending habits that aren&apos;t aligned with your goals.&rdquo;
        </p>
        <p className="mt-6 text-sm text-muted-foreground">— A typical Ledger audit, week one.</p>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-bronze">Pricing</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">One audit. Seven dollars.</h2>
          </div>
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-6xl">$7</span>
              <span className="text-muted-foreground">/ one-time audit</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Free to track your own money. $7 for an AI-written freedom roadmap.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Unlimited receipt uploads",
                "Bank statement import (CSV)",
                "Multi-currency with historical rates",
                "AI leak detection & roadmap",
                "Investment ledger",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-bronze" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://whop.com/joined/mind-management-academy-hq/products/ledger-82/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-gradient-bronze px-5 py-3 text-sm font-medium text-bronze-foreground shadow-elegant transition hover:brightness-110"
            >
              Start audit
            </a>
            <Link
              to="/ledger/dashboard"
              className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Or just track for free →
            </Link>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Bank-grade encryption · cancel anytime
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <Logo />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ledger. Built for operators.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <img src="/mma-logo.jpg" alt="Mind Management Academy" className="h-8 w-auto" />
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl text-bronze">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="group relative bg-card p-8 transition hover:bg-card/70">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-bronze/10 text-bronze">
        {icon}
      </div>
      <h3 className="mt-6 font-display text-2xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex items-start gap-6 bg-card p-6 md:p-8">
      <div className="font-display text-2xl text-bronze tabular-nums">{n}</div>
      <div>
        <h4 className="font-display text-xl">{title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <Compass className="ml-auto hidden h-5 w-5 text-muted-foreground/50 md:block" />
    </li>
  );
}

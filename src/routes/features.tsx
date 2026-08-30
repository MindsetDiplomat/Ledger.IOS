import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Download,
  Gauge,
  Lock,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";

const CALENDLY_URL = "https://calendly.com/mind-management/lets-connect";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — AI Business Compass™" },
      {
        name: "description",
        content:
          "See exactly what the AI Business Compass diagnostic gives you: an 8-system health score, a revenue leakage calculator, a ranked growth roadmap, and a downloadable business snapshot.",
      },
      { property: "og:title", content: "Features — AI Business Compass™" },
      {
        property: "og:description",
        content: "An 8-system health score, revenue leakage calculator, ranked growth roadmap and a downloadable report.",
      },
    ],
  }),
  component: FeaturesPage,
});

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const FEATURES = [
  {
    icon: Gauge,
    title: "AI Business Diagnostic",
    body: "A focused, 30+ question assessment across eight growth systems — Offer, Marketing, Sales, Systems, Operations, Team, Revenue and Goals. One question at a time, progress saves automatically.",
  },
  {
    icon: Sparkles,
    title: "Business Health Dashboard",
    body: "An overall Business Compass score plus a weighted score for every system, color-coded so the weak spot is obvious at a glance instead of buried in a wall of numbers.",
  },
  {
    icon: TrendingDown,
    title: "Revenue Leakage Calculator",
    body: "A dollar figure, not a vague warning. We tie your own answers — follow-up, close rate, automation, CRM usage — to an estimated monthly and annual revenue leakage, broken down by cause.",
  },
  {
    icon: RouteIcon,
    title: "Growth Roadmap",
    body: "The AI reads your full transcript and ranks your top priorities in order, with why it matters and the cost of leaving it alone for each one. It tells you what's broken — never how to fix it.",
  },
  {
    icon: Download,
    title: "Business Snapshot PDF",
    body: "A clean, presentation-ready PDF of your full report — professional enough to send to a business partner, co-founder, or your own advisor.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Your assessment and reports are stored under row-level security in Supabase — visible only to your account (and admins reviewing submissions on our end). Nothing is shared or sold.",
  },
];

function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/12 blur-[140px]" />
        <div className="relative mx-auto max-w-3xl px-5 pb-20 pt-24 text-center sm:pt-32">
          <motion.div {...fade}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              What you get
            </span>
          </motion.div>
          <motion.h1
            {...fade}
            transition={{ ...fade.transition, delay: 0.05 }}
            className="mt-8 text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Everything you need to see
            <br />
            <span className="text-gradient-gold">what's actually broken.</span>
          </motion.h1>
          <motion.p
            {...fade}
            transition={{ ...fade.transition, delay: 0.12 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            No dashboards to configure. No generic advice. One diagnostic, scored against your own numbers,
            pointing at one constraint.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fade}
              transition={{ ...fade.transition, delay: i * 0.06 }}
              className="rounded-3xl border border-border/70 bg-card p-7 shadow-soft transition-shadow duration-500 hover:shadow-lift"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center">
          <motion.h2 {...fade} className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Free score. Paid roadmap.
          </motion.h2>
          <motion.p
            {...fade}
            transition={{ ...fade.transition, delay: 0.06 }}
            className="mx-auto mt-4 max-w-xl text-muted-foreground"
          >
            The full diagnosis — your scores, revenue leakage, and named bottleneck — is free. The ranked
            Growth Roadmap with cost-of-inaction on every priority unlocks for a one-time $9.99.
          </motion.p>
          <motion.div {...fade} transition={{ ...fade.transition, delay: 0.12 }} className="mt-8">
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">
                <Lock className="h-4 w-4" />
                See full pricing
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <motion.h2 {...fade} className="text-balance font-display text-4xl font-semibold tracking-tight">
          Ready to see your score?
        </motion.h2>
        <motion.div
          {...fade}
          transition={{ ...fade.transition, delay: 0.1 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Take the free diagnostic
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={CALENDLY_URL} target="_blank" rel="noreferrer">
              Already know your bottleneck? Book a call
            </a>
          </Button>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
}

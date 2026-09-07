import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Compass,
  Gauge,
  LineChart,
  Lock,
  Sparkles,
  Target,
  TrendingDown,
  Users,
} from "lucide-react";
const CALENDLY_URL = "https://calendly.com/mind-management/lets-connect";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Business Compass™ — Find the bottleneck blocking your growth" },
      {
        name: "description",
        content:
          "A 5-minute AI diagnostic for coaches, consultants, investors and agency owners. Score your business, quantify revenue leakage, and see the one constraint holding you back.",
      },
      { property: "og:title", content: "AI Business Compass™ — Find your #1 growth bottleneck" },
      {
        property: "og:description",
        content:
          "Score your business across 8 growth systems, quantify what your gaps cost you every month, and pinpoint the single constraint capping your revenue.",
      },
    ],
  }),
  component: Landing,
});

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const PILLARS = [
  { icon: Target, title: "Offer", body: "Whether your promise, pricing and positioning can actually carry scale." },
  { icon: LineChart, title: "Marketing", body: "How predictably attention turns into qualified conversations." },
  { icon: Users, title: "Sales", body: "Where deals stall, leak and quietly disappear from your pipeline." },
  { icon: Gauge, title: "Systems", body: "What runs on process versus what runs on your memory." },
  { icon: Compass, title: "Operations", body: "How much delivery depends on you being personally involved." },
  { icon: Sparkles, title: "Team", body: "Whether your people multiply capacity or consume it." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/12 blur-[140px]" />
        <div className="relative mx-auto max-w-4xl px-5 pb-24 pt-24 text-center sm:pt-32">
          <motion.div {...fade}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              By Mind Management Academy
            </span>
          </motion.div>

          <motion.h1
            {...fade}
            transition={{ ...fade.transition, delay: 0.05 }}
            className="mt-8 text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
          >
            Find the one thing
            <br />
            <span className="text-gradient-gold">capping your growth.</span>
          </motion.h1>

          <motion.p
            {...fade}
            transition={{ ...fade.transition, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            AI Business Compass™ is a precision diagnostic for coaches, consultants, real estate investors,
            agency owners and service businesses. Answer a focused set of questions and get a scored picture
            of your business, the revenue you're quietly leaking, and the single bottleneck to fix first.
          </motion.p>

          <motion.div
            {...fade}
            transition={{ ...fade.transition, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Take the free diagnostic
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">I already have an account</Link>
            </Button>
          </motion.div>

          <motion.p
            {...fade}
            transition={{ ...fade.transition, delay: 0.28 }}
            className="mt-5 text-xs text-muted-foreground"
          >
            Takes about 5 minutes · Free score and diagnosis · No card required
          </motion.p>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 sm:grid-cols-3">
          {[
            { stat: "8", label: "growth systems scored" },
            { stat: "30+", label: "diagnostic questions" },
            { stat: "1", label: "primary bottleneck identified" },
          ].map((item, i) => (
            <motion.div key={item.label} {...fade} transition={{ ...fade.transition, delay: i * 0.08 }} className="text-center">
              <div className="font-display text-4xl font-semibold text-gradient-gold">{item.stat}</div>
              <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <motion.h2 {...fade} className="text-center font-display text-4xl font-semibold tracking-tight">
          What gets measured
        </motion.h2>
        <motion.p {...fade} transition={{ ...fade.transition, delay: 0.06 }} className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Growth doesn't stall everywhere at once. It stalls in one place — and everything downstream inherits
          the damage. The Compass scores each system independently so the real constraint stops hiding.
        </motion.p>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              {...fade}
              transition={{ ...fade.transition, delay: i * 0.06 }}
              className="rounded-3xl border border-border/70 bg-card p-7 shadow-soft transition-shadow duration-500 hover:shadow-lift"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-5xl px-5 py-24">
          <motion.h2 {...fade} className="text-center font-display text-4xl font-semibold tracking-tight">
            How it works
          </motion.h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Answer honestly",
                body: "One question at a time, in plain language. Your progress saves automatically, so you can stop and resume.",
              },
              {
                n: "02",
                title: "Get scored",
                body: "A deterministic engine scores eight systems and estimates the revenue your gaps are costing you each month.",
              },
              {
                n: "03",
                title: "See the bottleneck",
                body: "AI reads your full transcript and names the one constraint capping your revenue — and what it costs to ignore it.",
              },
            ].map((step, i) => (
              <motion.div key={step.n} {...fade} transition={{ ...fade.transition, delay: i * 0.1 }}>
                <div className="font-display text-sm font-semibold tracking-widest text-primary">{step.n}</div>
                <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div {...fade} className="rounded-3xl border border-border/70 bg-card p-9 shadow-soft">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <TrendingDown className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold">Free diagnosis</h3>
            <p className="mt-2 text-sm text-muted-foreground">Everything you need to see the problem clearly.</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {[
                "Overall Business Compass score",
                "Section-by-section system scores",
                "Estimated monthly revenue leakage",
                "Your primary bottleneck, named and explained",
                "Strengths, weaknesses and blind spots",
              ].map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Start free
              </Link>
            </Button>
          </motion.div>

          <motion.div
            {...fade}
            transition={{ ...fade.transition, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card p-9 shadow-lift"
          >
            <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold">
                Growth Roadmap <span className="text-gradient-gold">$9.99</span>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The full priority sequence and the cost of leaving each gap alone.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {[
                  "Everything in the free diagnosis",
                  "Ranked priority roadmap with reasoning",
                  "Cost-of-inaction on every priority",
                  "Revenue opportunity breakdown",
                  "Downloadable PDF report",
                ].map((f) => (
                  <li key={f} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get your score first
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-28 text-center">
        <motion.h2 {...fade} className="text-balance font-display text-4xl font-semibold tracking-tight">
          You can't fix what you can't see.
        </motion.h2>
        <motion.p {...fade} transition={{ ...fade.transition, delay: 0.08 }} className="mt-4 text-muted-foreground">
          Five minutes of honest answers is usually the difference between another year of guessing and a
          clear line to your next level.
        </motion.p>
        <motion.div
          {...fade}
          transition={{ ...fade.transition, delay: 0.16 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Take the diagnostic
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
// Force redeploy

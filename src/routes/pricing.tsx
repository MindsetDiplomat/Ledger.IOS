import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Lock, Sparkles, TrendingDown } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const CALENDLY_URL = "https://calendly.com/mind-management/lets-connect";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — AI Business Compass™" },
      {
        name: "description",
        content:
          "The AI Business Compass diagnostic is free. Unlock the full ranked Growth Roadmap for a one-time $9.99 — no subscription.",
      },
      { property: "og:title", content: "Pricing — AI Business Compass™" },
      {
        property: "og:description",
        content: "Free diagnosis. One-time $9.99 Growth Roadmap. No subscription.",
      },
    ],
  }),
  component: PricingPage,
});

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const FAQS = [
  {
    q: "Is the $9.99 a subscription?",
    a: "No. It's a one-time unlock for a single report's Growth Roadmap and revenue opportunities. There's no recurring charge and nothing to cancel.",
  },
  {
    q: "What do I get for free?",
    a: "Your full diagnosis: overall Business Compass score, every section score, your estimated monthly revenue leakage, your primary bottleneck named and explained, and your strengths, weaknesses and blind spots. No card required.",
  },
  {
    q: "What does the $9.99 unlock add?",
    a: "The ranked Growth Roadmap — your top priorities in order, with why each one matters and the cost of leaving it alone — plus the revenue opportunity breakdown and a downloadable PDF snapshot of the whole report.",
  },
  {
    q: "Can I retake the diagnostic later?",
    a: "Yes. You can start a new diagnostic any time from your dashboard, and every past report stays saved there so you can track how your scores move.",
  },
  {
    q: "Does this replace working with a consultant?",
    a: "No — it's intentionally the opposite. The Compass diagnoses what's happening and why, but stops short of implementation. If you want the how, that's what a strategy session with Mind Management Academy is for.",
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/12 blur-[140px]" />
        <div className="relative mx-auto max-w-2xl px-5 pb-16 pt-24 text-center sm:pt-32">
          <motion.h1
            {...fade}
            className="text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Simple, <span className="text-gradient-gold">honest</span> pricing.
          </motion.h1>
          <motion.p
            {...fade}
            transition={{ ...fade.transition, delay: 0.08 }}
            className="mx-auto mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            See the problem for free. Pay once, only if you want the full roadmap.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div {...fade} className="rounded-3xl border border-border/70 bg-card p-9 shadow-soft">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <TrendingDown className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold">Free diagnosis</h2>
            <p className="mt-2 font-display text-4xl font-semibold">$0</p>
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
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full" variant="outline" asChild>
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
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                One-time, not a subscription
              </span>
              <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold">Growth Roadmap</h2>
              <p className="mt-2 font-display text-4xl font-semibold text-gradient-gold">
                $9.99<span className="text-base font-normal text-muted-foreground"> one-time</span>
              </p>
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
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get your score first
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Unlocks per report, right after you complete your diagnostic.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-2xl px-5 py-24">
          <motion.h2 {...fade} className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions
          </motion.h2>
          <motion.div {...fade} transition={{ ...fade.transition, delay: 0.08 }} className="mt-10">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((item) => (
                <AccordionItem key={item.q} value={item.q} className="border-border/70">
                  <AccordionTrigger className="font-display text-base font-medium">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <motion.h2 {...fade} className="text-balance font-display text-4xl font-semibold tracking-tight">
          Still not sure? Start with the free score.
        </motion.h2>
        <motion.div
          {...fade}
          transition={{ ...fade.transition, delay: 0.1 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Take the diagnostic
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={CALENDLY_URL} target="_blank" rel="noreferrer">
              Book a strategy session
            </a>
          </Button>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  completeAssessment,
  getActiveAssessment,
  saveResponse,
} from "@/lib/assessment.functions";
import { QUESTIONS } from "@/lib/questions";
import type { AnswerValue } from "@/lib/scoring";

export const Route = createFileRoute("/_authenticated/assessment")({
  head: () => ({
    meta: [
      { title: "Your diagnostic — AI Business Compass™" },
      { name: "description", content: "Answer the AI Business Compass diagnostic, one question at a time." },
      { property: "og:title", content: "Your diagnostic — AI Business Compass™" },
      { property: "og:description", content: "Answer the diagnostic, one question at a time." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssessmentPage,
});

function AssessmentPage() {
  const navigate = useNavigate();
  const load = useServerFn(getActiveAssessment);
  const save = useServerFn(saveResponse);
  const complete = useServerFn(completeAssessment);

  const { data, isLoading } = useQuery({ queryKey: ["active-assessment"], queryFn: () => load({}) });

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!data || hydrated) return;
    setAnswers(data.answers);
    setIndex(Math.min(data.assessment.current_index ?? 0, QUESTIONS.length - 1));
    setHydrated(true);
  }, [data, hydrated]);

  const question = QUESTIONS[index];
  const value = answers[question?.key] ?? null;

  const progress = useMemo(() => ((index + 1) / QUESTIONS.length) * 100, [index]);

  const submitting = useMutation({
    mutationFn: async (assessmentId: string) => complete({ data: { assessmentId } }),
    onSuccess: (res) => navigate({ to: "/results/$assessmentId", params: { assessmentId: res.assessmentId } }),
    onError: () => toast.error("We couldn't build your report. Please try again."),
  });

  function isAnswered() {
    if (!question.required) return true;
    if (Array.isArray(value)) return value.length >= (question.minSelect ?? 1);
    if (typeof value === "number") return !Number.isNaN(value);
    return typeof value === "string" && value.trim().length > 0;
  }

  async function persist(nextIndex: number) {
    if (!data) return;
    try {
      await save({
        data: {
          assessmentId: data.assessment.id,
          questionKey: question.key,
          value,
          index: nextIndex,
        },
      });
    } catch {
      toast.error("Couldn't save that answer — check your connection.");
    }
  }

  async function next() {
    if (!isAnswered()) {
      toast.error("Please answer to continue.");
      return;
    }
    const isLast = index === QUESTIONS.length - 1;
    setDirection(1);
    await persist(isLast ? index : index + 1);
    if (isLast) {
      if (data) submitting.mutate(data.assessment.id);
      return;
    }
    setIndex((i) => i + 1);
  }

  function back() {
    if (index === 0) return;
    setDirection(-1);
    setIndex((i) => i - 1);
  }

  if (isLoading || !hydrated || !question) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (submitting.isPending) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-5 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <h2 className="font-display text-2xl font-semibold">Analyzing your business…</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Scoring eight systems, calculating revenue leakage, and identifying your primary bottleneck.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="sticky top-16 z-40 h-0.5 w-full bg-border">
        <motion.div
          className="h-full bg-gradient-gold"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="mx-auto max-w-2xl px-5 pb-24 pt-12">
        <p className="mb-8 text-xs text-muted-foreground">
          Question {index + 1} of {QUESTIONS.length}
        </p>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={question.key}
            initial={{ opacity: 0, x: direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -28 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <QuestionCard
              question={question}
              value={value}
              onChange={(v) => setAnswers((a) => ({ ...a, [question.key]: v }))}
              onAdvance={next}
            />
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={index === 0}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={next}>
            {index === QUESTIONS.length - 1 ? "See my results" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { AnswerValue } from "@/lib/scoring";
import type { Question } from "@/lib/questions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function QuestionCard({
  question,
  value,
  onChange,
  onAdvance,
}: {
  question: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  onAdvance: () => void;
}) {
  const selected = Array.isArray(value) ? value : [];

  function toggleMulti(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((v) => v !== option));
      return;
    }
    if (question.maxSelect && selected.length >= question.maxSelect) return;
    onChange([...selected, option]);
  }

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          {question.section}
        </span>
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {question.label}
        </h2>
        {question.help ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{question.help}</p>
        ) : null}
        {question.type === "multi" && question.maxSelect ? (
          <p className="text-xs text-muted-foreground">
            Select up to {question.maxSelect} · {selected.length} selected
          </p>
        ) : null}
      </div>

      {question.type === "text" || question.type === "number" ? (
        <Input
          autoFocus
          type={question.type === "number" ? "number" : "text"}
          inputMode={question.type === "number" ? "numeric" : undefined}
          value={value === null || value === undefined ? "" : String(value)}
          placeholder={question.placeholder}
          maxLength={200}
          onChange={(e) =>
            onChange(question.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdvance();
            }
          }}
          className="h-14 rounded-2xl text-lg"
        />
      ) : null}

      {question.type === "longtext" ? (
        <Textarea
          autoFocus
          rows={5}
          maxLength={1000}
          value={typeof value === "string" ? value : ""}
          placeholder={question.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-2xl text-base"
        />
      ) : null}

      {question.type === "single" || question.type === "scale" ? (
        <div className="grid gap-2.5">
          {(question.options ?? []).map((opt, i) => {
            const active = value === opt.value;
            return (
              <motion.button
                key={opt.value}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.35 }}
                onClick={() => {
                  onChange(opt.value);
                  window.setTimeout(onAdvance, 220);
                }}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left text-[15px] transition-all duration-200",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:border-primary/40 hover:bg-secondary",
                )}
              >
                <span>{opt.label}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {active ? <Check className="h-3 w-3" /> : null}
                </span>
              </motion.button>
            );
          })}
        </div>
      ) : null}

      {question.type === "multi" ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(question.options ?? []).map((opt, i) => {
            const active = selected.includes(opt.value);
            const disabled =
              !active && Boolean(question.maxSelect) && selected.length >= (question.maxSelect ?? 99);
            return (
              <motion.button
                key={opt.value}
                type="button"
                disabled={disabled}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025, duration: 0.35 }}
                onClick={() => toggleMulti(opt.value)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left text-[15px] transition-all duration-200",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40 hover:bg-secondary",
                  disabled && "cursor-not-allowed opacity-40",
                )}
              >
                <span>{opt.label}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {active ? <Check className="h-3 w-3" /> : null}
                </span>
              </motion.button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
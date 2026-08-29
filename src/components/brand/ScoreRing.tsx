import { motion } from "framer-motion";
import { scoreColorVar } from "@/lib/scoring";

export function ScoreRing({
  score,
  label,
  size = 168,
  stroke = 10,
  delay = 0,
}: {
  score: number;
  label?: string;
  size?: number;
  stroke?: number;
  delay?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreColorVar(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (c * Math.max(0, Math.min(100, score))) / 100 }}
            transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2 }}
            className="font-display text-4xl font-semibold tabular-nums"
            style={{ color }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground">out of 100</span>
        </div>
      </div>
      {label ? <p className="text-sm font-medium text-muted-foreground">{label}</p> : null}
    </div>
  );
}

export function ScoreBar({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  const color = scoreColorVar(score);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-display text-sm font-semibold tabular-nums" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
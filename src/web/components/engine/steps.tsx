"use client";

import { useEffect, useRef, useState } from "react";
import { type Answer, type Ctx, resolve, type Step } from "@/lib/modules/types";

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Quiet listening cue while typing (ui_ux_guidelines §2). */
function TypingIndicator({ active }: { active: boolean }) {
  return (
    <p aria-live="polite" className={`mt-2 text-right text-xs text-muted transition-opacity ${active ? "opacity-100" : "opacity-0"}`}>
      당신의 이야기가 기록되고 있습니다
    </p>
  );
}

function useTyping(): [boolean, () => void] {
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ping = () => {
    setTyping(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTyping(false), 1500);
  };
  return [typing, ping];
}

const areaClass =
  "min-h-48 w-full rounded-2xl border border-line bg-paper p-4 leading-relaxed outline-none focus:border-sage";

export function TextStep({ step, value, onChange }: { step: Step; value: string; onChange: (v: string) => void }) {
  const [typing, ping] = useTyping();
  return (
    <>
      <textarea
        aria-labelledby="step-prompt"
        className={areaClass}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          ping();
        }}
      />
      {step.kind === "text" && step.typingIndicator !== false && <TypingIndicator active={typing} />}
    </>
  );
}

export function ShortTextStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      aria-labelledby="step-prompt"
      className="min-h-11 w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-sage"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export type Snapshot = { at: string; active_s: number; chars: number; words: number };

/** Timed free writing: counts visible time only and logs length snapshots every 30 s (B-08 matching). */
export function FreeWriteStep({
  step,
  value,
  onChange,
  activeSeconds,
  onTick,
}: {
  step: Extract<Step, { kind: "free_write" }>;
  value: string;
  onChange: (v: string) => void;
  activeSeconds: number;
  onTick: (seconds: number) => void;
}) {
  const [typing, ping] = useTyping();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") onTick(1);
    }, 1000);
    return () => clearInterval(id);
  }, [onTick]);
  const minutes = Math.floor(activeSeconds / 60);
  return (
    <>
      <div className="mb-2 flex justify-between text-xs text-muted">
        <span>권장 {step.recommendMinutes}분 이상</span>
        <span>
          {minutes}분 · {wordCount(value)}어절
        </span>
      </div>
      <textarea
        aria-labelledby="step-prompt"
        className={`${areaClass} min-h-72`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          ping();
        }}
      />
      <TypingIndicator active={typing} />
    </>
  );
}

export function ListStep({
  step,
  value,
  onChange,
}: {
  step: Extract<Step, { kind: "list" }>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const rows = Array.from({ length: step.max }, (_, i) => value[i] ?? "");
  return (
    <div className="space-y-2">
      {rows.map((v, i) => (
        <input
          key={i}
          aria-label={`${step.itemLabel} ${i + 1}`}
          className="min-h-11 w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-sage"
          placeholder={`${step.itemLabel} ${i + 1}`}
          value={v}
          onChange={(e) => {
            const next = [...rows];
            next[i] = e.target.value;
            onChange(next);
          }}
        />
      ))}
    </div>
  );
}

export function AllocationStep({
  labels,
  total,
  value,
  onChange,
}: {
  labels: string[];
  total: number;
  value: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
}) {
  const used = labels.reduce((sum, l) => sum + (value[l] ?? 0), 0);
  const left = total - used;
  const set = (label: string, n: number) => {
    const others = used - (value[label] ?? 0);
    onChange({ ...value, [label]: Math.max(0, Math.min(n, total - others)) });
  };
  return (
    <div>
      {labels.map((label) => (
        <div key={label} className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium">{label}</span>
            <span>{value[label] ?? 0}</span>
          </div>
          <input
            type="range"
            min={0}
            max={total}
            aria-label={label}
            value={value[label] ?? 0}
            onChange={(e) => set(label, Number(e.target.value))}
            className="w-full accent-[var(--sage)]"
          />
        </div>
      ))}
      <div className="sticky bottom-24 mt-2 rounded-xl bg-paper p-3 text-center text-sm shadow">
        남은 포인트: <span className="font-semibold">{left}</span>점
      </div>
    </div>
  );
}

export function YesNoTextStep({
  step,
  value,
  onChange,
}: {
  step: Extract<Step, { kind: "yes_no_text" }>;
  value: { choice: string; text: string };
  onChange: (v: { choice: string; text: string }) => void;
}) {
  return (
    <>
      <div className="mb-3 flex gap-2">
        {[step.yes, step.no].map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={value.choice === c}
            onClick={() => onChange({ ...value, choice: c })}
            className={`min-h-11 flex-1 rounded-xl border px-4 ${value.choice === c ? "border-sage bg-sage-soft" : "border-line bg-paper"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <textarea
        aria-label="짧은 서술"
        className={`${areaClass} min-h-24`}
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
      />
    </>
  );
}

export function RatingStep({
  step,
  value,
  onChange,
}: {
  step: Extract<Step, { kind: "rating" }>;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const options = Array.from({ length: step.max - step.min + 1 }, (_, i) => step.min + i);
  return (
    <div>
      <div className="flex gap-2">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={`min-h-11 flex-1 rounded-xl border ${value === n ? "border-sage bg-sage-soft" : "border-line bg-paper"}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{step.lowLabel}</span>
        <span>{step.highLabel}</span>
      </div>
    </div>
  );
}

export function DomainStep({
  step,
  value,
  onChange,
}: {
  step: Extract<Step, { kind: "domain_tag" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" aria-labelledby="step-prompt" className="space-y-2">
      {step.options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 w-full rounded-xl border px-4 py-3 text-left ${value === o.value ? "border-sage bg-sage-soft" : "border-line bg-paper"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function emptyAnswer(step: Step, ctx: Ctx): Answer {
  switch (step.kind) {
    case "list":
      return [];
    case "allocation":
      return {};
    case "yes_no_text":
      return { choice: "", text: "" };
    case "rating":
    case "domain_tag":
      return "";
    default:
      return resolve(step.prefill, ctx);
  }
}

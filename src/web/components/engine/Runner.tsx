"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BottomBar, Button, Card, ErrorNote } from "@/components/ui";
import { api, explain } from "@/lib/api";
import { type Answer, type Ctx, type ModuleDef, resolve, type Step } from "@/lib/modules/types";
import {
  AllocationStep,
  DomainStep,
  emptyAnswer,
  FreeWriteStep,
  ListStep,
  RatingStep,
  ShortTextStep,
  type Snapshot,
  TextStep,
  wordCount,
  YesNoTextStep,
} from "./steps";

const UI_VERSION = "s1";
const SOFT_CONFIRM = "작성하신 내용으로 기록을 마무리할까요? (언제든 이대로 넘어가셔도 좋습니다.)"; // ui_ux_guidelines §4

type ProgressStep = { module: string; status: "done" | "available" | "locked"; entries: number; has_draft: boolean };
type Phase = "loading" | "intro" | "step" | "card_done" | "saving";
type Draft = {
  v: 1;
  savedAt: number;
  unit: number;
  step: number;
  answers: Record<string, Answer>;
  ms: Record<string, number>;
  active: Record<string, number>;
  snapshots: Record<string, Snapshot[]>;
};

const localKey = (id: string) => `pilot_draft:${id}`;

/** Wall clock for step timings. Only called from event handlers and effects, never during render. */
const clock = () => Date.now();

function readLocal(id: string): Draft | null {
  try {
    const raw = localStorage.getItem(localKey(id));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeLocal(id: string, draft: Draft | null) {
  try {
    if (draft) localStorage.setItem(localKey(id), JSON.stringify(draft));
    else localStorage.removeItem(localKey(id));
  } catch {
    /* storage unavailable: the server draft still covers resume */
  }
}

/** Hard validation: returns a message when "다음" must stay blocked. */
function blocker(step: Step, value: Answer, labels: string[]): string | null {
  switch (step.kind) {
    case "list": {
      const filled = (value as string[]).filter((v) => v.trim()).length;
      return filled < step.min ? `${step.min}개 이상 적어 주세요.` : null;
    }
    case "allocation": {
      const sum = labels.reduce((s, l) => s + ((value as Record<string, number>)[l] ?? 0), 0);
      return sum !== step.total ? `합계가 정확히 ${step.total}점이 되어야 해요.` : null;
    }
    case "rating":
      return typeof value === "number" ? null : "하나를 골라 주세요.";
    case "domain_tag":
      return value ? null : "하나를 골라 주세요.";
    case "yes_no_text":
      return (value as { choice: string }).choice ? null : "하나를 골라 주세요.";
    default:
      return null;
  }
}

/** Soft confirmation instead of a follow-up question (principles §1-0 조건 2). */
function softCheck(step: Step, value: Answer, activeSeconds: number): string | null {
  if (step.optional) return null;
  if (step.kind === "free_write") {
    if (activeSeconds < step.recommendMinutes * 60)
      return "권장 시간보다 일찍 마무리할까요? (언제든 이대로 넘어가셔도 좋습니다.)";
    return (value as string).trim().length < 15 ? SOFT_CONFIRM : null;
  }
  if (step.kind === "text") return (value as string).trim().length < 15 ? SOFT_CONFIRM : null;
  if (step.kind === "list" && step.softMin) {
    const filled = (value as string[]).filter((v) => v.trim()).length;
    return filled < step.softMin ? SOFT_CONFIRM : null;
  }
  return null;
}

function snapshot(text: string, activeSeconds: number): Snapshot {
  return { at: new Date().toISOString(), active_s: activeSeconds, chars: text.length, words: wordCount(text) };
}

export default function Runner({ def }: { def: ModuleDef }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [posted, setPosted] = useState(0);
  const [unit, setUnit] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [ms, setMs] = useState<Record<string, number>>({});
  const [active, setActive] = useState<Record<string, number>>({});
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot[]>>({});
  const [skipped, setSkipped] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stepStarted = useRef(0);
  const latest = useRef(answers);
  useEffect(() => {
    latest.current = answers;
  }, [answers]);

  const stimulus = def.stimuli?.[unit];
  const steps = useMemo(
    () => def.steps.filter((s) => !(s.kind === "domain_tag" && stimulus?.domain)),
    [def.steps, stimulus?.domain],
  );
  const step = steps[stepIdx];
  const ctx: Ctx = { answers, stimulus };
  const value = step ? (answers[step.field] ?? emptyAnswer(step, ctx)) : "";

  const complete = useCallback(async () => {
    setPhase("saving");
    try {
      await api(`/progress/${def.id}/complete`, { method: "POST" });
      writeLocal(def.id, null);
      router.push("/home");
    } catch (err) {
      setError(explain(err));
      setPhase("step");
    }
  }, [def.id, router]);

  // Load: the server's entry count is the source of truth for how many units are already saved.
  useEffect(() => {
    (async () => {
      let mine: ProgressStep | undefined;
      try {
        const progress = await api<{ steps: ProgressStep[] }>("/progress");
        mine = progress.steps.find((s) => s.module === def.id);
      } catch (err) {
        setError(explain(err));
        return;
      }
      if (!mine || mine.status !== "available") {
        router.replace("/home");
        return;
      }
      let server: Draft | null = null;
      try {
        server = (await api<{ payload: Draft }>(`/drafts/${def.id}`)).payload;
      } catch {
        /* no server draft */
      }
      const local = readLocal(def.id);
      const draft = [local, server].filter(Boolean).sort((a, b) => b!.savedAt - a!.savedAt)[0] ?? null;

      setPosted(mine.entries);
      setUnit(mine.entries);
      stepStarted.current = clock();
      if (draft && draft.unit === mine.entries) {
        setStepIdx(draft.step);
        setAnswers(draft.answers);
        setMs(draft.ms);
        setActive(draft.active);
        setSnapshots(draft.snapshots);
        setPhase("step");
      } else if (mine.entries > 0 && def.cards) {
        setPhase("card_done");
      } else if (mine.entries > 0 && !def.stimuli) {
        void complete(); // saved but not marked complete (e.g. closed right after the last answer)
      } else if (mine.entries > 0 && def.stimuli && mine.entries >= def.stimuli.length) {
        void complete();
      } else {
        setPhase(mine.entries > 0 ? "step" : "intro");
      }
    })();
  }, [def, router, complete]);

  // Autosave: local immediately, server after 3 s of quiet (mvp §3-2).
  useEffect(() => {
    if (phase !== "step") return;
    const draft: Draft = { v: 1, savedAt: clock(), unit, step: stepIdx, answers, ms, active, snapshots };
    writeLocal(def.id, draft);
    const t = setTimeout(() => {
      api(`/drafts/${def.id}`, { method: "PUT", json: { payload: draft } }).catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, [def.id, phase, unit, stepIdx, answers, ms, active, snapshots]);

  const tick = useCallback(
    (field: string) => (seconds: number) => {
      setActive((prev) => {
        const n = (prev[field] ?? 0) + seconds;
        if (n % 30 === 0) {
          const text = (latest.current[field] as string) ?? "";
          setSnapshots((s) => ({ ...s, [field]: [...(s[field] ?? []), snapshot(text, n)] }));
        }
        return { ...prev, [field]: n };
      });
    },
    [],
  );
  const onTick = useMemo(() => (step?.kind === "free_write" ? tick(step.field) : () => {}), [step, tick]);

  const labels = useMemo(() => {
    if (step?.kind !== "allocation") return [];
    return ((answers[step.from] as string[]) ?? []).filter((v) => v.trim());
  }, [step, answers]);

  function setValue(v: Answer) {
    setAnswers((a) => ({ ...a, [step.field]: v }));
    setError(null);
  }

  async function saveUnit(finalMs: Record<string, number>, finalSnapshots: Record<string, Snapshot[]>) {
    setPhase("saving");
    let payload: Record<string, unknown> = { ...(def.constants ?? {}) };
    if (stimulus && def.stimulusField) payload[def.stimulusField] = stimulus.id;
    if (stimulus && def.stimulusBodyField) payload[def.stimulusBodyField] = stimulus.body;
    let domain: string | null = stimulus?.domain ?? null;
    for (const s of steps) {
      const v = answers[s.field] ?? emptyAnswer(s, ctx);
      if (s.kind === "domain_tag") domain = (v as string) || null;
      else if (s.kind === "list") payload[s.field] = (v as string[]).filter((x) => x.trim());
      else payload[s.field] = v;
    }
    if (def.shape) payload = def.shape(payload, ctx);
    const freeWrite = Object.fromEntries(
      steps
        .filter((s) => s.kind === "free_write")
        .map((s) => [s.field, { active_s: active[s.field] ?? 0, snapshots: finalSnapshots[s.field] ?? [] }]),
    );
    const item = stimulus ? stimulus.id : def.cards ? `card_${unit + 1}` : "main";
    try {
      await api("/raw", {
        method: "POST",
        json: {
          module: def.id,
          item,
          payload,
          domain_tag: domain,
          client_meta: {
            ui: UI_VERSION,
            prompts: Object.fromEntries(steps.map((s) => [s.field, resolve(s.prompt, ctx)])),
            skipped: skipped.length ? skipped : undefined,
            stimulus: stimulus ? { id: stimulus.id, body: stimulus.body } : undefined,
            ms: finalMs,
            free_write: Object.keys(freeWrite).length ? freeWrite : undefined,
          },
        },
      });
    } catch (err) {
      setError(explain(err));
      setPhase("step");
      return;
    }
    const nextPosted = posted + 1;
    setPosted(nextPosted);
    setAnswers({});
    setMs({});
    setActive({});
    setSnapshots({});
    setSkipped([]);
    setStepIdx(0);
    stepStarted.current = clock();
    if (def.stimuli && unit + 1 < def.stimuli.length) {
      setUnit(unit + 1);
      setPhase("step");
    } else if (def.cards) {
      setUnit(unit + 1);
      setPhase("card_done");
    } else {
      await complete();
    }
  }

  async function skip() {
    setAnswers((a) => ({ ...a, [step.field]: "" }));
    setSkipped((k) => [...k, step.field]);
    await next(true, "");
  }

  async function next(force = false, override?: Answer) {
    const value_ = override ?? value;
    const hard = blocker(step, value_, labels);
    if (hard) {
      setError(hard);
      return;
    }
    if (!force) {
      const soft = softCheck(step, value_, active[step.field] ?? 0);
      if (soft) {
        setConfirm(soft);
        return;
      }
    }
    setConfirm(null);
    const spent = clock() - stepStarted.current;
    const finalMs = { ...ms, [step.field]: (ms[step.field] ?? 0) + spent };
    const finalSnapshots =
      step.kind === "free_write"
        ? { ...snapshots, [step.field]: [...(snapshots[step.field] ?? []), snapshot(value_ as string, active[step.field] ?? 0)] }
        : snapshots;
    setMs(finalMs);
    setSnapshots(finalSnapshots);
    stepStarted.current = clock();
    if (stepIdx + 1 < steps.length) {
      setStepIdx(stepIdx + 1);
      return;
    }
    await saveUnit(finalMs, finalSnapshots);
  }

  if (phase === "loading" || phase === "saving") {
    return (
      <>
        <ErrorNote message={error} />
        <p className="text-muted">{phase === "saving" ? "저장하는 중…" : "불러오는 중…"}</p>
      </>
    );
  }

  if (phase === "intro") {
    return (
      <>
        <header className="mb-6">
          <p className="text-sm text-muted">약 {def.minutes}분</p>
          <h1 className="mt-1 text-2xl font-semibold">{def.title}</h1>
        </header>
        <Card>
          <p className="leading-relaxed">{def.intro}</p>
          <p className="mt-3 text-sm text-muted">한 번 넘긴 답은 다시 고칠 수 없어요. 중간에 나가도 이어서 할 수 있어요.</p>
        </Card>
        <BottomBar>
          <Button
            className="w-full"
            onClick={() => {
              stepStarted.current = clock();
              setPhase("step");
            }}
          >
            시작하기
          </Button>
        </BottomBar>
      </>
    );
  }

  if (phase === "card_done" && def.cards) {
    const enough = posted >= def.cards.min;
    return (
      <>
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">{def.title}</h1>
        </header>
        <Card tone="sage">
          <p className="font-medium">
            {def.cards.label} {posted}개를 기록했어요.
          </p>
          {!enough && <p className="mt-1 text-sm text-muted">최소 {def.cards.min}개까지 이어서 적어 주세요.</p>}
        </Card>
        <ErrorNote message={error} />
        <BottomBar>
          <Button
            variant={enough ? "quiet" : "primary"}
            className="flex-1"
            onClick={() => {
              stepStarted.current = clock();
              setPhase("step");
            }}
          >
            {enough ? "하나 더 쓰기" : `다음 ${def.cards.label}`}
          </Button>
          {enough && (
            <Button className="flex-1" onClick={complete}>
              마치기
            </Button>
          )}
        </BottomBar>
      </>
    );
  }

  const pinned = (step.pin ?? []).map((f) => [f, answers[f]] as const).filter(([, v]) => v);
  const hard = blocker(step, value, labels);
  const unitLabel = def.stimuli
    ? `${unit + 1} / ${def.stimuli.length}`
    : def.cards
      ? `${def.cards.label} ${unit + 1}`
      : null;

  return (
    <>
      <header className="mb-4 flex items-baseline justify-between text-sm text-muted">
        <span>{def.title}</span>
        <span>
          {unitLabel && <>{unitLabel} · </>}
          {stepIdx + 1}/{steps.length}
        </span>
      </header>

      {(stimulus?.body || stimulus?.title) && !def.stimulusAsPrompt && (
        <Card>
          {stimulus.title && <p className="mb-2 text-sm font-medium text-muted">{stimulus.title}</p>}
          {stimulus.body && <p className="whitespace-pre-line leading-relaxed">{stimulus.body}</p>}
        </Card>
      )}

      {pinned.map(([f, v]) => (
        <div key={f} className="mb-3 rounded-xl border border-line/70 bg-cream px-4 py-3 text-sm text-muted">
          {Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : JSON.stringify(v)}
        </div>
      ))}

      <h2 id="step-prompt" className="mb-2 whitespace-pre-line text-xl font-semibold leading-snug">
        {def.stimulusAsPrompt && stimulus ? stimulus.body : resolve(step.prompt, ctx)}
      </h2>
      {step.hint && <p className="mb-3 text-sm text-muted">{step.hint}</p>}

      <div className="mt-4">
        {step.kind === "text" && <TextStep step={step} value={value as string} onChange={setValue} />}
        {step.kind === "short_text" && <ShortTextStep value={value as string} onChange={setValue} />}
        {step.kind === "free_write" && (
          <FreeWriteStep
            step={step}
            value={value as string}
            onChange={setValue}
            activeSeconds={active[step.field] ?? 0}
            onTick={onTick}
          />
        )}
        {step.kind === "list" && <ListStep step={step} value={value as string[]} onChange={setValue} />}
        {step.kind === "allocation" && (
          <AllocationStep
            labels={labels}
            total={step.total}
            value={value as Record<string, number>}
            onChange={setValue}
          />
        )}
        {step.kind === "yes_no_text" && (
          <YesNoTextStep step={step} value={value as { choice: string; text: string }} onChange={setValue} />
        )}
        {step.kind === "rating" && (
          <RatingStep step={step} value={typeof value === "number" ? value : undefined} onChange={setValue} />
        )}
        {step.kind === "domain_tag" && <DomainStep step={step} value={value as string} onChange={setValue} />}
      </div>

      <div className="mt-4">
        <ErrorNote message={error} />
      </div>

      {confirm && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-10 flex items-end bg-charcoal/30">
          <div className="mx-auto w-full max-w-xl rounded-t-2xl bg-paper p-6">
            <p className="mb-5 leading-relaxed">{confirm}</p>
            <div className="flex gap-3">
              <Button variant="quiet" className="flex-1" onClick={() => setConfirm(null)}>
                조금 더 쓰기
              </Button>
              <Button className="flex-1" onClick={() => next(true)}>
                이대로 마무리
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomBar>
        {step.skipLabel && (
          <Button variant="quiet" className="flex-1" onClick={skip}>
            {step.skipLabel}
          </Button>
        )}
        <Button
          className="flex-1"
          disabled={!!hard && (step.kind === "allocation" || step.kind === "domain_tag")}
          onClick={() => next()}
        >
          {stepIdx + 1 < steps.length ? "다음" : "기록하기"}
        </Button>
      </BottomBar>
    </>
  );
}

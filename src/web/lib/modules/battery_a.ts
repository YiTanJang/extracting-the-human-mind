import type { Ctx, Domain, ModuleDef, Stimulus } from "./types";

// Prompts verbatim from extracting-the-human-mind/extraction/{generative_metaphor,contextual_value_allocation,
// feared_self,episodic_future_thinking}.md. Doc gaps are filled with pilot defaults listed in
// architecture/pilot.md 「S1 파일럿 기본값」 ([User Review] — decide before launch).
// Domain-bound modules run in ONE domain each, rotated so the battery still covers all three and is identical
// for every participant (user decision 2026-10-01, architecture/pilot.md 결정 사항). The other decks/scenarios stay
// here as data so the assignment can change in one place.
type PilotDomain = "work" | "relation" | "self";
export const PILOT_DOMAIN: Record<"metaphor" | "value_allocation" | "feared_self", PilotDomain> = {
  metaphor: "self",
  value_allocation: "work",
  feared_self: "relation",
};

// ── 생성 은유와 문장 완성 ───────────────────────────────────────────────────────────
type Card = { kind: "metaphor" | "sct"; key: string; text: string };

const DECKS: Record<"work" | "relation" | "self", Card[]> = {
  work: [
    { kind: "metaphor", key: "journey", text: "나의 커리어를 하나의 여정(길)으로 본다면, 지금 그 길은 [ ] 같다." },
    { kind: "metaphor", key: "machine", text: "일할 때의 나를 하나의 기계로 본다면, 지금 그 기계는 [ ] 한 상태다." },
    { kind: "metaphor", key: "war", text: "나에게 일이란 매일 치르는 [ ] 같은 싸움이다." },
    { kind: "metaphor", key: "vertical", text: "내가 이 일에서 서 있는 위치를 높낮이로 그리면, 나는 지금 [ ] 에 있다." },
    { kind: "sct", key: "authority", text: "상사나 회사가 나를 평가할 때, 내가 가장 예민하게 반응하는 지점은 [ ] 이다." },
    { kind: "sct", key: "peer", text: "같이 일할 때 나를 가장 숨 막히게 하는 사람은 [ ] 하는 사람이다." },
    { kind: "sct", key: "loss_of_control", text: "일이 내 통제를 완전히 벗어나 망해갈 때, 나는 무의식적으로 [ ] 한다." },
    { kind: "sct", key: "self_efficacy", text: "내 능력의 한계에 부딪혔다고 느낄 때, 나는 속으로 나에게 [ ] 라고 말한다." },
    { kind: "sct", key: "terminal_motive", text: "사실 내가 이 일을 계속 붙잡고 있는 진짜 이유는 [ ] 때문이다." },
  ],
  relation: [
    { kind: "metaphor", key: "war", text: "나에게 타인과의 갈등은 마치 [ ] 같은 전쟁이다." },
    { kind: "metaphor", key: "boundary", text: "내가 타인에게 허용하는 마음의 울타리를 그리면, 그 높이와 견고함은 [ ] 정도다." },
    { kind: "metaphor", key: "bond", text: "지금 나와 가장 가까운 사람과 나를 잇는 끈을 그리면, 그 끈은 [ ] 같다." },
    { kind: "metaphor", key: "weight", text: "다른 사람들의 요구나 시선은 나에게 [ ] 라는 무게로 얹힌다." },
    { kind: "sct", key: "shame_trigger", text: "관계에서 나를 가장 비참하게 만드는 상대의 행동은 [ ] 이다." },
    { kind: "sct", key: "boundary_breach", text: "누군가 내 선을 넘었다고 느낄 때, 내가 겉으로 취하는 첫 행동은 [ ] 이다." },
    { kind: "sct", key: "metaperception", text: "사람들은 결국 나를 [ ] 게 여길 것이라고 나는 생각한다." },
    { kind: "sct", key: "approach_avoid", text: "내가 먼저 마음을 열지 못하고 망설이는 이유는 [ ] 때문이다." },
    { kind: "sct", key: "yield_condition", text: "싸울 때 내가 내 입장을 꺾는 유일한 순간은 [ ] 때다." },
  ],
  self: [
    { kind: "metaphor", key: "container", text: "내 마음이라는 그릇에 지금 가장 위태롭게 찰랑거리는 감정은 [ ] 이다." },
    { kind: "metaphor", key: "role", text: "내 인생이라는 무대에서 내가 지금 어쩔 수 없이 맡은 배역은 [ ] 이다." },
    { kind: "metaphor", key: "weight", text: "지금 내 어깨를 가장 무겁게 누르는 보이지 않는 짐은 [ ] 이다." },
    { kind: "metaphor", key: "light_dark", text: "요즘 나의 하루를 빛과 어둠으로 그리면, [ ] 같다." },
    { kind: "sct", key: "secret_fear", text: "내가 아무에게도 말 못 하고 혼자 두려워하는 것은 [ ] 이다." },
    { kind: "sct", key: "self_contempt", text: "내가 나 자신을 가장 한심하게 느끼는 순간은 [ ] 때다." },
    { kind: "sct", key: "residual_motive", text: "다 포기하고 주저앉고 싶을 때, 나를 억지로 일으키는 핑계는 [ ] 이다." },
    { kind: "sct", key: "priority_paradox", text: "시간이 얼마 안 남는다면, 내가 가장 먼저 버릴 것은 [ ] 이다." },
    { kind: "sct", key: "self_wish", text: "사실 내가 나에게 가장 바라는 용기는 [ ] 하는 것이다." },
  ],
};

/** Fixed interleaving S-M-S-M-…-S (the doc asks to avoid long same-type runs); same order for everyone. */
function interleave(cards: Card[]): Card[] {
  const m = cards.filter((c) => c.kind === "metaphor");
  const s = cards.filter((c) => c.kind === "sct");
  const out: Card[] = [];
  for (let i = 0; i < s.length; i++) {
    out.push(s[i]);
    if (m[i]) out.push(m[i]);
  }
  return out;
}

const DOMAIN_TITLE = { work: "일·커리어", relation: "인간관계", self: "개인적인 삶·내면" } as const;

export const metaphor: ModuleDef = {
  id: "metaphor",
  title: "생성 은유와 문장 완성",
  minutes: "3~8",
  intro:
    "끝나지 않은 문장이 한 장씩 나와요. 빈칸 [ ]에 가장 먼저 떠오르는 말을 채워 주세요. 오래 고민하지 않아도 돼요.",
  stimulusAsPrompt: true,
  stimulusField: "card_id",
  stimulusBodyField: "prompt",
  stimuli: interleave(DECKS[PILOT_DOMAIN.metaphor]).map<Stimulus>((c) => ({
    id: `${PILOT_DOMAIN.metaphor}_${c.kind}_${c.key}`,
    body: c.text,
    domain: PILOT_DOMAIN.metaphor,
  })),
  shape: (payload, ctx: Ctx) => ({
    method: ctx.stimulus?.id.includes("_metaphor_") ? "metaphor" : "sct",
    ...payload,
  }),
  steps: [{ id: "completion", kind: "short_text", field: "raw_verbatim", prompt: "" }],
};

// ── 맥락 속 가치 할당 ───────────────────────────────────────────────────────────────
/** Whether a Korean word ends in a final consonant (받침); non-Hangul endings fall back to the 받침 form. */
function hasBatchim(word: string): boolean {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return true;
  return (code - 0xac00) % 28 !== 0;
}
const 은는 = (w: string) => (hasBatchim(w) ? "은" : "는");
const 을를 = (w: string) => (hasBatchim(w) ? "을" : "를");

/** Top = first-entered among the highest points; bottom = last-entered among the lowest (pilot tie rule). */
function topBottom(ctx: Ctx): [string, string] {
  const labels = ((ctx.answers.raw_values as string[]) ?? []).filter((v) => v.trim());
  const points = (ctx.answers.allocation as Record<string, number>) ?? {};
  let top = labels[0] ?? "";
  let bottom = labels[labels.length - 1] ?? "";
  for (const l of labels) if ((points[l] ?? 0) > (points[top] ?? 0)) top = l;
  for (const l of [...labels].reverse()) if ((points[l] ?? 0) < (points[bottom] ?? 0)) bottom = l;
  return [top, bottom];
}

export const valueAllocation: ModuleDef = {
  id: "value_allocation",
  title: "맥락 속 가치 할당",
  minutes: "5~8",
  intro:
    "긴장감 있는 상황을 하나 읽고, 그 상황에서 지키거나 얻고 싶은 것을 당신의 말로 적은 뒤 100점을 나눠 줘요.",
  stimulusField: "context",
  stimuli: ([
    {
      id: "work_crisis_scenario",
      title: "업무/성취",
      domain: "work",
      body: "지금 당신은 자원(시간과 예산)이 완전히 바닥나기 직전의 상황에서, 당신의 커리어를 수직 상승시킬 수 있는 중요 프로젝트의 책임을 맡았습니다. 하지만 이 프로젝트를 밀어붙여 성공시키려면, 일부 팀원이나 외부 협력사에게 심각한 희생과 소외를 강요해야만 합니다.",
    },
    {
      id: "relation_group_pressure_scenario",
      title: "관계/소통",
      domain: "relation",
      body: "당신은 현재 속한 가장 중요한 집단(가족 또는 핵심 팀)으로부터 거센 압박을 받고 있습니다. 그들이 요구하는 방식대로 순응하면 집단의 지원과 평화가 보장되지만, 당신 고유의 정체성과 신념은 완전히 짓밟히게 됩니다. 반대로 당신의 방식을 고집하면 즉각적인 파문이나 고립을 겪어야 합니다.",
    },
    {
      id: "self_stability_adventure_scenario",
      title: "개인/안정",
      domain: "self",
      body: "지금 당신에게 기존의 안정적인 삶의 기반(직장, 거주지, 익숙한 관계)을 모두 버리고 맨몸으로 떠나야만 얻을 수 있는, 일생일대의 모험적인 기회가 주어졌습니다. 단 하루의 시간 내에 모든 것을 포기할지 남을지 결정해야 합니다.",
    },
  ] satisfies Stimulus[]).filter((s) => s.domain === PILOT_DOMAIN.value_allocation),
  steps: [
    {
      id: "values",
      kind: "list",
      field: "raw_values",
      prompt: "지금 이 상황에서, 당신이 지키거나 얻고 싶은 것을 5~6개, 당신의 말로 적는다. (정답은 없다. 떠오르는 대로 적는다.)",
      min: 2,
      softMin: 4,
      max: 6,
      itemLabel: "지키거나 얻고 싶은 것",
    },
    {
      id: "allocation",
      kind: "allocation",
      field: "allocation",
      from: "raw_values",
      total: 100,
      prompt: "100개의 심리 코인을 방금 적은 것들에 나눠 주세요. 합이 정확히 100이 되어야 해요.",
    },
    {
      id: "flip",
      kind: "text",
      field: "raw_condition",
      prompt: (ctx) => {
        const [top, bottom] = topBottom(ctx);
        return (
          `당신은 이 상황에서 [${top}]에 가장 높은 비중을 두었고, [${bottom}]${은는(bottom)} 과감히 후순위로 미뤘다.\n` +
          `그렇다면, 어떤 예외적인 상황이나 조건이 발생하면 당신은 1위인 [${top}]${을를(top)} 포기하고 기꺼이 꼴찌였던 [${bottom}]${을를(bottom)} 선택하겠는가?`
        );
      },
    },
  ],
  shape: (payload, ctx) => {
    const labels = (payload.raw_values as string[]) ?? [];
    const points = (payload.allocation as Record<string, number>) ?? {};
    const [top, bottom] = topBottom(ctx);
    return {
      context: payload.context,
      // Entered order is kept (the doc's example sorts by points, which would lose it).
      allocations: labels.map((l) => ({ raw_verbatim: l, points: points[l] ?? 0 })),
      flip_condition: { top_value: top, bottom_value: bottom, raw_condition: payload.raw_condition },
    };
  },
};

// ── 두려운 자기와 조기 경보 ─────────────────────────────────────────────────────────
const FEARED_PROMPT: Record<"work" | "relation" | "self", string> = {
  work: "당신의 일이나 커리어와 관련해서, 절대 되고 싶지 않은 가장 두렵거나 피하고 싶은 모습은 어떤 모습인가?",
  relation: "인간관계 안에서, 당신이 절대 되고 싶지 않은 가장 피하고 싶은 모습은 어떤 모습인가?",
  self: "개인적인 삶이나 내면에 있어서, 당신이 절대 되고 싶지 않은 가장 두려운 모습은 어떤 모습인가?",
};

export const fearedSelf: ModuleDef = {
  id: "feared_self",
  title: "두려운 자기와 조기 경보",
  minutes: "5~8",
  intro:
    "되고 싶지 않은 모습을 떠올리고, 그 모습에 가까워질 때 나타나는 신호를 적어요. 마음이 불편해지면 언제든 멈춰도 괜찮아요.",
  stimuli: [
    {
      id: PILOT_DOMAIN.feared_self,
      title: DOMAIN_TITLE[PILOT_DOMAIN.feared_self],
      body: "",
      domain: PILOT_DOMAIN.feared_self as Domain,
    },
  ],
  steps: [
    {
      id: "feared",
      kind: "text",
      field: "raw_feared",
      prompt: ({ stimulus }) => FEARED_PROMPT[(stimulus?.id as "work" | "relation" | "self") ?? "self"],
      prefill: "내가 절대 되고 싶지 않은 가장 두려운 내 모습은...",
    },
    {
      id: "early_warning",
      kind: "text",
      field: "raw_early_warning",
      prompt: ({ answers }) =>
        `당신이 방금 말한 ${(answers.raw_feared as string) ?? ""} 상태로 빠져들고 있다는 것을 보여주는, 가장 첫 번째 행동이나 생각의 신호(조기 경보)는 무엇인가?`,
      hint: "내면의 막연한 기분(예: '우울하다', '짜증난다')보다는, 타인의 눈이나 카메라로 관찰할 수 있는 구체적인 행동 변화를 적어주세요.",
      prefill: "그런 상태로 빠져들 때 나타나는 가장 첫 번째 행동 신호는...",
    },
    {
      id: "defense",
      kind: "text",
      field: "raw_defense",
      prompt: "그 신호가 켜졌을 때, 당신이 그 상태를 피하거나 감추기 위해 습관적으로 취하는 방어 행동은 무엇인가?",
      prefill: "그 신호가 켜졌을 때, 내가 습관적으로 하는 행동은...",
      pin: ["raw_early_warning"],
    },
    {
      id: "reality_check",
      kind: "text",
      field: "raw_reality_check",
      prompt:
        "과거에 그 두려웠던 상태를 피하지 못하고 마주했던 적이 있다면, 그때 실제로 어떤 일이 벌어졌는가? (혹은 생각보다 괜찮았던 예외적인 경험이 있는가?)",
      optional: true,
    },
  ],
};

// ── 일화적 미래 사고 (EFT) ─────────────────────────────────────────────────────────
export const eft: ModuleDef = {
  id: "eft",
  title: "일화적 미래 사고",
  minutes: "5~8",
  intro: "5년 뒤의 아주 평범한 하루를 떠올려 적어요. 특별한 날이 아니라 그냥 평범한 수요일 오후예요.",
  constants: { horizon: "5y" },
  steps: [
    {
      id: "future_scene",
      kind: "text",
      field: "raw_future_scene",
      prompt:
        "5년 뒤의 가장 평범한 수요일 오후 3시. 당신은 어디서, 무엇을, 누구와 하고 있습니까? 억지로 지어낼 필요 없이, 머릿속에 가장 먼저 떠오르는 장면을 있는 그대로 적어주세요.",
      hint: "눈앞에 보이는 장면을 자유롭게 적어주세요",
      prefill: "5년 뒤 수요일 오후 3시, 나는...",
      skipLabel: "잘 모르겠다",
    },
    {
      id: "continuity",
      kind: "text",
      field: "raw_continuity",
      prompt:
        "방금 묘사한 그 사람(미래의 당신)은 지금의 당신과 같은 사람인가, 아니면 거의 다른 사람인가? 무엇이 그대로이고 무엇이 달라져 있는가?",
      pin: ["raw_future_scene"],
      skipLabel: "잘 모르겠다",
    },
    {
      id: "near_future",
      kind: "text",
      field: "raw_near_future",
      prompt: "그렇다면 내년 이맘때의 평범한 하루는 어떤가요? 지금과 무엇이 가장 달라져 있을 것 같습니까?",
      prefill: "내년 이맘때의 하루를 떠올려보면, 나는...",
      optional: true,
      skipLabel: "잘 모르겠다",
    },
    {
      id: "domain",
      kind: "domain_tag",
      field: "domain",
      prompt: "방금 상상하신 미래의 장면은 주로 어떤 맥락에 해당합니까?",
      options: [
        { value: "work", label: "일/과업" },
        { value: "relation", label: "관계/소통" },
        { value: "self", label: "개인/자기" },
        { value: "general", label: "범용적/복합적" },
      ],
    },
  ],
};

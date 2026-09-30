import type { ModuleDef } from "./types";

// Prompts verbatim from extracting-the-human-mind/extraction/{core_conflict,critical_incident,
// attachment_narrative,judgment_scenarios}.md. Where a doc leaves a gap, the choice below is a
// pilot default recorded as [User Review] in that doc's 미결 사항 (decide before launch).

export const ccrt: ModuleDef = {
  id: "ccrt",
  title: "핵심 갈등 도식",
  minutes: "10~15",
  intro:
    "마음이 자주 쓰이거나 부딪힘이 반복되는 사람을 떠올리고, 그 사람과 있었던 한 장면을 세 칸으로 나눠 적어요. 사람을 바꿔 가며 세 번 반복해요.",
  cards: { min: 3, label: "장면" },
  steps: [
    {
      id: "object_tag",
      kind: "short_text",
      field: "object_tag",
      prompt: "최근 마음이 자주 쓰이거나 부딪힘이 반복되는 사람 한 명을 떠올려 본다.",
      // Gap: the doc has no prompt for object_tag (pilot default, [User Review] in core_conflict.md).
      hint: "이름은 적지 말고, 당신과 어떤 관계인 사람인지만 적어 주세요.",
    },
    {
      id: "response_other",
      kind: "text",
      field: "raw_response_other",
      prompt: "가장 기억에 남는 구체적인 갈등이나 답답했던 순간을 떠올린다. 그 사람은 나에게 구체적으로 [ ]게 행동하거나 반응했다.",
    },
    {
      id: "response_self",
      kind: "text",
      field: "raw_response_self",
      prompt: "그 반응을 보고, 나는 결과적으로 [ ]게 행동했다(또는 느꼈다).",
      pin: ["raw_response_other"],
    },
    {
      id: "wish",
      kind: "text",
      field: "raw_wish",
      prompt: "돌이켜 생각해 보면, 그 순간 내 마음 깊은 곳에서 진짜로 바랐던 것은 [ ]이다.",
      pin: ["raw_response_other", "raw_response_self"],
    },
    {
      id: "recurrence",
      kind: "yes_no_text",
      field: "raw_recurrence",
      prompt: "이런 흐름(바람 → 상대 반응 → 내 반응)이 이 사람 말고 다른 관계에서도 비슷하게 반복된 적이 있는가?",
      yes: "있다",
      no: "없다",
      optional: true,
    },
    {
      id: "domain",
      kind: "domain_tag",
      field: "domain",
      prompt: "이 분과의 관계는 주로 어떤 맥락에 해당합니까?",
      options: [
        { value: "work", label: "직장 동료" },
        { value: "relation", label: "사적 지인" },
        { value: "general", label: "범용적 타인" },
      ],
    },
  ],
};

export const cit: ModuleDef = {
  id: "cit",
  title: "자기 보고식 사건 분석",
  minutes: "5~10",
  intro: "최근에 가장 막막했던 사건 하나를 떠올리고, 그때 무엇이 문제였고 실제로 어떻게 했는지 적어요.",
  constants: { data_type: "retrospective_self_report" },
  steps: [
    {
      id: "incident",
      kind: "text",
      field: "raw_incident",
      prompt: "최근 당신의 삶에서, 가장 막막하거나 손쓸 수 없이 꼬였던 구체적인 단일 사건 하나를 떠올려 보라. 언제, 무슨 일이었는가?",
      hint: "여러 번 있었던 일이라면, 그중 딱 한 번의 장면을 떠올려 주세요",
    },
    {
      id: "problem",
      kind: "text",
      field: "raw_problem",
      prompt: "그 상황에서 당신에게 가장 큰 문제는 정확히 무엇이었는가?",
      pin: ["raw_incident"],
    },
    {
      id: "action",
      kind: "text",
      field: "raw_action",
      prompt: "그래서 당신은 그때 실제로 어떻게 했는가? (생각이 아니라 한 행동으로)",
    },
    {
      id: "outcome",
      kind: "text",
      field: "raw_outcome",
      prompt: "그 대응의 결과는 어땠는가? 그 방법이 통했는가, 아니면 안 통했는가?",
      optional: true,
    },
    {
      id: "representativeness",
      kind: "rating",
      field: "representativeness_score",
      prompt: "이런 식의 문제 상황과 당신의 대처 방식은 평소 당신의 패턴을 얼마나 잘 대표하는가?",
      min: 1,
      max: 5,
      lowLabel: "1: 어쩌다 한 번 있는 예외적 사건",
      highLabel: "5: 내 삶에서 아주 자주 반복되는 패턴",
    },
    {
      id: "domain",
      kind: "domain_tag",
      field: "domain",
      prompt: "방금 적어주신 이 사건은 다음 중 어느 영역에 가장 가깝습니까?",
      options: [
        { value: "work", label: "일/과업" },
        { value: "relation", label: "관계/소통" },
        { value: "self", label: "개인/자기" },
        { value: "general", label: "해당 없음/복합적" },
      ],
    },
  ],
};

/** Per-stem sentence starters (마중물), verbatim including the trailing space. */
export const STEM_STARTERS: Record<string, string> = {
  "A-romantic": "3시간째 답이 없는 화면을 보며, 나는... ",
  "C-friendship": "나만 빼고 흘러가는 대화를 지켜보며, 나는... ",
};

const STEM_PROBE =
  "이 상황을 마주한 직후, 당신의 다음 10분은 어떻게 흘러갑니까? 머릿속에 그려지는 생각과 당신의 행동을 있는 그대로 적어주세요.";

export const attachmentStoryStem: ModuleDef = {
  id: "attachment_story_stem",
  title: "관계 장면 이어 쓰기",
  minutes: "4~7",
  intro: "짧은 관계 장면을 읽고, 그 직후 10분 동안 당신이 무엇을 생각하고 어떻게 할지 이어서 적어요.",
  stimulusField: "stem_id",
  stimulusBodyField: "prompt",
  // Gap: the doc shows 1~2 of 3 stems without saying which; pilot default A + C
  // (stem B's starter adds cues the neutral stem lacks). [User Review] in attachment_narrative.md.
  stimuli: [
    {
      id: "A-romantic",
      domain: "relation",
      body: "당신은 연인에게 '오늘 좀 힘드네'라고 문자를 보냈다. 3시간이 지났고, '읽음' 표시만 떠 있을 뿐 답이 없다.",
    },
    {
      id: "C-friendship",
      domain: "relation",
      body: "친한 친구들이 모인 자리에서, 어느 순간 대화가 당신만 빼고 흘러가고 있다는 느낌이 든다.",
    },
  ],
  steps: [
    {
      id: "continuation",
      kind: "text",
      field: "raw_verbatim",
      prompt: STEM_PROBE,
      hint: "이후에 벌어진 일을 자유롭게 적어주세요",
      prefill: ({ stimulus }) => STEM_STARTERS[stimulus?.id ?? ""] ?? "",
    },
  ],
};


export const judgmentScenario: ModuleDef = {
  id: "judgment_scenario",
  title: "판단 스타일 시나리오",
  minutes: "5~10",
  intro: "정답이 없는 딜레마를 읽고, 결정하기 전에 무엇을 확인하고 싶은지, 그리고 무엇이 마음을 기울게 할지 적어요.",
  stimulusField: "scenario_id",
  // Gap: the doc presents one scenario for the session's domain without saying which; pilot default is
  // the first work and first relation scenario, so everyone gets the same two. [User Review] in judgment_scenarios.md.
  stimuli: [
    {
      id: "direction_dilemma",
      title: "방향성의 딜레마",
      domain: "work",
      body: "당신은 프로젝트 리더다. 마감일이 얼마 남지 않았는데, 팀원 절반은 '기존 방식을 유지해 안전하게 가자(A)'고 하고, 나머지 절반은 '리스크가 커도 혁신적인 새 방식을 도입하자(B)'고 팽팽하게 대립하고 있다.",
    },
    {
      id: "secret_trust_dilemma",
      title: "비밀과 신뢰의 딜레마",
      domain: "relation",
      body: "당신과 가장 친한 동료가 곧 회사의 핵심 클라이언트를 빼내어 퇴사할 계획이라고 당신에게만 비밀리에 털어놓았다. 회사가 이 사실을 모르면 큰 타격을 입게 된다.",
    },
  ],
  steps: [
    {
      id: "missing_info",
      kind: "text",
      field: "raw_missing_info",
      prompt: "이 상황에서 당신이 당장 어느 한쪽으로 결정을 내리기 위해, 판단을 보류하고 가장 먼저 추가로 확인해야 할 정보나 맥락은 무엇인가?",
    },
    {
      id: "tiebreaker",
      kind: "text",
      field: "raw_tiebreaker",
      prompt: "당신이 원했던 그 정보가 확인되었다고 가정해 보자. 그렇다면 최종적으로 결정을 내릴 때, 당신의 마음을 기울게 만들 가장 결정적인 단 하나의 기준(Rule)은 무엇인가?",
      pin: ["raw_missing_info"],
    },
  ],
};

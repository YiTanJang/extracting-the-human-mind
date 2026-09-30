import type { ModuleDef } from "./types";

// Q1 arms (validation_mode §1-3 3-arm A4, registry B-08). Prompt wording is a pilot draft —
// architecture/pilot.md 「Q1 설계 쟁점」 (탐색중), to be confirmed by the researcher before launch.

export const freeOpen: ModuleDef = {
  id: "q1_free_open",
  title: "자유롭게 쓰기",
  minutes: "15~20",
  intro:
    "정해진 질문 없이, 당신에 대해 자유롭게 쓰는 시간이에요. 무엇을 쓰든, 얼마나 길게 쓰든 괜찮아요. 맞춤법이나 문장 다듬기는 신경 쓰지 않아도 돼요.",
  steps: [
    {
      id: "open",
      kind: "free_write",
      field: "raw_free_text",
      prompt: "당신은 어떤 사람인가요? 정해진 주제나 순서는 없어요. 떠오르는 대로 편하게 적어 주세요.",
      recommendMinutes: 15,
    },
  ],
};

export const freeDeep: ModuleDef = {
  id: "q1_free_deep",
  title: "조금 더 깊이 쓰기",
  minutes: "15~20",
  intro: "이번에는 몇 가지 질문이 있어요. 질문마다 떠오르는 만큼 자유롭게 적어 주세요.",
  steps: [
    {
      id: "hard_moment",
      kind: "free_write",
      field: "raw_hard_moment",
      prompt: "요즘 당신에게 가장 힘들었던 순간을 이야기해 주세요.",
      recommendMinutes: 4,
    },
    {
      id: "what_matters",
      kind: "free_write",
      field: "raw_what_matters",
      prompt: "당신에게 정말 중요한 것은 무엇인가요? 그게 왜 중요한지도 함께 적어 주세요.",
      recommendMinutes: 4,
    },
    {
      id: "with_people",
      kind: "free_write",
      field: "raw_with_people",
      prompt: "사람들과 지낼 때 당신은 보통 어떤가요? 기억나는 장면이 있다면 함께 적어 주세요.",
      recommendMinutes: 4,
    },
    {
      id: "ahead",
      kind: "free_write",
      field: "raw_ahead",
      prompt: "앞으로의 삶에서 바라는 것, 그리고 걱정되는 것을 이야기해 주세요.",
      recommendMinutes: 4,
    },
  ],
};

"use client";

import { useEffect, useState } from "react";
import { Card, NavLinks, Title } from "@/components/ui";
import { api, type ConsentContent } from "@/lib/api";

// Shown even if the API is down.
const FALLBACK: ConsentContent["crisis_lines"] = [
  { name: "자살예방 상담전화", number: "109", note: "24시간, 무료" },
  { name: "긴급 상황", number: "112 / 119", note: "생명이 위급할 때" },
];

export default function Help() {
  const [lines, setLines] = useState(FALLBACK);

  useEffect(() => {
    api<ConsentContent>("/consent")
      .then((c) => setLines(c.crisis_lines))
      .catch(() => {});
  }, []);

  return (
    <>
      <Title sub="이 서비스는 심리 위기 개입 시스템이 아니에요. 힘들다면 지금 바로 사람에게 연락해 주세요.">
        힘들 때
      </Title>
      <Card tone="sage">
        <ul className="space-y-4">
          {lines.map((l) => (
            <li key={l.number}>
              <span className="block text-sm text-muted">{l.name}</span>
              <a href={`tel:${l.number.split(" ")[0]}`} className="text-3xl font-semibold">
                {l.number}
              </a>
              <span className="ml-2 text-sm text-muted">{l.note}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <p className="text-sm leading-relaxed">
          질문이 불편하거나 감정 소모가 커지면 언제든 멈춰도 괜찮아요. 멈춘 과제는 나중에 이어 할 수 있고, 원하면
          &apos;내 데이터&apos;에서 모든 기록을 지울 수 있어요.
        </p>
      </Card>
      <NavLinks />
    </>
  );
}

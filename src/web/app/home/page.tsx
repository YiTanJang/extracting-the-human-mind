"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, ErrorNote, NavLinks, Title } from "@/components/ui";
import { api, explain } from "@/lib/api";
import { MODULES } from "@/lib/modules";
import { useMe } from "@/lib/useMe";

type ProgressStep = {
  module: string;
  stage: "arm" | "battery";
  status: "done" | "available" | "locked";
  entries: number;
  has_draft: boolean;
};

export default function Home() {
  const { me } = useMe();
  const [steps, setSteps] = useState<ProgressStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    api<{ steps: ProgressStep[] }>("/progress")
      .then((p) => setSteps(p.steps))
      .catch((err) => setError(explain(err)));
  }, [me]);

  if (!me || (!steps && !error)) return <p className="text-muted">불러오는 중…</p>;

  const done = steps?.filter((s) => s.status === "done").length ?? 0;
  const current = steps?.find((s) => s.status === "available");

  return (
    <>
      <Title sub="과제는 정해진 순서대로 하나씩 열려요. 한 번에 다 하지 않아도 괜찮아요.">{me.nickname} 님, 반가워요</Title>
      <ErrorNote message={error} />

      {steps && (
        <>
          <p className="mb-4 text-sm text-muted">
            {done} / {steps.length} 완료
          </p>
          {!current && done === steps.length && (
            <Card tone="sage">
              <p className="font-medium">지금 열린 과제를 모두 마쳤어요. 고마워요.</p>
              <p className="mt-1 text-sm text-muted">다음 과제가 열리면 알려 드릴게요.</p>
            </Card>
          )}
          <ol className="space-y-2">
            {steps.map((s, i) => {
              const def = MODULES[s.module];
              const title = def?.title ?? s.module;
              const resume = s.has_draft || s.entries > 0;
              const body = (
                <div
                  className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 py-3 ${
                    s.status === "available"
                      ? "border-sage bg-sage-soft"
                      : s.status === "done"
                        ? "border-line bg-paper text-muted"
                        : "border-line/60 text-muted/70"
                  }`}
                >
                  <span>
                    <span className="mr-2 text-xs">{i + 1}.</span>
                    {title}
                    {def && s.status === "available" && <span className="ml-2 text-xs text-muted">약 {def.minutes}분</span>}
                  </span>
                  <span className="text-sm">
                    {s.status === "done" ? "완료" : s.status === "available" ? (resume ? "이어서 하기 →" : "시작하기 →") : "잠김"}
                  </span>
                </div>
              );
              return (
                <li key={s.module}>
                  {s.status === "available" && def ? <Link href={`/m/${s.module}`}>{body}</Link> : body}
                </li>
              );
            })}
          </ol>
        </>
      )}
      <NavLinks />
    </>
  );
}

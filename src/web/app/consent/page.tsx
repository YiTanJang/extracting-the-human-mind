"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomBar, Button, Card, ErrorNote, Switch, Title } from "@/components/ui";
import { api, explain, type ConsentContent, type Toggles } from "@/lib/api";
import { useMe } from "@/lib/useMe";

const ALL_OFF: Toggles = { analysis: false, simulation: false, validation: false, research_harvest: false };

export default function ConsentPage() {
  const router = useRouter();
  const { me } = useMe({ allowWithoutConsent: true });
  const [content, setContent] = useState<ConsentContent | null>(null);
  const [toggles, setToggles] = useState<Toggles>(ALL_OFF);
  const [read, setRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<ConsentContent>("/consent").then(setContent).catch((err) => setError(explain(err)));
  }, []);

  useEffect(() => {
    // Re-consent after a wording change starts from the participant's current choices.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me) setToggles(me.consent.toggles);
  }, [me]);

  async function agree() {
    if (!content) return;
    setBusy(true);
    setError(null);
    try {
      await api("/consent/agree", { method: "POST", json: { version: content.version, toggles } });
      router.replace("/home");
    } catch (err) {
      setError(explain(err));
      setBusy(false);
    }
  }

  if (!content || !me) return <p className="text-muted">불러오는 중…</p>;

  return (
    <>
      <Title sub={`${me.nickname} 님, 시작하기 전에 꼭 읽어 주세요.`}>참가 전 확인</Title>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">이 실험의 리스크</h2>
        <ul className="space-y-3">
          {content.risks.map((r) => (
            <li key={r.title}>
              <span className="font-medium">{r.title}</span>
              <span className="block text-sm text-muted">{r.body}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">내 데이터는</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          {content.data_notice.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <a href={content.full_document_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm underline">
          전체 안내문 읽기
        </a>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-semibold">용도별 사용 동의</h2>
        <p className="mb-2 text-sm text-muted">모두 꺼진 상태로 시작해요. 켠 용도에만 쓰이고, 언제든 되돌릴 수 있어요.</p>
        <div className="divide-y divide-line">
          {content.purposes.map((p) => (
            <Switch
              key={p.key}
              label={p.label}
              description={p.description}
              checked={toggles[p.key]}
              onChange={(v) => setToggles((t) => ({ ...t, [p.key]: v }))}
            />
          ))}
        </div>
      </Card>

      <Card tone="sage">
        <h2 className="mb-3 text-lg font-semibold">참가 동의 문구</h2>
        <p className="text-sm leading-relaxed">{content.text}</p>
        <label className="mt-4 flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={read}
            onChange={(e) => setRead(e.target.checked)}
            className="h-5 w-5 accent-[var(--sage)]"
          />
          <span className="font-medium">위 내용을 읽고 동의합니다</span>
        </label>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">짧은 운영 룰</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {content.house_rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Card>

      <ErrorNote message={error} />
      <BottomBar>
        <Button className="w-full" disabled={!read || busy} onClick={agree}>
          동의하고 시작하기
        </Button>
      </BottomBar>
    </>
  );
}

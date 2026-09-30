"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, ErrorNote, NavLinks, Switch, TextField, Title } from "@/components/ui";
import { api, downloadJson, explain, type ConsentContent, type Toggles } from "@/lib/api";
import { useMe } from "@/lib/useMe";

export default function MyData() {
  const router = useRouter();
  const { me, setMe } = useMe();
  const [purposes, setPurposes] = useState<ConsentContent["purposes"]>([]);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ConsentContent>("/consent")
      .then((c) => setPurposes(c.purposes))
      .catch(() => {});
  }, []);

  async function toggle(purpose: keyof Toggles, granted: boolean) {
    if (!me) return;
    try {
      const res = await api<{ toggles: Toggles }>("/consent/toggles", { method: "PUT", json: { purpose, granted } });
      setMe({ ...me, consent: { ...me.consent, toggles: res.toggles } });
    } catch (err) {
      setError(explain(err));
    }
  }

  async function exportMine() {
    try {
      downloadJson(`my-data-${new Date().toISOString().slice(0, 10)}.json`, await api("/me/export"));
    } catch (err) {
      setError(explain(err));
    }
  }

  async function rotate() {
    try {
      setRecovery((await api<{ recovery_code: string }>("/auth/recovery-code", { method: "POST" })).recovery_code);
    } catch (err) {
      setError(explain(err));
    }
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/");
  }

  async function deleteAll() {
    try {
      await api("/me/delete", { method: "POST", json: { confirm } });
      router.replace("/");
    } catch (err) {
      setError(explain(err));
    }
  }

  if (!me) return <p className="text-muted">불러오는 중…</p>;

  return (
    <>
      <Title sub={me.nickname}>내 데이터</Title>
      <ErrorNote message={error} />

      <Card>
        <h2 className="mb-1 text-lg font-semibold">용도별 사용 동의</h2>
        <p className="mb-2 text-sm text-muted">끄면 그 시점 이후로 해당 용도에 더 쓰지 않아요.</p>
        <div className="divide-y divide-line">
          {purposes.map((p) => (
            <Switch
              key={p.key}
              label={p.label}
              description={p.description}
              checked={me.consent.toggles[p.key]}
              onChange={(v) => toggle(p.key, v)}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">내보내기</h2>
        <p className="mb-4 text-sm text-muted">지금까지 적은 내용 전체를 파일로 받아요.</p>
        <Button variant="quiet" onClick={exportMine}>
          JSON으로 받기
        </Button>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">재접속 코드</h2>
        <p className="mb-4 text-sm text-muted">새 코드를 받으면 예전 코드는 더 이상 쓸 수 없어요.</p>
        {recovery ? (
          <p className="select-all rounded-xl bg-sage-soft p-4 text-center font-mono text-xl tracking-wider">{recovery}</p>
        ) : (
          <Button variant="quiet" onClick={rotate}>
            새 재접속 코드 받기
          </Button>
        )}
      </Card>

      <Card tone="warm">
        <h2 className="mb-2 text-lg font-semibold">모든 데이터 삭제</h2>
        <p className="mb-4 text-sm">
          내가 적은 모든 응답과 동의 기록이 영구 삭제되고, 복구할 수 없어요. 삭제 사실(날짜와 건수)만 남아요.
        </p>
        <TextField label="확인을 위해 '삭제'라고 입력해 주세요" value={confirm} onChange={setConfirm} />
        <Button variant="warm" disabled={confirm !== "삭제"} onClick={deleteAll}>
          영구 삭제
        </Button>
      </Card>

      <Button variant="quiet" onClick={logout}>
        이 기기에서 로그아웃
      </Button>
      <NavLinks />
    </>
  );
}

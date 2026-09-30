"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, ErrorNote, TextField, Title } from "@/components/ui";
import { api, explain, type Me } from "@/lib/api";

type Mode = "join" | "resume";

export default function Landing() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("join");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [recovery, setRecovery] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Already signed in on this device → skip the landing page.
    api<Me>("/me")
      .then((me) => router.replace(me.consent.is_current ? "/home" : "/consent"))
      .catch(() => {});
  }, [router]);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ recovery_code: string }>("/auth/redeem", {
        method: "POST",
        json: { code, nickname, age_confirmed: ageOk },
      });
      setIssued(res.recovery_code);
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  }

  async function resume() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ me: Me }>("/auth/resume", { method: "POST", json: { recovery_code: recovery } });
      router.replace(res.me.consent.is_current ? "/home" : "/consent");
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  }

  if (issued) {
    return (
      <>
        <Title sub="다른 기기에서 이어 하거나 브라우저 기록이 지워졌을 때 필요해요. 이 화면을 벗어나면 다시 볼 수 없어요.">
          재접속 코드를 저장해 두세요
        </Title>
        <Card tone="sage">
          <p className="select-all text-center font-mono text-2xl tracking-wider">{issued}</p>
        </Card>
        <div className="flex gap-3">
          <Button variant="quiet" onClick={() => navigator.clipboard.writeText(issued)}>
            복사하기
          </Button>
          <Button onClick={() => router.replace("/consent")}>저장했어요</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Title sub="초대받은 사람만 참여할 수 있는 연구 파일럿이에요.">마음 추출 파일럿</Title>

      <div className="mb-6 flex gap-2" role="tablist">
        {(["join", "resume"] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`min-h-11 flex-1 rounded-xl border px-4 ${mode === m ? "border-sage bg-sage-soft" : "border-line"}`}
          >
            {m === "join" ? "처음 왔어요" : "이어서 할래요"}
          </button>
        ))}
      </div>

      <ErrorNote message={error} />

      {mode === "join" ? (
        <Card>
          <TextField label="초대 코드" value={code} onChange={setCode} placeholder="XXXX-XXXX-XXXX" />
          <TextField
            label="닉네임 (실명 대신 불릴 이름)"
            value={nickname}
            onChange={setNickname}
            placeholder="예: 노을"
          />
          <label className="mb-5 flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={ageOk}
              onChange={(e) => setAgeOk(e.target.checked)}
              className="h-5 w-5 accent-[var(--sage)]"
            />
            <span>만 16세 이상입니다</span>
          </label>
          <Button className="w-full" disabled={busy || !code || !nickname.trim() || !ageOk} onClick={join}>
            시작하기
          </Button>
        </Card>
      ) : (
        <Card>
          <TextField label="재접속 코드" value={recovery} onChange={setRecovery} placeholder="XXXX-XXXX-XXXX-XXXX" />
          <Button className="w-full" disabled={busy || !recovery} onClick={resume}>
            이어서 하기
          </Button>
        </Card>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button, Card, ErrorNote, TextField, Title } from "@/components/ui";
import { api, downloadJson, explain, type Toggles } from "@/lib/api";

type Invite = { code: string; note: string; created_at: string; redeemed_at: string | null };
type Person = {
  id: string;
  nickname: string;
  created_at: string;
  consent_current: boolean;
  toggles: Toggles;
  raw_entries: number;
};

const TOKEN_KEY = "pilot_admin_token";

function readToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function Admin() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [count, setCount] = useState("1");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const call = <T,>(path: string, init: RequestInit & { json?: unknown } = {}) =>
    api<T>(`/admin${path}`, { ...init, headers: { authorization: `Bearer ${token}` } });

  async function refresh() {
    try {
      const [inv, ppl] = await Promise.all([call<Invite[]>("/invites"), call<Person[]>("/participants")]);
      setInvites(inv);
      setPeople(ppl);
      setAuthed(true);
      setError(null);
      try {
        sessionStorage.setItem(TOKEN_KEY, token);
      } catch {
        /* storage unavailable */
      }
    } catch (err) {
      setAuthed(false);
      setError(explain(err));
    }
  }

  useEffect(() => {
    // Restore the token for this browser tab only (sessionStorage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(readToken());
  }, []);

  async function createInvites() {
    try {
      await call("/invites", { method: "POST", json: { count: Number(count) || 1, note } });
      setNote("");
      await refresh();
    } catch (err) {
      setError(explain(err));
    }
  }

  async function exportAll() {
    try {
      downloadJson(`pilot-export-${new Date().toISOString().slice(0, 19)}.json`, await call("/export"));
    } catch (err) {
      setError(explain(err));
    }
  }

  if (!authed) {
    return (
      <>
        <Title>연구자</Title>
        <ErrorNote message={error} />
        <Card>
          <TextField label="관리자 토큰" value={token} onChange={setToken} autoComplete="current-password" />
          <Button disabled={!token} onClick={refresh}>
            열기
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <Title>연구자</Title>
      <ErrorNote message={error} />

      <Card>
        <h2 className="mb-3 text-lg font-semibold">초대 코드 만들기</h2>
        <TextField label="개수" value={count} onChange={setCount} />
        <TextField label="메모 (누구에게 보낼지, 참가자에게 안 보임)" value={note} onChange={setNote} />
        <Button onClick={createInvites}>만들기</Button>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">초대 코드</h2>
        <ul className="space-y-2 text-sm">
          {invites.map((i) => (
            <li key={i.code} className="flex justify-between gap-3">
              <span className="select-all font-mono">{i.code}</span>
              <span className="text-muted">{i.note}</span>
              <span className={i.redeemed_at ? "text-muted" : "text-sage"}>{i.redeemed_at ? "사용됨" : "미사용"}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">참가자 {people.length}명</h2>
        <ul className="space-y-3 text-sm">
          {people.map((p) => (
            <li key={p.id}>
              <span className="font-medium">{p.nickname}</span>
              <span className="ml-2 text-muted">응답 {p.raw_entries}건</span>
              <span className="block text-muted">
                동의 {p.consent_current ? "최신" : "필요"} · 켜진 용도:{" "}
                {Object.entries(p.toggles)
                  .filter(([, on]) => on)
                  .map(([k]) => k)
                  .join(", ") || "없음"}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex gap-3">
        <Button variant="quiet" onClick={refresh}>
          새로고침
        </Button>
        <Button onClick={exportAll}>전체 내보내기</Button>
      </div>
    </>
  );
}

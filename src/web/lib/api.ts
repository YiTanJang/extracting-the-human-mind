export type Toggles = Record<"analysis" | "simulation" | "validation" | "research_harvest", boolean>;

export type Me = {
  id: string;
  nickname: string;
  created_at: string;
  consent: {
    required_version: string;
    agreed_version: string | null;
    agreed_at: string | null;
    is_current: boolean;
    toggles: Toggles;
  };
};

export type ConsentContent = {
  version: string;
  text: string;
  risks: { title: string; body: string }[];
  house_rules: string[];
  data_notice: string[];
  purposes: { key: keyof Toggles; label: string; description: string }[];
  crisis_lines: { name: string; number: string; note: string }[];
  full_document_url: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    ...rest,
    headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

/** Korean messages for API error codes shown to participants. */
export function explain(err: unknown): string {
  if (!(err instanceof ApiError)) return "연결에 문제가 있어요. 잠시 후 다시 시도해 주세요.";
  const messages: Record<string, string> = {
    invalid_invite_code: "초대 코드를 확인해 주세요. 이미 사용된 코드일 수도 있어요.",
    invalid_recovery_code: "재접속 코드를 확인해 주세요.",
    age_confirmation_required: "만 16세 이상만 참여할 수 있어요.",
    too_many_attempts: "시도가 너무 많았어요. 10분 뒤에 다시 시도해 주세요.",
    consent_version_changed: "안내문이 바뀌었어요. 새로고침 후 다시 읽어 주세요.",
    confirmation_mismatch: "확인 문구가 일치하지 않아요.",
    login_required: "다시 로그인해 주세요.",
    api_unreachable: "서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.",
    module_locked: "아직 열리지 않은 과제예요. 앞 과제를 먼저 마쳐 주세요.",
    module_completed: "이미 마친 과제예요.",
    unknown_module: "없는 과제예요.",
    no_entries: "기록된 답이 없어요.",
    consent_required: "안내문 동의가 필요해요.",
  };
  return messages[err.detail] ?? `문제가 생겼어요 (${err.status}).`;
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

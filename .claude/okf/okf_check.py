#!/usr/bin/env python3
"""OKF 번들 형식 점검기 — 보고 전용, 표준 라이브러리만 쓴다.

  python okf_check.py check  [--root DIR] [--bundle DIR ...] [파일 ...]
  python okf_check.py digest [--root DIR] [--bundle DIR ...]
  python okf_check.py hook session-start | post-tool-use | stop

check   번들을 점검해 보고한다. 오류가 있으면 종료 코드 1.
digest  세션 시작용 현황 요약 (1,500자 이내).
hook    Claude Code 훅 입구. 훅 입력 JSON을 stdin으로 받는다.

점검하는 것: frontmatter와 type, 예약 파일(index.md·log.md) 규칙, log.md 날짜 헤딩,
마커 문법과 결정 기록 날짜, 코드 밖의 편집 흔적(취소선·HTML 주석), 본문이 바뀌었는데
timestamp가 그대로인 파일(git), 마커 없이 새로 생긴 섹션(git), 필수 파일, 깨진 상대 링크,
비밀값 패턴.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import date, datetime
from pathlib import Path
from urllib.parse import unquote

VERSION = "0.1.0"
NOT_CHECKED = ("점검하지 않는 것: 내용이 참인지, description이 본문과 맞는지, 확정이 정당했는지, "
               "인용이 실제 근거인지. 근거 필드를 요구하지도 않는다.")
TYPES = {"Vision", "Goals", "Roadmap", "Design", "Data Source", "Playbook", "Reference", "Open Questions"}
STAGING = {"inbox", "review", "journal", "outbox"}
SKIP_DIRS = STAGING | {"okf-system", "node_modules", "venv", "__pycache__"}
BOOKKEEPING = ("미결 사항", "결정 사항", "기각된 대안", "Citations", "Schema", "Examples")
DIGEST_LIMIT = 1500
LABEL = {"error": "오류", "warn": "경고", "note": "알림", "info": "정보"}

# 경계는 ASCII로만 판정한다. \b를 쓰면 한국어 조사가 바로 붙은 토큰을 놓친다.
_A, _Z = r"(?<![A-Za-z0-9_])", r"(?![A-Za-z0-9_])"
SECRETS = [
    ("private-key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("aws-access-key", re.compile(_A + r"(?:AKIA|ASIA)[0-9A-Z]{16}" + _Z)),
    ("github-token", re.compile(_A + r"(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})" + _Z)),
    ("gitlab-token", re.compile(_A + r"glpat-[A-Za-z0-9_\-]{20,}" + _Z)),
    ("sk-api-key", re.compile(_A + r"sk-(?=[A-Za-z0-9_\-]*\d)[A-Za-z0-9_\-]{32,}" + _Z)),
    ("stripe-live-key", re.compile(_A + r"[rs]k_live_[A-Za-z0-9]{16,}" + _Z)),
    ("slack-token", re.compile(_A + r"xox[abprs]-[A-Za-z0-9\-]{10,}" + _Z)),
    ("google-api-key", re.compile(_A + r"AIza[0-9A-Za-z_\-]{35}" + _Z)),
    ("huggingface-token", re.compile(_A + r"hf_[A-Za-z0-9]{30,}" + _Z)),
    ("npm-token", re.compile(_A + r"npm_[A-Za-z0-9]{36}" + _Z)),
    ("jwt", re.compile(_A + r"eyJ[A-Za-z0-9_\-]{8,}\.eyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}")),
    ("bearer-header", re.compile(r"(?i)authorization[\"']?\s*[:=]\s*[\"']?bearer\s+[A-Za-z0-9_\-.~+/]{16,}")),
    ("url-credentials", re.compile(r"[A-Za-z][A-Za-z0-9+.\-]*://[^/\s:@]+:[^/\s@]{3,}@")),
]

FENCE_RE = re.compile(r"^ {0,3}(`{3,}|~{3,})")
INLINE_CODE_RE = re.compile(r"(`+).*?\1")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
LOG_HEADING_RE = re.compile(r"^##\s+(.*?)\s*$")
ITEM_RE = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+(.*)$")
STATUS_RE = re.compile(r"\[(TODO|User Review|Ph\d+)\]")
DECISION_RE = re.compile(r"\[(해결됨|기각|번복됨)(?:\s*:\s*([^\]]*))?\]")
LINK_RE = re.compile(r"(?<!!)\[(?:[^\]\\]|\\.)*\]\(\s*<?([^)\s>]+)>?(?:\s+[\"'(][^)]*)?\)")
KEY_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_\-]*)\s*:(.*)$")
TIMESTAMP_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$")


class Report:
    def __init__(self) -> None:
        self.items: list[tuple[str, str, int, str]] = []
        self.reviews: list[tuple[str, int, str]] = []
        self.todo = self.ph = self.open_sections = self.hypotheses = self.assumptions = 0

    def add(self, level: str, rel: str, line: int, msg: str) -> None:
        self.items.append((level, rel, line, msg))

    def count(self, level: str) -> int:
        return sum(1 for item in self.items if item[0] == level)


# ── 파일 읽기와 파싱 ──────────────────────────────────────────────

def read_lines(path: Path) -> list[str]:
    text = path.read_bytes().decode("utf-8", errors="replace")
    if text.startswith("﻿"):
        text = text[1:]
    return text.replace("\r\n", "\n").replace("\r", "\n").split("\n")


def split_frontmatter(lines: list[str]) -> tuple[list[str] | None, int, bool]:
    """(frontmatter 줄 | None, 본문 시작 인덱스, 닫힘 여부)"""
    if not lines or lines[0].strip() != "---":
        return None, 0, True
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return lines[1:i], i + 1, True
    return lines[1:], len(lines), False


def scalar(value: str):
    value = value.strip()
    if value[:1] in ('"', "'"):
        end = value.find(value[0], 1)
        return value[1:end] if end > 0 else value[1:]
    if value.startswith("["):
        inner = value[1:value.rfind("]")] if "]" in value else value[1:]
        return [scalar(x) for x in inner.split(",") if x.strip()]
    return re.split(r"\s+#", value, maxsplit=1)[0].strip()


def parse_frontmatter(fm: list[str]) -> tuple[dict, dict, list[tuple[int, str]]]:
    """OKF가 쓰는 단순 YAML만 읽는다: key: value, 인라인 목록, 들여쓴 하위 줄."""
    data: dict = {}
    where: dict = {}
    problems: list[tuple[int, str]] = []
    key = None
    for n, raw in enumerate(fm, start=2):
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if raw[:1] in (" ", "\t") or raw.startswith("- "):
            if key is None:
                problems.append((n, "해석할 수 없는 frontmatter 줄"))
            continue
        m = KEY_RE.match(raw)
        if not m:
            problems.append((n, "해석할 수 없는 frontmatter 줄"))
            key = None
            continue
        key = m.group(1)
        if key in data:
            problems.append((n, f"frontmatter 키 '{key}'가 두 번 나온다"))
        data[key] = scalar(m.group(2))
        where[key] = n
    return data, where, problems


def code_mask(lines: list[str]) -> list[bool]:
    mask, fence = [False] * len(lines), None
    for i, line in enumerate(lines):
        if fence:
            mask[i] = True
            s = line.strip()
            if s and set(s) == {fence[0]} and len(s) >= len(fence):
                fence = None
            continue
        m = FENCE_RE.match(line)
        if m:
            mask[i] = True
            fence = m.group(1)
    return mask


def strip_inline_code(line: str) -> str:
    return INLINE_CODE_RE.sub(lambda m: " " * len(m.group(0)), line)


def real_date(text: str) -> bool:
    try:
        date.fromisoformat(text[:10])
        return len(text) >= 10 and text[4] == "-" and text[7] == "-"
    except ValueError:
        return False


def valid_timestamp(ts: str) -> bool:
    if not TIMESTAMP_RE.match(ts):
        return False
    try:
        datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


# ── 저장소·번들·git ───────────────────────────────────────────────

def find_root(start: Path) -> Path:
    p = start.resolve()
    for d in (p, *p.parents):
        if (d / ".git").exists():
            return d
    return p


def is_bundle_root(d: Path) -> bool:
    index = d / "index.md"
    if not index.is_file():
        return False
    fm, _, _ = split_frontmatter(read_lines(index))
    return fm is not None and "okf_version" in parse_frontmatter(fm)[0]


def skipped(name: str) -> bool:
    return name in SKIP_DIRS or name.startswith(".")


def find_bundles(repo: Path) -> list[Path]:
    found = []
    for dirpath, dirnames, _ in os.walk(repo):
        d = Path(dirpath)
        dirnames[:] = sorted(n for n in dirnames if not skipped(n))
        if is_bundle_root(d):
            found.append(d)
            dirnames[:] = []
    return found


def bundle_files(bundle: Path) -> list[Path]:
    out = []
    for dirpath, dirnames, filenames in os.walk(bundle):
        dirnames[:] = sorted(n for n in dirnames if not skipped(n))
        out += [Path(dirpath) / f for f in sorted(filenames) if f.lower().endswith(".md")]
    return out


def containing_bundle(path: Path, stop: Path | None = None) -> Path | None:
    for d in (path.parent, *path.parent.parents):
        if is_bundle_root(d):
            return d
        if d == stop:
            return None
    return None


def rel(path: Path, repo: Path) -> str:
    try:
        return path.relative_to(repo).as_posix()
    except ValueError:
        return path.as_posix()


class Git:
    def __init__(self, repo: Path) -> None:
        self.changed: set[Path] = set()
        top = self._run("rev-parse", "--show-toplevel", cwd=repo)
        self.ok = top is not None
        self.top = Path(top.strip()).resolve() if top else repo
        self.has_head = self.ok and self._run("rev-parse", "--verify", "-q", "HEAD") is not None
        if self.ok:
            out = self._run("status", "--porcelain=v1", "-z", "--untracked-files=all") or ""
            parts, i = out.split("\0"), 0
            while i < len(parts):
                entry = parts[i]
                i += 1
                if len(entry) < 4:
                    continue
                if entry[0] in "RC":
                    i += 1
                self.changed.add((self.top / entry[3:]).resolve())

    def _run(self, *args: str, cwd: Path | None = None) -> str | None:
        try:
            r = subprocess.run(["git", "-c", "core.quotepath=false", *args], cwd=cwd or self.top,
                               capture_output=True, encoding="utf-8", errors="replace", timeout=15)
        except (OSError, subprocess.SubprocessError):
            return None
        return r.stdout if r.returncode == 0 else None

    def head_lines(self, path: Path) -> list[str] | None:
        if not self.has_head:
            return None
        out = self._run("show", f"HEAD:{rel(path, self.top)}")
        return None if out is None else out.replace("\r\n", "\n").split("\n")


# ── 점검 ──────────────────────────────────────────────────────────

def sections(lines: list[str], mask: list[bool], start: int) -> list[tuple[str, int, bool]]:
    """(제목, 줄 번호, 열림 여부). `> 탐색중`은 그 헤딩의 하위 섹션까지 덮는다."""
    out, stack = [], []
    for i in range(start, len(lines)):
        if mask[i]:
            continue
        m = HEADING_RE.match(lines[i])
        if not m:
            continue
        level, title = len(m.group(1)), m.group(2).strip()
        while stack and stack[-1][0] >= level:
            stack.pop()
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        opened = (j < len(lines) and lines[j].strip() == "> 탐색중") or any(o for _, o in stack)
        stack.append((level, opened))
        if level >= 2:
            out.append((title, i + 1, opened))
    return out


def check_file(path: Path, bundle: Path, repo: Path, git: Git, report: Report) -> None:
    r = rel(path, repo)
    lines = read_lines(path)
    mask = code_mask(lines)
    name = path.name.lower()
    fm, body_start, closed = split_frontmatter(lines)
    concept = name not in ("index.md", "log.md")

    if name == "index.md" and fm is not None:
        keys = set(parse_frontmatter(fm)[0])
        if path.parent != bundle:
            report.add("error", r, 1, "하위 index.md에는 frontmatter를 붙이지 않는다")
        elif keys - {"okf_version"}:
            report.add("error", r, 1, "번들 루트 index.md frontmatter에는 okf_version만 둔다: "
                       + ", ".join(sorted(keys - {"okf_version"})))
    if name == "log.md":
        if fm is not None:
            report.add("error", r, 1, "log.md에는 frontmatter를 붙이지 않는다")
        check_log(lines, mask, r, report)

    data: dict = {}
    if concept:
        if fm is None:
            report.add("error", r, 1, "개념 문서에 frontmatter가 없다 (index.md·log.md만 예외)")
        else:
            if not closed:
                report.add("error", r, 1, "frontmatter가 '---'로 닫히지 않았다")
            data, where, problems = parse_frontmatter(fm)
            for n, msg in problems:
                report.add("error", r, n, msg)
            t = data.get("type")
            if not t or not isinstance(t, str):
                report.add("error", r, where.get("type", 1), "frontmatter에 비어 있지 않은 type이 없다")
            elif t not in TYPES:
                report.add("warn", r, where["type"], f"type '{t}'은 format.md 「type 값 목록」에 없는 값이다")
            for key in ("title", "description", "timestamp"):
                if not data.get(key):
                    report.add("warn", r, 1, f"frontmatter에 {key}가 없다")
            if data.get("description") in (">", "|", ">-", "|-", ">+", "|+"):
                report.add("warn", r, where["description"], "description은 한 줄 요약으로 쓴다")
            ts = data.get("timestamp")
            if isinstance(ts, str) and ts and not valid_timestamp(ts):
                report.add("warn", r, where["timestamp"],
                           f"timestamp '{ts}'가 ISO 8601 형식(예: 2026-09-26T00:00:00Z)이 아니다")

    for i in range(body_start, len(lines)):
        if mask[i]:
            continue
        line = strip_inline_code(lines[i])
        if re.search(r"~~[^~\s][^~]*~~", line):
            report.add("warn", r, i + 1, "취소선 — 편집 흔적은 본문에 남기지 않는다")
        if "<!--" in line:
            report.add("warn", r, i + 1, "HTML 주석 — 편집 흔적은 본문에 남기지 않는다")
        check_links(line, i + 1, path, bundle, r, report)
        if concept:
            check_markers(line, i + 1, r, report)

    for i, raw in enumerate(lines):
        for label, pattern in SECRETS:
            m = pattern.search(raw)
            if m:
                report.add("error", r, i + 1, f"비밀값으로 보이는 문자열({label}: {m.group(0)[:6]}…) — 번들은 커밋·동기화된다")
                break

    if concept and fm is not None and path.resolve() in git.changed:
        check_against_head(path, lines, mask, body_start, data, git, r, report)


def check_markers(line: str, n: int, r: str, report: Report) -> None:
    s = line.strip()
    if s == "> 탐색중":
        report.open_sections += 1
        return
    if s.startswith("> 가설:"):
        report.hypotheses += 1
    elif s.startswith("> 가정:"):
        report.assumptions += 1
    item = ITEM_RE.match(line)
    if not item:
        return
    text = item.group(1).strip()
    statuses = STATUS_RE.findall(text)
    decisions = list(DECISION_RE.finditer(text))
    if not statuses and not decisions:
        return
    if "TODO" in statuses and "User Review" in statuses:
        report.add("error", r, n, "[TODO]와 [User Review]를 함께 달지 않는다 — [User Review]가 [TODO]를 대신한다")
    if not (STATUS_RE.match(text) or DECISION_RE.match(text)):
        report.add("warn", r, n, "마커는 항목 맨 앞에 붙인다")
    for m in decisions:
        arg = (m.group(2) or "").strip()
        if not real_date(arg):
            report.add("error", r, n, f"[{m.group(1)}] 기록에 올바른 날짜(YYYY-MM-DD)가 없다")
    if "User Review" in statuses:
        report.reviews.append((r, n, STATUS_RE.sub("", text).strip()))
    elif "TODO" in statuses:
        report.todo += 1
    elif statuses:
        report.ph += 1


def check_log(lines: list[str], mask: list[bool], r: str, report: Report) -> None:
    previous, seen = None, set()
    for i, line in enumerate(lines):
        m = None if mask[i] else LOG_HEADING_RE.match(line)
        if not m:
            continue
        head = m.group(1)
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", head) or not real_date(head):
            report.add("error", r, i + 1, f"날짜 헤딩은 '## YYYY-MM-DD'만 쓴다(원본 OKF §9) — 세션 제목은 첫 불릿 "
                       f"'- **세션**:'으로 옮긴다: '## {head}'")
            continue
        if head in seen:
            report.add("warn", r, i + 1, f"'## {head}' 헤딩이 두 번 나온다 — 같은 날은 한 헤딩 아래에 쓴다")
        if previous and head > previous:
            report.add("warn", r, i + 1, "날짜 헤딩이 최신순이 아니다")
        seen.add(head)
        previous = head


def check_links(line: str, n: int, path: Path, bundle: Path, r: str, report: Report) -> None:
    for m in LINK_RE.finditer(line):
        target = m.group(1)
        if target.startswith("#") or re.match(r"^[A-Za-z][A-Za-z0-9+.\-]*:", target):
            continue
        clean = unquote(target.split("#", 1)[0].split("?", 1)[0])
        if not clean:
            continue
        if clean.startswith("/"):
            report.add("warn", r, n, f"링크는 상대 경로로 쓴다: {target}")
            dest = bundle / clean.lstrip("/")
        else:
            dest = path.parent / clean
        if not dest.exists():
            report.add("info", r, n, f"없는 파일로 가는 링크: {target} (아직 쓰지 않은 지식이면 정상)")


def check_against_head(path: Path, lines: list[str], mask: list[bool], body_start: int, data: dict,
                       git: Git, r: str, report: Report) -> None:
    head = git.head_lines(path)
    head_titles: set[str] = set()
    if head is not None:
        hfm, hstart, _ = split_frontmatter(head)
        head_titles = {t for t, _, _ in sections(head, code_mask(head), hstart)}
        if hfm is not None:
            hdata = parse_frontmatter(hfm)[0]
            changed_body = "\n".join(lines[body_start:]).strip() != "\n".join(head[hstart:]).strip()
            if changed_body and data.get("timestamp") == hdata.get("timestamp"):
                report.add("warn", r, 1, "본문이 바뀌었는데 timestamp가 그대로다 — 상태가 바뀌었으면 "
                           "description도 본문에서 다시 쓴다")
    new = [(t, n) for t, n, opened in sections(lines, mask, body_start)
           if t not in head_titles and not opened and not t.startswith(BOOKKEEPING)]
    if new and data.get("type") != "Open Questions":
        names = ", ".join(f"'{t}'" for t, _ in new[:5]) + (" 외" if len(new) > 5 else "")
        report.add("note", r, new[0][1], f"새 섹션 {names}에 > 탐색중이 없다. 마커 없는 섹션은 확정으로 읽히므로, "
                   "사용자가 확인하지 않은 내용이면 > 탐색중을 단다")


def check_required(repo: Path, bundles: list[Path], report: Report) -> list[str]:
    missing = []
    for name in ("AGENTS.md", "CLAUDE.md"):
        if not (repo / name).is_file():
            missing.append(name)
            report.add("warn", name, 0, "필수 파일이 없다 (agent_workflow.md 「세션 시작 시 필수 파일 확인」)")
    if not missing:
        cl = read_lines(repo / "CLAUDE.md")
        mask = code_mask(cl)
        imports = {cl[i].strip()[1:].removeprefix("./") for i in range(len(cl))
                   if not mask[i] and cl[i].strip().startswith("@")}
        if "AGENTS.md" not in imports:
            report.add("warn", "CLAUDE.md", 0, "@AGENTS.md를 불러오지 않는다 — Claude Code는 CLAUDE.md가 있으면 "
                       "AGENTS.md를 따로 읽지 않는다")
        for b in bundles:
            target = "index.md" if b == repo else f"{rel(b, repo)}/index.md"
            if target not in imports:
                report.add("warn", "CLAUDE.md", 0, f"@{target}를 불러오지 않는다")
    for b in bundles:
        if not (b / "log.md").is_file():
            missing.append(rel(b / "log.md", repo))
            report.add("warn", rel(b / "log.md", repo), 0, "필수 파일이 없다")
    return missing


def check_bundle(repo: Path, bundle: Path, git: Git, report: Report) -> None:
    for f in bundle_files(bundle):
        check_file(f, bundle, repo, git, report)


# ── 출력 ──────────────────────────────────────────────────────────

def render(report: Report, header: str) -> str:
    out = [header, f"오류 {report.count('error')} · 경고 {report.count('warn')} · "
                   f"알림 {report.count('note')} · 정보 {report.count('info')}"]
    order = {"error": 0, "warn": 1, "note": 2, "info": 3}
    current = None
    for level, r, n, msg in sorted(report.items, key=lambda x: (x[1], order[x[0]], x[2])):
        if r != current:
            out.append(f"\n{r}")
            current = r
        out.append(f"  {LABEL[level]}{f' L{n}' if n else ''}: {msg}")
    out.append("\n" + NOT_CHECKED)
    return "\n".join(out)


def latest_handoff(log: Path) -> str | None:
    if not log.is_file():
        return None
    lines = read_lines(log)
    for i, line in enumerate(lines):
        m = LOG_HEADING_RE.match(line)
        if not m:
            continue
        for follow in lines[i + 1:i + 8]:
            s = re.match(r"^\s*-\s+\*\*세션\*\*\s*:\s*(.+)$", follow)
            if s:
                return f"{m.group(1)} — {s.group(1).strip()}"
        return m.group(1)
    return None


def folder_status(repo: Path) -> str:
    def files(d: Path) -> list[Path]:
        if not d.is_dir():
            return []
        return [p for p in d.rglob("*")
                if p.is_file() and not any(x.startswith(".") for x in p.relative_to(d).parts)]
    review, journal = files(repo / "review"), files(repo / "journal")
    text = f"review/ 판정 대기 {len(review)}개"
    if journal:
        days = int((time.time() - min(p.stat().st_mtime for p in journal)) // 86400)
        text += f" · journal/ {len(journal)}개 (가장 오래된 메모 {days}일 전)"
    return text


def digest(repo: Path, bundles: list[Path], git: Git) -> str:
    if not bundles:
        return ""
    out = []
    total = Report()
    for b in bundles:
        report = Report()
        check_bundle(repo, b, git, report)
        total.items += report.items
        fm = split_frontmatter(read_lines(b / "index.md"))[0] if (b / "index.md").is_file() else None
        version = parse_frontmatter(fm)[0].get("okf_version", "?") if fm is not None else "?"
        out.append(f"[OKF 현황] 번들 {rel(b, repo) if b != repo else '.'} (okf_version {version})")
        out.append(f"- 미결: [User Review] {len(report.reviews)} · [TODO] {report.todo} · [Ph] {report.ph} · "
                   f"탐색중 섹션 {report.open_sections} · 가설 {report.hypotheses} · 가정 {report.assumptions}")
        for r, n, text in report.reviews[:4]:
            out.append(f"- [User Review] {r}:{n} {text[:70]}{'…' if len(text) > 70 else ''}")
        if len(report.reviews) > 4:
            out.append(f"- [User Review] 외 {len(report.reviews) - 4}개")
        handoff = latest_handoff(b / "log.md")
        if handoff:
            out.append(f"- 최근 인수인계: {handoff}")
        log = b / "log.md"
        changed = [p for p in git.changed if p.suffix.lower() == ".md" and p != log.resolve() and p.exists()
                   and bundle_member(p, b)]
        if changed and (log.resolve() not in git.changed or not log.exists()
                        or log.stat().st_mtime < max(p.stat().st_mtime for p in changed)):
            out.append("- 주의: 커밋되지 않은 번들 변경이 log.md보다 새롭다 — 지난 세션 인수인계가 빠졌는지 확인한다")
    missing = check_required(repo, bundles, total)
    out.insert(1 if len(bundles) == 1 else 0, f"- {folder_status(repo)}")
    errors, warns = total.count("error"), total.count("warn")
    if errors or warns:
        out.append(f"- 형식 점검: 오류 {errors} · 경고 {warns} — "
                   f"`python {rel(Path(__file__).resolve(), repo)} check`로 상세 확인")
    if missing:
        out.append("- 필수 파일 없음: " + ", ".join(missing))
    text = "\n".join(out)
    return text if len(text) <= DIGEST_LIMIT else text[:DIGEST_LIMIT - 12] + "\n…(이하 생략)"


def bundle_member(path: Path, bundle: Path) -> bool:
    try:
        parts = path.resolve().relative_to(bundle.resolve()).parts
    except ValueError:
        return False
    return not any(skipped(p) for p in parts[:-1])


# ── 훅 ────────────────────────────────────────────────────────────

def project_dir(data: dict) -> Path:
    return find_root(Path(os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()))


def hook_session_start(data: dict) -> int:
    repo = project_dir(data)
    text = digest(repo, find_bundles(repo), Git(repo))
    if text:
        print(text)
    return 0


def hook_post_tool_use(data: dict) -> int:
    tool_input = data.get("tool_input") or {}
    fp = tool_input.get("file_path")
    if not fp or not str(fp).lower().endswith(".md"):
        return 0
    path = Path(fp)
    if not path.is_absolute():
        path = Path(data.get("cwd") or os.getcwd()) / path
    path = path.resolve()
    if not path.is_file():
        return 0
    repo = project_dir(data)
    if repo not in path.parents:
        repo = find_root(path.parent)
    bundle = containing_bundle(path, repo if repo in path.parents else None)
    if bundle is None or not bundle_member(path, bundle):
        return 0
    report = Report()
    check_file(path, bundle, repo, Git(repo), report)
    order = {"error": 0, "warn": 1, "note": 2}
    items = sorted((x for x in report.items if x[0] in order), key=lambda x: (order[x[0]], x[2]))
    if not items:
        return 0
    body = "\n".join(f"- {LABEL[level]}{f' L{n}' if n else ''}: {msg}" for level, _, n, msg in items)
    context = (f"OKF 점검 ({rel(path, repo)}):\n{body}\n"
               "보고 전용 점검이다. 오류와 경고는 규칙대로 고치고, 알림은 판단해서 따른다.")
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": context}},
                     ensure_ascii=False))
    return 0


def hook_stop(data: dict) -> int:
    if data.get("stop_hook_active"):
        return 0
    repo = project_dir(data)
    git = Git(repo)
    if not git.ok:
        return 0
    stale = []
    for b in find_bundles(repo):
        log = (b / "log.md").resolve()
        changed = [p for p in git.changed if p.suffix.lower() == ".md" and p != log and p.exists()
                   and bundle_member(p, b)]
        if not changed:
            continue
        if log.exists() and log in git.changed and log.stat().st_mtime >= max(p.stat().st_mtime for p in changed):
            continue
        stale += [rel(p, repo) for p in changed]
    if not stale:
        return 0
    flags = Path(tempfile.gettempdir())
    for old in flags.glob("okf_check_stop_*"):
        if time.time() - old.stat().st_mtime > 7 * 86400:
            old.unlink(missing_ok=True)
    key = hashlib.sha1(f"{repo}|{data.get('session_id', '')}".encode()).hexdigest()[:16]
    flag = flags / f"okf_check_stop_{key}"
    if flag.exists():
        return 0
    flag.write_text(str(time.time()), encoding="utf-8")
    names = ", ".join(stale[:3]) + (f" 외 {len(stale) - 3}개" if len(stale) > 3 else "")
    print(f"OKF: 번들 파일({names})이 바뀌었는데 log.md 인수인계가 그보다 오래됐다. 이 요청으로 작업을 마쳤다면 "
          "log.md 맨 위 오늘 날짜(## YYYY-MM-DD) 아래에 인수인계(세션·수정 파일·핵심 결정·다음 단계)를 추가하고, "
          "핵심 결정이 바뀌었으면 index.md 결정표도 고친다. 작업이 더 이어지면 마칠 때 그 항목을 갱신한다. "
          "이 알림은 세션당 한 번이다.", file=sys.stderr)
    return 2


# ── 진입점 ────────────────────────────────────────────────────────

def main(argv: list[str]) -> int:
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    if argv[0] == "--version":
        print(VERSION)
        return 0
    command, rest = argv[0], argv[1:]

    if command == "hook":
        event = rest[0] if rest else ""
        handlers = {"session-start": hook_session_start, "post-tool-use": hook_post_tool_use, "stop": hook_stop}
        if event not in handlers:
            print(f"알 수 없는 훅: {event}", file=sys.stderr)
            return 0
        try:
            raw = sys.stdin.buffer.read().decode("utf-8-sig", errors="replace")
            return handlers[event](json.loads(raw) if raw.strip() else {})
        except Exception as exc:  # 훅은 세션을 막지 않는다
            print(f"okf_check 훅 오류: {exc}", file=sys.stderr)
            return 0

    root, bundles, files = None, [], []
    i = 0
    while i < len(rest):
        if rest[i] == "--bundle" and i + 1 < len(rest):
            bundles.append(Path(rest[i + 1]).resolve())
            i += 2
        elif rest[i] == "--root" and i + 1 < len(rest):
            root = Path(rest[i + 1])
            i += 2
        else:
            files.append(Path(rest[i]).resolve())
            i += 1
    repo = find_root(root or Path.cwd())
    bundles = bundles or find_bundles(repo)
    git = Git(repo)

    if command == "digest":
        print(digest(repo, bundles, git) or "OKF 번들을 찾지 못했다 (okf_version이 있는 index.md 없음)")
        return 0
    if command != "check":
        print(__doc__)
        return 0

    report = Report()
    if files:
        for f in files:
            b = containing_bundle(f, repo)
            if b is None:
                report.add("warn", rel(f, repo), 0, "OKF 번들 안의 파일이 아니다")
            else:
                check_file(f, b, repo, git, report)
        header = f"OKF 점검 — 파일 {len(files)}개"
    elif not bundles:
        print("OKF 번들을 찾지 못했다 (okf_version이 있는 index.md 없음)")
        return 0
    else:
        for b in bundles:
            check_bundle(repo, b, git, report)
        check_required(repo, bundles, report)
        names = ", ".join(rel(b, repo) if b != repo else "." for b in bundles)
        header = f"OKF 점검 v{VERSION} — 번들 {names}"
    print(render(report, header))
    return 1 if report.count("error") else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

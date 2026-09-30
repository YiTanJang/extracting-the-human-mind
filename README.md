# Extracting the Human Mind

사람의 **날것(verbatim)·무라벨 심리 데이터**를 오염 없이 추출해 LLM 컨텍스트에 직주입하고, 그것이 실제로 그 사람을 시뮬레이션하는지 검증하는 방법 설계 위키.

이 저장소는 OKF(Open Knowledge Format) 지식 번들로 관리된다. OKF 규칙집(`okf-system/`)은 작업 방식에 관한 메타 문서라 저장소에 올리지 않는다(로컬 전용).

## 시작점

- **지식 번들**: [`extracting-the-human-mind/index.md`](extracting-the-human-mind/index.md) — 핵심 가설·설계 결정·섹션 지도. **여기서 시작하라.**
- **OKF 방법론(규칙)**: `okf-system/`(로컬 전용) — 포맷·번들 설계·에이전트 워크플로우. 기여자가 지킬 부분은 [`CONTRIBUTING.md`](CONTRIBUTING.md)에 요약돼 있다.
- **에이전트 브리핑**: [`AGENTS.md`](AGENTS.md)(정본) · [`CLAUDE.md`](CLAUDE.md)(Claude Code용, `AGENTS.md`와 번들 `index.md`를 불러옴).

## 상태

설계 단계. 원본 기획 문서 34개는 2026-07-16에 OKF 번들로 이관을 마쳤다. 진행 상황은 [`log.md`](extracting-the-human-mind/log.md), 프로젝트를 막고 있는 질문은 [`open_questions.md`](extracting-the-human-mind/research/open_questions.md)에 있다 — 가장 큰 질문은 Q1("구조가 활성 성분인가").

형식 점검: `python .claude/okf/okf_check.py check`

## 파일럿 서비스 (`src/`)

친구 대상 연구 파일럿 웹 서비스 — 설계는 [`architecture/pilot.md`](extracting-the-human-mind/architecture/pilot.md), 배포는 [`deploy/README.md`](deploy/README.md).

로컬 개발:

```bash
# API (FastAPI) — http://localhost:8000/api/docs
cd src/api && python -m venv .venv && .venv/Scripts/pip install -r requirements-dev.txt
.venv/Scripts/python dev.py          # 개발용 관리자 토큰: dev-admin
.venv/Scripts/python -m pytest -q

# 웹 (Next.js) — http://localhost:3000, /api/* 는 로컬 API로 프록시
cd src/web && npm install && npm run dev
```

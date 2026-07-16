# Extracting the Human Mind — 에이전트 브리핑

## 한 줄 요약

사람의 **날것(verbatim)·무라벨 심리 데이터**를 오염 없이 추출해 LLM 컨텍스트에 직주입하고, 그것이 실제로 그 사람을 시뮬레이션하는지 검증하는 방법 설계 위키. 목적은 심리검사 결과 수집이 아니라 **LLM 시뮬레이션**이며, 산출물은 코드가 아니라 방법론·파이프라인·UI 설계다.

## 지식 번들 구조

모든 지식은 [`extracting-the-human-mind/`](extracting-the-human-mind/) 디렉토리(= OKF 지식 번들)에 있다.
**작업 전 반드시 [`extracting-the-human-mind/index.md`](extracting-the-human-mind/index.md)를 먼저 읽는다.**

- 이 번들은 OKF(Open Knowledge Format)로 관리된다. 규칙은 [`okf-system/`](okf-system/)에 있다 — [format.md](okf-system/format.md)(파일 포맷·마커), [bundle_design.md](okf-system/bundle_design.md)(폴더 구조), [agent_workflow.md](okf-system/agent_workflow.md)(워크플로우).
- [`inbox/`](inbox/)에는 **OKF 이전(移前) 원본 문서 ~40개**가 마이그레이션 소스로 들어 있다. `.gitignore` 대상(로컬 전용)이며, git 이력에도 보존돼 있다. 아직 개념 문서로 이관되지 않은 원본을 참조·이관할 때 여기서 읽는다.

## 세션 시작 시 필수 파일 체크

`agent_workflow.md`의 규칙대로 아래가 존재하는지 먼저 확인한다(없으면 즉시 생성):
`CLAUDE.md`, `AGENTS.md`, `extracting-the-human-mind/research/open_questions.md`.

## 에이전트 브랜치 규칙

- 모든 작업은 `task/YYYYMMDD-간략설명` 브랜치에서. 완료 즉시 master 머지 후 브랜치 삭제.
- 장기 에이전트 브랜치 금지. master는 항상 최신.

## 작업 지침

1. **읽기 우선**: 담당 파일의 기존 내용과 `## 미결 사항`을 파악한 뒤 작업.
2. **OKF 형식 준수**: 개념 문서(`index.md`·`log.md` 제외)는 frontmatter(`type`/`title`/`description`/`tags`/`timestamp`) 포함. 파일명은 소문자+언더스코어 영어, 내용은 한국어 무방.
3. **상태 기반 수정(불변 원칙)**: `> 탐색중` 마커가 없는 확정 섹션은 직접 수정 금지. 수정이 필요하면 해당 파일 `## 미결 사항`에 `[User Review]`(어느 부분 / 현재값→교체값 / 이유)를 추가하고 사용자 컨펌 대기.
4. **상태 점검**: `grep -r "\[TODO\]" extracting-the-human-mind/`로 이슈 파악.
5. **에이전트 한계 인정**: `[User Review]`는 혼자 해결하지 말고 사용자에게 질문.
6. **근거 있는 주장만**: 추측은 `> 가설:`, 하중 전제는 `> 가정:` 블록으로 표시.

## 핵심 설계 결정 (변경 시 index.md 업데이트 필요)

- 최적화 목표 = LLM 시뮬레이션. **raw 사후 가공(태그·요약·라벨) 금지** — 타협 불가 제약.
- 추출 배터리 **16종**, 마음의 4사분면(L1 인지·L2 동기·L3 서사·L4 행동)에 매핑.
- 파이프라인 순서 = **추출 → 검증(필수 관문) → 활용**.
- 인지 엔진 = 4+1 다중 에이전트(Id·Superego·Schema·Somatic + 통합 Self 판정자).
- 검증 핵심 = hold-out 예측 타당도, 정규화 정확도 =(모델−바닥)/(천장−바닥).

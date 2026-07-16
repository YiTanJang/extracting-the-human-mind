# 변경 이력

## 2026-07-16 (OKF 마이그레이션 — 전체 이관 완료)

원본 34개 문서를 OKF 개념 문서로 **전부 이관 완료**(스켈레톤 3종 이후 나머지 31종을 병렬 서브에이전트로 변환).

- **이관 규칙**: 본문 verbatim 보존(불변), frontmatter(type/title/description/tags/timestamp) 부착, 옛 위키링크 `[텍스트](<한글.md>)` → 상대경로 OKF 링크, `## 미결 사항` 부착. 파일명 소문자_영어.
- **섹션 구성**: extraction 16, application 3, validation 4, architecture 2, research 2(+open_questions), overview 4, operations 3. 모든 섹션 `index.md` 상태표를 이관 완료로 갱신.
- **검증**: (a) 개념 문서 34종 전부 frontmatter 적합, (b) 한글 파일명 링크 잔존 0, (c) Obsidian 각괄호 링크 `](<…>)` 래퍼 제거, (d) 상대 .md 링크 전수 존재 확인(broken 0), (e) 본문 줄 수 대조 — 전 파일 원본 대비 +10~15줄(frontmatter+미결)로 truncation 없음. `validation_mode.md` 1115→1129.
- **발견된 로컬 미결**: `extraction/triad_elicitation.md` §5-2 Gate 2 STS 임계치 튜닝 `[TODO]` 1건(해당 파일 미결 사항에 보존).
- **후속(미해결)**: 저장소 루트 `okf-system/`은 untracked 상태 — 커밋할지 gitignore할지 사용자 결정 대기. 전체 변경 아직 미커밋.

## 2026-07-16 (OKF 마이그레이션 — 스켈레톤 + 첫 배치)

기존 ~40개 한국어 기획 문서를 OKF 지식 번들로 이관 시작.

- **구조 신설**: `extracting-the-human-mind/` 번들 생성. 7개 섹션(overview·extraction·application·validation·architecture·research·operations) + 각 `index.md`.
- **예약 파일**: `index.md`(핵심 가설·설계 결정 테이블), `log.md`, `research/open_questions.md` 생성.
- **저장소 루트**: `CLAUDE.md`/`AGENTS.md` 신설. 원본 ~40개 문서는 `inbox/`로 이동하고 `.gitignore`에 `inbox/`·`outbox/` 추가(로컬 전용, git 이력 보존).
- **개념 문서 이관 (첫 배치, 3종)**:
  - `extraction/laddering.md` (Playbook) ← `inbox/래더링.md`
  - `architecture/architecture.md` (Design) ← `inbox/아키텍처.md`
  - `research/related_research.md` (Reference) ← `inbox/관련 연구.md`
- **핵심 결정**: 원본 내용은 verbatim 보존(불변). 이관 = frontmatter 부착 + 옛 위키링크를 상대 경로로 교정 + `## 미결 사항` 섹션 부착. 파일명은 소문자+언더스코어 영어로 정규화.
- **다음 단계 (Next Steps)**: `inbox/`에 남은 원본 문서들을 각 섹션으로 이관 — extraction 13종(triad_elicitation, feared_self, defining_life_scenes, contextual_value_allocation, generative_metaphor, judgment_scenarios, self_other, critical_incident, core_conflict, behavioral_traces_esm, automated_tat, day_reconstruction, episodic_future_thinking, attachment_narrative, clean_language), application 3종, validation 4종, architecture의 cognitive_engine, research의 paper_strategy, overview 4종(vision·mvp·roadmap·principles), operations 3종. 각 섹션 `index.md`의 표에 이관 완료분을 반영할 것.

# 변경 이력

## 2026-07-17 (데스크 리서치 편입 [1/3] — Reference 문서 + 미답 질문 재구성)

- **신규**: `research/desk_research_2026-07.md`(Reference) — 2024–26 문헌 데스크 리서치, 적대적 검증 통과 21 클레임 + 기각 4건 + 한계 + 소스 공백. 검증 표(vote) 병기.
- **테제 위협 3대**: ① 무-요약이 법칙 아니라 과업 의존적(BehaviorBench 2606.02798) ② 자율 생성 시 raw가 모델 prior로 붕괴(Habermolt 2605.24413) ③ 정규화 공식 문헌(비율 87.67%) vs 프로젝트(바닥차감 ~55.7%) 혼동 금지(Twin-2K 2505.17479).
- **open_questions**: Q1 재구성(무-요약→모듈별 검증 가설, 3-arm A4), Q2 증강(2604.02460·MAS-ZERO·Confident Liar), **Q6 신설**(활용 elicitation 자율생성 vs 타깃질의 prior-collapse). 상태요약 5→6.
- **[User Review] 마커**: `principles.md`(무-요약 법칙→모듈별 가설 재구성 제안), `cognitive_engine.md`(Habermolt 붕괴 → 타깃 질의 프로토콜 + 예산매칭/역할셔플/역할별 judge 보정).
- **다음**: [2] 소스 공백(Q6전산조작화·Q3한국경제게임·Q8웹RT) 2차 검색 → desk_research §7. [3] validation_mode 개선 제안 마커.

## 2026-07-16 (리뷰 [User Review] 2건 해결 — 사용자 판정)

- **architecture.md 가명화**: "NER 기반 + 결정론적" 모순 → **2계층 설계 확정**(실명 유출 0 지향). 1계층=결정론적 사전·정규식 자동 치환, 2계층=NER 후보 최초 전송 전 사용자 확인. §2 Module 1 본문·frontmatter 리팩토링, `## 결정 사항`에 [해결됨] 기록.
- **laddering.md 중단 신호 "그냥"**: 이중 매핑 → **회피(defensive_exit) 재분류 확정**. `terminal_signals`에서 "그냥" 제거, `should_stop_laddering`에 `defensive_streak`·`defensive_exit` 추가, §5 산출물에 `stop_reason` 필드 신설. `## 결정 사항`에 [해결됨] 기록.
- 두 파일 모두 확정 본문을 사용자 결정에 따라 리팩토링(OKF 결정 기록 규칙 3). 남은 로컬 미결: laddering 반복감지 임베딩 교체 [TODO], architecture XP 임계치 [TODO].

## 2026-07-16 (자유연상 재설계 — 순수·RT예외·격리)

사용자 지시로 `extraction/free_association.md` 재설계(설계 결정 3건 확정, `## 결정 사항`에 기록):

- **자극어 완전 제거**: 표준 WAT식 자극어를 없애고 순수 자유연상으로. 설계자 프레임이 사라져 무오염을 최대화 — 이전 자극어 출처 [User Review]는 이 결정으로 **해소**.
- **RT(반응지연) 예외 수집**: §1-2 전역 원칙(밀리초 측정 기각)에 대한 **명시적 예외**로 켬. 본문에 원칙 위배임을 명시하고, 웹 측정 노이즈 때문에 정밀 지표가 아닌 *보조 신호*(상대 지연·긴 정지 플래그)로만 한정. 전역 기본은 여전히 '제외'.
- **같은 날 타 검사 격리(§3)**: 타 기법의 점화(priming)가 순수 연상을 오염시키므로, 자유연상은 다른 검사와 같은 날 실시 금지(`administered_alone` 감사).
- **동기화**: `extraction/index.md` 후보 표, `index.md` 설계 결정 테이블 RT 행("기각 + 모듈 예외"), `open_questions.md` Q5(자극어 갈등 해소 → 직교성만 잔존)로 갱신.
- **미해결**: architecture·laddering의 [User Review] 2건은 사용자 판단 요청 상태(다음 항목).

## 2026-07-16 (리뷰 마커 + 자유연상 후보 추가)

- **문제 마커(리뷰)**: 이관 중 발견한 실제 결함에 OKF 마커 부착(본문 verbatim 불변, `## 미결 사항`에만 기재).
  - `architecture.md`: [User Review] 가명화 "NER 기반 + 결정론적" 모순(NER은 비결정론적 → PII 유출/verbatim 훼손 위험) · [TODO] `current_xp` 임계치 100 매직 넘버.
  - `extraction/laddering.md`: [User Review] 중단신호 "그냥"이 방어적 회피(프롬프트)와 종착 가치(코드)로 이중 매핑 · [TODO] 반복감지 코드(정확 일치)-주석(임베딩 유사도) 불일치.
- **신규 후보 모듈**: `extraction/free_association.md`(자유연상, 탐색중) 추가. RT는 프로젝트 결정대로 제외, 내용·자기보고로 대체. 자극어 출처(표준/raw파생/중립시드) 미결 → [User Review]. `extraction/index.md`에 '후보(탐색중)' 표로 분리 등재(16종 확정 카운트는 불변).
- **open_questions**: Q4 운영 결정 종결 표기, Q5(자유연상 편입 여부) 신설.
- **다음 단계**: Q5 자극어 출처 결정 후 free_association 진행 가능. architecture·laddering의 [User Review] 2건은 사용자 컨펌 대기.

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

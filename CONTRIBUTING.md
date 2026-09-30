# 기여 가이드 (Contributing)

이 저장소는 **방법론·기획 문서 위키이다.** 코드가 아니라 *아이디어와 설계*에 기여한다. 모든 지식은 [`extracting-the-human-mind/`](extracting-the-human-mind/index.md) 번들에 있다 — 먼저 그 `index.md`를 읽는다.

## 무엇을 환영하나

- **반박·의심** — "이 추출 방법은 LLM이 해석 못 할 것 같다", "이 검증 설계는 looping에 오염된다" 같은 비판. 이 프로젝트는 [검증 모드](extracting-the-human-mind/validation/validation_mode.md)의 정신대로 *틀렸을 가능성*을 환영한다. 가장 열려 있는 질문은 [open_questions.md](extracting-the-human-mind/research/open_questions.md)에 있다.
- **새 추출 기법** — 심리학 이론에 근거한 raw 추출 방법 제안.
- **활용·검증 설계** — 모드 개선, 검증 프로토콜·베이스라인 구성.
- **구현 사례** — 이 방법론으로 무언가를 만들었다면 링크 공유.

## 어떻게

- **가벼운 의견·질문** → [Issue](../../issues).
- **문서 수정·추가** → Fork → 편집 → Pull Request.

## 문서 규칙 (OKF)

번들은 OKF(Open Knowledge Format)로 관리된다. 기여자가 지킬 것:

- **frontmatter**: `index.md`·`log.md`를 뺀 모든 문서 맨 위에 둔다.
  ```yaml
  ---
  type: Playbook        # Vision · Goals · Roadmap · Design · Data Source · Playbook · Reference · Open Questions 중 하나
  title: 문서 제목
  description: 본문을 열지 않고도 현재 상태를 알 수 있는 한두 문장 요약
  tags: [태그1, 태그2]
  timestamp: 2026-09-30T00:00:00Z   # 마지막으로 의미 있게 고친 시각
  ---
  ```
- **파일명**: 소문자+언더스코어 영어(`feared_self.md`). 내용은 한국어.
- **링크**: 상대 경로(`../validation/validation_mode.md`). 맨 앞이 `/`인 절대 경로는 쓰지 않는다.
- **마커**: 확정되지 않은 섹션은 첫 줄에 `> 탐색중`, 검증 전 주장은 `> 가설:` 블록으로 쓴다. 마커 없는 섹션은 확정으로 읽히므로, 확정된 본문을 바꾸자는 제안은 해당 문서 `## 미결 사항`에 적거나 PR 설명에서 이유를 밝힌다.
- **본문은 현재 상태만**: "예전엔 X였다" 같은 편집 이력은 본문에 남기지 않는다. 결정 이력은 `## 결정 사항`에 둔다.
- 새 문서를 만들면 해당 섹션 `index.md` 표에 한 줄을 추가한다.
- 형식 점검: `python .claude/okf/okf_check.py check`

## 문서 본문 구조

### 추출 기법 문서 (`extraction/`)

```markdown
# Methodology: [모듈 이름]

> **예상 소요 시간:** O~O분
>
> **세 줄 요약:**
> - (비전문가를 위한 쉬운 설명)
>
> **설계 핵심:**
> - **이론적 배경:** (이론적 연원이나 핵심 목적)
> - **동작 방식:** (추출 순서)

## 0. 이론적 전제 및 설계 원칙
## 1..N. 단계          # 각 단계: 근거(방법론) → UI 프롬프트 → 동작/산출
## N. 산출물 및 데이터 저장 (Raw Store Append)   # YAML 예시
## N. 알려진 한계 (Limitations)
## 미결 사항
```

### 활용 모드 문서 (`application/`)

```markdown
# 모드명 (English)

> **세 줄 요약:** ...

## 1. 방법론 (Methodology)
## 2. 상호작용 흐름 설계 (Interaction)
## 3. 사용 예시 (Use Cases)
## 4. 규칙 (Behavioral Rules)
## 5. 알려진 한계 (Limitations)
## 미결 사항
```

## 핵심 원칙 (어기지 말 것)

- **raw는 verbatim.** 저장·주입되는 raw는 정규화·요약·라벨링하지 않는다. 측정 메타데이터만 붙인다. (활용 시점에 LLM이 주입된 raw를 스스로 처리하는 것은 허용.)
- **무오염.** 설계자 메뉴·유도 질문 금지. 빈칸으로 받는다.
- **추출/활용 분리.** 해석·점수·분류는 전부 활용 단계(`application/`)에 둔다. raw store엔 해석 필드를 두지 않는다.

## Claude Code 연동 (선택)

이 저장소에 GitHub용 Claude 앱이 연결돼 있다면, Issue나 PR 댓글에서 `@claude`를 멘션해 초안 작성·구현·리뷰를 요청할 수 있다.

## 라이선스

기여물은 저장소의 [MIT License](LICENSE) 하에 배포되는 데 동의하는 것으로 간주한다.

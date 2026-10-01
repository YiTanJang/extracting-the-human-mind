---
okf_version: "0.1"
---

# Extracting the Human Mind

사람의 **날것(verbatim)·무라벨 심리 데이터**를 오염 없이 추출해 LLM 컨텍스트에 직주입하고, 그것이 실제로 그 사람을 시뮬레이션하는지 검증하는 방법 설계 위키. 목적은 심리검사 결과 수집이 아니라 **LLM 시뮬레이션**이다.

**현재 단계**: Phase 0 — 파일럿 서비스 구축 중([architecture/pilot.md](architecture/pilot.md), S0 배포·S1·S2 완료, S3 다음). Phase 0 Showstopper는 [Q1](research/open_questions.md) "구조가 활성 성분인가"(검증 모드 A4 3-arm으로 판정) — 파일럿이 이 실험을 겸한다.

## 섹션

| 섹션 | 내용 |
|------|------|
| [overview/](overview/index.md) | 비전, 설계 원칙(추출 목표·6조건·추출 위생), MVP, 로드맵 |
| [extraction/](extraction/index.md) | 추출 배터리 16종 + 후보 1종(자유연상) |
| [application/](application/index.md) | 활용 모드 — 분석·상담·멀티에이전트 시뮬레이션 |
| [validation/](validation/index.md) | 검증 모드(배터리 A/B/C·실험 레지스트리) 및 이해·시뮬레이션·신뢰도 검증 |
| [architecture/](architecture/index.md) | 앱 아키텍처, 인지 엔진 |
| [research/](research/index.md) | 관련 연구, 데스크 리서치, 논문 전략, 전역 미답 질문 |
| [operations/](operations/index.md) | 수동 실험 가이드, 실험 주의서(윤리), UI/UX 가이드라인 |

## 핵심 가설

> 가설: 구조화된 배터리로 뽑은 **무라벨 verbatim**이, *분량을 맞춘 자유 자기개방*보다 개인의 실제 선택을 더 잘 예측한다(주장 A — "구조가 활성 성분"). 이것이 참이라야 본 시스템이 "더 많이 캐는 자기보고 도구"가 아니라 "구조적 추출 방법론"이 된다. 판정은 [validation/](validation/index.md) 검증 모드 A4(증분 타당도)에서 이뤄진다.

> 가정: 저장·주입되는 raw는 파이프라인·설계자가 사후 가공하지 않는다(활용 시점에 LLM이 주입된 raw를 스스로 처리·요약하는 것은 허용). (깨지면 → 데이터 진부화·설계자 편향 주입으로 전 시스템의 핵심 명제가 무너짐)

## 핵심 설계 결정

| 항목 | 결정 | 상태 |
|------|------|------|
| 최적화 목표 | LLM 시뮬레이션(검사 수집 아님). 저장·주입 raw의 사후 가공(태그·요약·라벨) 금지 — 활용 시점 LLM의 런타임 처리·요약은 허용 | 확정 |
| 추출 배터리 | 16종, 마음의 4사분면(L1 인지·L2 동기·L3 서사·L4 행동)에 매핑 | 확정 |
| 이론 백본 | 마음의 4사분면 = McAdams 3층위 재구성(Kelly·Schwartz/McClelland·Mischel/Luborsky·McAdams) | 확정 |
| 가치 수집 | 개방형 자기기입 (Schwartz 고정메뉴 폐기 — idiographic) | 확정 |
| 파이프라인 순서 | 추출 → 검증(필수 관문) → 활용 | 확정 |
| 인지 엔진 | 4+1 다중 에이전트(Id·Superego·Schema·Somatic + 통합 Self 판정자). IFS·System1/2는 영감. 활용 elicitation = 하이브리드(타깃 질의 기본, 자율 생성은 특정 모드만) | 확정 |
| 검증 핵심 지표 | hold-out 예측 타당도, 정규화 정확도=(모델−바닥)/(천장−바닥) — 단순 비율 아님 | 확정 |
| 활성 성분 주장 | A(구조 고립 — A4 3-arm: 분량매칭 자유서술 / +일반 심화 프롬프트 / 구조화 배터리) / B(실용 우위 — soul.md) 분리. 분량 매칭 = 자유서술 분량에 맞춘 배터리 모듈 무작위 부분집합(여러 번 평균) | 확정 |
| 파일럿 서비스 | 16종 전 모듈(LLM 동적 모듈 포함) + Q1 3-arm 실험, Q1 패키지 완성 뒤에만 초대, Next.js+FastAPI(코드는 비공개 저장소 `YiTanJang/ethm-pilot`), 홈랩 k3s + Cloudflare Tunnel, LLM = Claude API, UI 명세가 방법 절과 어긋나면 방법 절 기준 | 확정 (2026-09-30) |
| 반응속도(ms) 측정 | 전역 기본 기각(웹 환경 제약). 단 자유연상 모듈은 명시적 예외로 수집(원칙 위배 명시·보조 신호 한정) | 기각 + 모듈 예외 |

## 핵심 원칙 (판단 기준)
> 탐색중

[overview/principles.md](overview/principles.md)에서 옮긴, 세션마다 판단에 쓰는 기준.

- **raw를 고치지 말고 방법을 고친다.** raw가 LLM에게 유효하지 않으면 원시 데이터를 다듬지 않고 추출 방법 자체를 수정하거나 버린다(§1-0).
- **폐기는 모델 한계와 방법 한계를 가른 뒤에.** 현재 모델에서 무용해 보여도 즉시 버리지 않고, 검증 모드의 예측 기여도로 판정한다(§1-0).
- **꼬리질문 대신 UI 스캐폴딩.** 짧거나 모호한 답에도 캐묻지 않는다. 시스템 개입은 래더링·클린 랭귀지에 한정된다(§1-0 조건 1·2).
- **선택지를 주지 않고, 서사 폼을 쪼개지 않는다.** 고정 메뉴는 사용자의 고유 언어를 훼손하고, 무엇을 길게 쓰고 무엇을 빼는지가 데이터다(CIT·CCRT 같은 구조화 면접은 예외)(§1-0 조건 3·5).
- **청결은 신뢰가 아니라 구조로 강제한다.** LLM이 루프에 있는 동적 모듈은 상수 템플릿·기계 검증·로그로 사후 측정한다(§1-2).
- **가공물은 가설, 원본은 불변.** 분석 결과는 언제든 재생성할 수 있는 산출물이다(§2-0).

## 어디서부터 읽나

- **앱 구조가 궁금하면**: [architecture/architecture.md](architecture/architecture.md) → [overview/mvp.md](overview/mvp.md)
- **방법론이 궁금하면**: [extraction/index.md](extraction/index.md)의 16종 카탈로그
- **이 방법이 되는지 의심되면**: [validation/index.md](validation/index.md)

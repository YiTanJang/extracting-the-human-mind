---
okf_version: "0.1"
---

# Extracting the Human Mind

사람의 **날것(verbatim)·무라벨 심리 데이터**를 오염 없이 추출해 LLM 컨텍스트에 직주입하고, 그것이 실제로 그 사람을 시뮬레이션하는지 검증하는 방법 설계 위키. 목적은 심리검사 결과 수집이 아니라 **LLM 시뮬레이션**이다.

> **마이그레이션 완료(2026-07-16)**: [`../inbox/`](../inbox/)의 원본 34개 문서를 OKF 개념 문서로 전부 이관했다(frontmatter·상대경로 링크·`## 미결 사항` 부착, 본문 verbatim 보존, 링크 무결성·본문 줄 수 검증 완료). 원본은 `inbox/`(gitignore, git 이력 보존)에 남아 있다. 이력은 [log.md](log.md) 참조.

## 섹션

| 섹션 | 내용 |
|------|------|
| [overview/](overview/index.md) | 비전·동기, 목표, MVP, 로드맵 |
| [extraction/](extraction/index.md) | 추출 배터리 16종 + 추출 원칙·위생 |
| [application/](application/index.md) | 활용 모드 — 분석·상담·멀티에이전트 시뮬레이션 |
| [validation/](validation/index.md) | 검증 모드 및 신뢰도·이해·시뮬레이션 검증 |
| [architecture/](architecture/index.md) | 앱 아키텍처, 인지 엔진 |
| [research/](research/index.md) | 관련 연구, 논문 전략, 전역 미답 질문 |
| [operations/](operations/index.md) | 수동 실험 가이드, 실험 주의서(윤리), UI/UX 가이드라인 |

## 핵심 가설

> 가설: 구조화된 배터리로 뽑은 **무라벨 verbatim**이, *분량을 맞춘 자유 자기개방*보다 개인의 실제 선택을 더 잘 예측한다(주장 A — "구조가 활성 성분"). 이것이 참이라야 본 시스템이 "더 많이 캐는 자기보고 도구"가 아니라 "구조적 추출 방법론"이 된다. 판정은 [validation/](validation/index.md) 검증 모드 A4(증분 타당도)에서 이뤄진다.

> 가정: 활용 단계에서 raw는 결코 사후 가공되지 않는다. (깨지면 → 데이터 진부화·설계자 편향 주입으로 전 시스템의 핵심 명제가 무너짐)

## 핵심 설계 결정

| 항목 | 결정 | 상태 |
|------|------|------|
| 최적화 목표 | LLM 시뮬레이션(검사 수집 아님). raw 사후 가공(태그·요약·라벨) 금지 | 확정 |
| 추출 배터리 | 16종, 마음의 4사분면(L1 인지·L2 동기·L3 서사·L4 행동)에 매핑 | 확정 |
| 이론 백본 | 마음의 4사분면 = McAdams 3층위 재구성(Kelly·Schwartz/McClelland·Mischel/Luborsky·McAdams) | 확정 |
| 가치 수집 | 개방형 자기기입 (Schwartz 고정메뉴 폐기 — idiographic) | 확정 |
| 파이프라인 순서 | 추출 → 검증(필수 관문) → 활용 | 확정 |
| 인지 엔진 | 4+1 다중 에이전트(Id·Superego·Schema·Somatic + 통합 Self 판정자). IFS·System1/2는 영감 | 확정 |
| 검증 핵심 지표 | hold-out 예측 타당도, 정규화 정확도=(모델−바닥)/(천장−바닥) | 확정 |
| 활성 성분 주장 | A(구조 고립 — 분량매칭 베이스라인) / B(실용 우위 — soul.md) 분리 | 확정 |
| 반응속도(ms) 측정 | 전역 기본 기각(웹 환경 제약). 단 자유연상 모듈은 명시적 예외로 수집(원칙 위배 명시·보조 신호 한정) | 기각 + 모듈 예외 |

## 어디서부터 읽나

- **앱 구조가 궁금하면**: [architecture/architecture.md](architecture/architecture.md) → [overview/mvp.md](overview/mvp.md)
- **방법론이 궁금하면**: [extraction/index.md](extraction/index.md)의 16종 카탈로그
- **이 방법이 되는지 의심되면**: [validation/index.md](validation/index.md)

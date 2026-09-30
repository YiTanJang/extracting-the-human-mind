# validation — 검증

추출된 데이터가 대상을 실제로 모사하는지 hold-out 예측으로 검증하는 메타 기능. 활용 진입 전 반드시 통과해야 하는 관문. 핵심 지표 = 정규화 정확도 =(모델−바닥)/(천장−바닥).

| 문서 | 내용 |
|------|------|
| [validation_mode.md](validation_mode.md) | 검증 모드 전체 — 성공 기준선(바닥·천장), 배터리 A/B/C 개요, ablation, 3중 채점, 실험 엔진·실험 레지스트리(60개) |
| [comprehension_validation.md](comprehension_validation.md) | 이해 검증 — 배터리 A1–A7(블라인드 점예측·라인업 식별·수렴·증분·스왑·문체 지문·편향 동조) |
| [simulation_validation.md](simulation_validation.md) | 시뮬레이션 검증 — 배터리 B1–B7(과거 재현·역튜링·궤적 일관성·반사실·경제 게임·적대적 스트레스·시간적 붕괴) |
| [reliability_validation.md](reliability_validation.md) | 신뢰도 검증 — 배터리 C1–C5(재검사·캘리브레이션·교차삼각·과잉 일관성·프롬프트 교란) |

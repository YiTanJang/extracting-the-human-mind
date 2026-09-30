"""Participant-facing consent content.

Source: extracting-the-human-mind/operations/experiment_ethics.md (참가 동의 문구, 제공자별 사용 동의).
CONSENT_VERSION is derived from the text, so any wording change forces re-consent.
"""

import hashlib
import json

ETHICS_DOC_URL = (
    "https://github.com/YiTanJang/extracting-the-human-mind/blob/main/"
    "extracting-the-human-mind/operations/experiment_ethics.md"
)

CONSENT_TEXT = (
    "이 실험은 재미와 탐색을 위한 것이며, 결과는 실제 사실이나 판정이 아니라 입력된 데이터 기준의 가설적 해석임을 이해한다. "
    "결과를 근거로 다른 사람을 규정, 비난, 설득, 압박하지 않으며, 참여자 외 제3자의 정보를 끌어오지 않겠다. "
    "내 데이터의 사용 범위는 용도별 토글(분석·시뮬레이션·검증·연구 수확)로 내가 정하고 언제든 되돌릴 수 있으며, "
    "검증 단계에서 내 응답이 익명 미끼로 쓰이거나 내가 판정자로 요청받을 수 있음을 이해한다. "
    "'검증 허용' 토글을 켠 경우, 내 응답이 연령대·성별·문화권 등 인구통계 집단 비교 연구(D 카테고리)에 익명 집계 통계 형태로 "
    "사용될 수 있으며, k-익명성(k≥3) 규칙과 연결 키 삭제 절차로 개인 식별이 불가능하게 처리됨을 이해한다. "
    "불편함이 생기면 언제든 중단을 요청할 수 있음에 동의한다."
)

RISKS = [
    ("관계 추론", "시스템이 만드는 관계 해석은 그럴듯해도 틀릴 수 있고, 틀린 해석이 실제 관계에 영향을 줄 수 있다."),
    ("다자 프라이버시", "내 경험을 적어도 그 안에 다른 사람의 말·행동이 섞인다. 소규모 집단에서는 익명화해도 누가 누구인지 유추되기 쉽다."),
    ("과신", "매끄러운 문장은 실제보다 정확해 보인다. 결과를 'AI가 판단한 사실'로 받아들이지 않는다."),
    ("캡처·공유", "한 번 생성된 결과는 캡처·전달로 통제 불가능하게 퍼질 수 있다."),
    ("감정 자극", "결과나 질문이 예상보다 불편하거나 상처가 될 수 있다."),
]

HOUSE_RULES = [
    "사람보다 결과를 더 믿지 않기.",
    "싸울 때 이 결과 꺼내지 않기.",
    "캡처해서 밖으로 안 가져가기.",
    "불편하면 바로 중단하기.",
    "재미로 시작했으면 재미 선에서 끝내기.",
]

# Pilot-specific facts about where data lives and who sees it (architecture/pilot.md).
PILOT_DATA_NOTICE = [
    "응답은 연구자의 개인 서버(한국)에 저장되며, 연구자 1인만 열람한다.",
    "응답은 적힌 그대로 저장되고, 요약·해석·라벨을 붙여 고쳐 저장하지 않는다.",
    "일부 과제(래더링·클린 랭귀지)는 다음 질문을 고르기 위해, 이름 등을 가린 응답을 Anthropic의 Claude API로 보낸다.",
    "'내 데이터' 화면에서 언제든 전체 내보내기와 영구 삭제를 할 수 있다. 삭제하면 복구할 수 없다.",
    "만 16세 미만은 참여할 수 없다.",
]

PURPOSES: dict[str, dict[str, str]] = {
    "analysis": {
        "label": "분석 허용",
        "description": "내 응답으로 분석 결과(가설적 해석)를 만드는 데 쓴다.",
    },
    "simulation": {
        "label": "시뮬레이션 허용",
        "description": (
            "내 응답으로 나를 흉내 내는 에이전트를 만든다. 그 에이전트는 내가 하지 않은 말·행동을 생성할 수 있으므로 "
            "가장 신중하게 결정한다."
        ),
    },
    "validation": {
        "label": "검증 허용",
        "description": (
            "이 방법이 사람을 실제로 예측하는지 재는 데 쓴다. 가명 처리된 응답이 Anthropic의 Claude API에 입력되어 내 답을 예측하고, "
            "라인업 검증에서 다른 참가자의 익명 미끼로 쓰일 수 있다."
        ),
    },
    "research_harvest": {
        "label": "연구 수확 허용",
        "description": (
            "활용 모드에서 만들어진 데이터를 방법론 연구 자산으로 쓴다. 익명화·비식별 처리 후 집계 단위로만 분석한다."
        ),
    },
}

# Verified 2026-09-30: Korea unified its suicide-prevention and mental-health crisis lines into 109 (2024-01-01).
CRISIS_LINES = [
    ("자살예방 상담전화", "109", "24시간, 무료"),
    ("긴급 상황", "112 / 119", "생명이 위급할 때"),
]


def _version() -> str:
    blob = json.dumps(
        {"text": CONSENT_TEXT, "purposes": PURPOSES, "notice": PILOT_DATA_NOTICE}, ensure_ascii=False, sort_keys=True
    )
    return hashlib.sha256(blob.encode()).hexdigest()[:12]


CONSENT_VERSION = _version()


def consent_payload() -> dict:
    return {
        "version": CONSENT_VERSION,
        "text": CONSENT_TEXT,
        "risks": [{"title": t, "body": b} for t, b in RISKS],
        "house_rules": HOUSE_RULES,
        "data_notice": PILOT_DATA_NOTICE,
        "purposes": [{"key": k, **v} for k, v in PURPOSES.items()],
        "crisis_lines": [{"name": n, "number": num, "note": note} for n, num, note in CRISIS_LINES],
        "full_document_url": ETHICS_DOC_URL,
    }

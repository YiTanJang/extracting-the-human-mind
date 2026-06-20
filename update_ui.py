import os

updates = {
    "대표 인생 장면.md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Timeline Builder (수직/수평 타임라인)`
- **상호작용 (Interaction):** 
  - 사용자가 '새로운 장면 추가' 버튼을 눌러 카드(Card)를 생성합니다.
  - 생성된 카드들을 드래그 앤 드롭(Drag & Drop)하여 시간순으로 자유롭게 재배치할 수 있습니다.
- **입력 폼:** 각 카드 내부는 제목(Single-line)과 상세 묘사(Multi-line Textarea)로 구성됩니다.

""",
    "두려운 자기와 조기 경보.md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Progressive Wizard (단계별 마법사)`
- **상호작용 (Interaction):**
  - 인지 부하를 줄이기 위해 한 화면에 하나의 질문만 표시하고, '다음' 버튼을 통해 전환합니다.
- **입력 폼:** 구체적 사건 작성은 Multi-line Textarea를 사용하며, 조기 경보의 심각도나 현실 검증(Reality Check) 문항은 1~5점 리커트 스케일(Likert Scale) 슬라이더 또는 필(Pill) 버튼 그룹을 제공합니다.

""",
    "래더링.md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Dynamic Chat / Vertical Step-ladder (동적 채팅 및 사슬 구조 UI)`
- **상호작용 (Interaction):**
  - 일반적인 폼 형식이 아닌, 메신저 형태의 인터페이스를 차용합니다. 
  - 사용자가 답을 입력하면, 해당 답변이 하나의 '블록'으로 고정되어 화면 상단으로 쌓이고(Stacking), LLM 퍼실리테이터가 "왜 그게 중요해요?"라는 꼬리질문 말풍선을 그 아래에 띄웁니다.
- **입력 폼:** 타이핑 시 자동 확장되는(Auto-expanding) Text Input을 사용합니다.

""",
    "맥락 속 가치 할당.md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Zero-sum Budget Slider (총합 제한 슬라이더)`
- **상호작용 (Interaction):**
  - 사용자에게 총 100점(혹은 10개의 코인)의 예산이 주어집니다.
  - 5~6개의 가치 항목(칩) 각각에 슬라이더나 '+/-' 스테퍼(Stepper) 버튼이 배치됩니다.
  - 하단에 '남은 포인트: X점' 게이지 바가 고정되며, 총합이 정확히 100이 되어야만 '다음' 버튼이 활성화됩니다.

""",
    "삼항 도출.md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Drag-and-Drop Triad Sorter & Grid Row`
- **상호작용 (Interaction):**
  1. **분류:** 화면 상단에 3개의 원소 카드가 제시됩니다. 하단에는 '비슷한 2개', '다른 1개'라는 두 개의 드롭 존(Drop Zone)이 있습니다. 사용자는 카드를 드래그하여 두 바구니로 분류합니다. (모바일의 경우 탭(Tap)하여 1개를 선택하는 방식 지원)
  2. **명명:** 분류 완료 즉시 두 바구니 아래에 Text Input이 나타나 양극/음극의 이유(Construct)를 적습니다.
  3. **평정(Rating Sweep):** 새롭게 명명된 양극 축을 기준으로, 모든 원소들을 1~7점 사이로 드래그하여 배치하는 수평 스케일(Horizontal Scale) UI가 등장합니다.

""",
    "생성 은유와 문장 완성.md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Fill-in-the-blank (Mad Libs 형태의 인라인 폼)`
- **상호작용 (Interaction):**
  - 딱딱한 질문-답변 박스가 아닌, 문장 중간에 밑줄(`________`) 쳐진 텍스트 필드가 삽입된 형태입니다.
  - 예: "내 인생은 마치 `[텍스트 입력 필드]` 와/과 같다. 왜냐하면..."
  - 모바일 키보드가 올라올 때 포커스가 문장 흐름을 가리지 않도록 자동 스크롤(Auto-scroll)을 지원합니다.

""",
    "자기 보고식 사건 분석 (CIT).md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Vertical Accordion (수직 아코디언)`
- **상호작용 (Interaction):**
  - 상황 → 행동 → 결과의 3단계가 순차적으로 열립니다.
  - '행동'을 작성할 때 '상황' 탭은 최소화(Collapse)되지만, 작성한 요약 텍스트는 헤더에 계속 노출되어 맥락을 유지합니다.

""",
    "자기–타자.md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Split-screen Comparison / Dual Sliders`
- **상호작용 (Interaction):**
  - 1단계에서 자신에 대한 평가/묘사를 작성합니다.
  - 2단계로 넘어가면 화면 레이아웃이 좌우(혹은 상하) 대비 구조로 나뉘며, 타인의 시선을 기입하게 됩니다. 두 응답 간의 시각적 갭(Gap)을 강조하는 UI를 사용합니다.

""",
    "판단 스타일 시나리오.md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Scenario Card with Delayed Closure (지연된 의사결정 카드)`
- **상호작용 (Interaction):**
  - 시나리오 지문이 깔끔한 카드 뷰로 렌더링됩니다.
  - 초기에는 텍스트 입력창이 숨겨져 있으며, 사용자가 A/B 선택지 중 하나를 탭(Tap)하는 순간 부드러운 애니메이션과 함께 "왜 그렇게 선택했나요?"를 묻는 텍스트 에어리어가 하단에 펼쳐집니다.

""",
    "핵심 갈등 도식 (CCRT).md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Episode Card Deck (에피소드 덱)`
- **상호작용 (Interaction):**
  - 단일 에피소드(바람 → 타인의 반응 → 나의 반응) 작성을 완료하면, 해당 에피소드가 한 장의 요약 카드로 접혀 상단에 쌓입니다.
  - "+ 새로운 관계 에피소드 추가" 버튼이 하단에 항시 유지되며, 최소 3장의 카드가 모여야 '검사 완료' 버튼이 활성화됩니다.

""",
    "행동 흔적 + 미니 ESM.md": """## 🖥️ [UI 렌더링 명세] (Frontend Component)
- **UI 컴포넌트:** `Push Notification & Quick Action Sheet`
- **상호작용 (Interaction):**
  - 앱 내의 정식 검사 페이지가 아닌, 스마트폰 푸시 알림이나 OS 위젯을 통해 진입합니다.
  - 진입 시 전체 화면이 아닌 바텀 시트(Bottom Sheet)로 절반만 올라오며, 타이핑 마찰을 없애기 위해 텍스트 입력보다는 이모지 탭(Tap)이나 버튼(Pill) 선택 위주의 UI를 제공합니다.

"""
}

for filename, content in updates.items():
    filepath = os.path.join(r"d:\Documents\UX Lab\심리 검사", filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Find the footer "🔗 상위 맥락" or similar
        insert_idx = len(lines)
        for i, line in enumerate(lines):
            if "🔗 상위 맥락" in line:
                insert_idx = max(0, i - 1)
                # if the previous line is '---', insert before '---'
                while insert_idx > 0 and lines[insert_idx - 1].strip() == '---':
                    insert_idx -= 1
                break
        
        lines.insert(insert_idx, "\n---\n\n" + content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"Updated {filename}")
    else:
        print(f"File not found: {filename}")

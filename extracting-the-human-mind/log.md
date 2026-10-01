# 변경 이력

## 2026-10-01

- **세션**: 스프린트 S4 — ESM 14일 + DRM, Web Push
- **수정 파일**: `architecture/pilot.md`(「S4 파일럿 기본값」 표 신설, 참가 흐름, 진행), `extraction/behavioral_traces_esm.md`·`extraction/day_reconstruction.md`(파일럿 기본값 [User Review]), `index.md`(현재 단계). 코드(`ethm-pilot`): `api/app/esm.py`(일정·문항·발송), `routers/esm.py`, 테이블 4개(`esm_settings`·`esm_settings_log`·`push_subscriptions`·`esm_pings`), 1분 주기 루프(API 수명 주기), ESM 단계 완료 규칙(창 종료), 내보내기에 발송·응답 기록, `app/vapid.py`(키 생성), 동의 안내 한 줄(알림), 웹 `Esm.tsx`·manifest·service worker·아이콘, 배포 매니페스트·README(VAPID 키).
- **핵심 결정**: 없음(사용자 확정 없음). 제안: ESM은 배터리 뒤 14일 고정 창으로 arm (iii)에 포함, 알림은 질문 없는 일반 문구, 슬롯 문항은 문서 문구만, DRM은 8·14일째 두 번 ESM과 같은 척도로.
- **검증**: API 테스트 32개(시계 고정: 창 시작·슬롯 시각·만료·중복 방지·빈도 0·끊긴 구독 삭제·DRM 날짜·창 종료 후 완료) 통과, 웹 lint·build 통과. 로컬 브라우저로 설정 → 슬롯 응답(이름 가림) → 직접 기록 확인, manifest·service worker 응답 확인.
- **다음 단계**: 사용자 — `pilot-secrets`에 VAPID 키 추가 후 배포(서비스 저장소 `deploy/README.md` 'S4로 올릴 때'), 휴대폰(아이폰은 홈 화면 앱)으로 알림 시험, 「S4 파일럿 기본값」 확정(특히 ESM의 arm (iii) 포함과 행동 문항). 개발 — S5(프로브 세트·일정 게이트·재검사·자유연상·라인업 동의 → 런칭 게이트).

- **세션**: 스프린트 S3 — 2계층 가명화, Claude API, 래더링, 클린 랭귀지
- **수정 파일**: `architecture/pilot.md`(「S3 파일럿 기본값」 표 신설, 배터리 순서, 진행, 가명화 [TODO] → [해결됨], 런칭 전 [TODO] 2건), `extraction/laddering.md`·`extraction/clean_language.md`·`architecture/architecture.md`(파일럿 기본값 [User Review]), `index.md`(현재 단계). 코드(`ethm-pilot`): `api/app/pseudonym.py`·`routers/pseudonyms.py`(가명화·후보 확인), `api/app/llm.py`(Claude 게이트웨이), `api/app/dynamic/`(래더링 타깃 수학·인터뷰 엔진 2개), `routers/dynamic.py`, 저장·읽기·내보내기 가명화, 테이블 3개(`pseudonyms`·`llm_calls`·`dynamic_sessions`), 동의 안내 한 줄(동의 버전 변경), 웹 이름 확인 화면·인터뷰 화면, 인생 장면 래더링 앵커, 배포 매니페스트·README(키 2개).
- **핵심 결정**: 없음(사용자 확정 없음). 제안: Claude는 질문을 쓰지 않고 고정 템플릿과 참가자 원문 슬롯만 고름(슬롯 기계 검증·전 시도 기록), 2계층 가명화의 탐지는 로컬 규칙 + 참가자 확인, 가명화 키가 없으면 사이트는 열고 저장만 막음(구 매니페스트가 새 이미지를 받아도 다운되지 않게).
- **검증**: API 테스트 25개 통과, 웹 lint·build 통과. 로컬 브라우저로 가명화 확인 화면(이름 후보 → 가림 → 저장본 `[Person_A]`·본인 화면 원문), 클린 랭귀지·래더링(대역 모델)을 끝까지 진행, Claude 요청에 토큰만 담기는 것과 인생 장면 앵커 2개를 확인.
- **다음 단계**: 사용자 — `pilot-secrets`에 `pseudonym-key`·`anthropic-api-key` 추가 후 배포(서비스 저장소 `deploy/README.md` 'S3로 올릴 때'), 실제 Claude로 래더링·클린 랭귀지 한 번씩 시험, 「S3 파일럿 기본값」 확정. 개발 — S4(ESM PWA·DRM).

- **세션**: S2 마무리 — 삼항 정지 규칙 결정, 두 저장소 push
- **수정 파일**: `extraction/triad_elicitation.md`(실시간 게이트 [User Review] → [해결됨]), `architecture/pilot.md`(사용자 결정 표에 '삼항 포화 판정' 행, 기본값 표 삼항 행 정리).
- **핵심 결정**(사용자): 삼항은 실시간 포화 게이트 없이 유효 축 12개(또는 24라운드)에서 종료, 게이트는 사후 계산. 클러스터는 비공개 저장소·비공개 이미지로 이전 완료(사용자). 이미지 태그 고정(토큰 만료 대비)은 하지 않음 — 토큰 만료 시 `ghcr-pull` 재생성 절차는 서비스 저장소 `deploy/README.md`.
- **다음 단계**: S3(2계층 가명화, Claude API, 래더링, 클린 랭귀지).

- **세션**: 스프린트 S2 — TAT·자기–타자·삼항·인생 장면
- **수정 파일**: `architecture/pilot.md`(기본값 표를 「S1·S2 파일럿 기본값」으로, S2 행 4개·배터리 순서, 스프린트 진행, 자유연상 S5로, TAT [TODO] → [해결됨]), `extraction/automated_tat.md`(§5 단일 서술창 + [해결됨], 기본값 [User Review]), `extraction/defining_life_scenes.md`(단일 박스 `raw_narrative` [해결됨] → §0·§1-3·§4·§5·§6 본문 정리, 기본값 [User Review]), `extraction/self_other.md`(우회 프롬프트를 제출 전 힌트로, §6 갭 강조·슬라이더 제거 — 모듈 구현 기준 적용, 기본값 [User Review]), `extraction/triad_elicitation.md`([User Review] 2건: 실시간 게이트·기본값), 모듈 문서 8개(기본값 표 이름), `index.md`(현재 단계). 코드(`ethm-pilot`): 엔진 확장(앞 모듈 답 읽기·정지 규칙·지연 패스·고르기·다중 선택·다중 평정·순서 정렬), 모듈 4개, 배터리 순서, 순서 의존성 테스트.
- **핵심 결정**(사용자): TAT는 장면마다 단일 서술창, 표준 발문 4개는 안내로만. 기존 '모듈 구현 기준' 적용: 인생 장면 단일 박스(`raw_narrative`), 자기–타자 우회 프롬프트는 제출 전 힌트·갭 슬라이더 없음. 제안: 자유연상(후보)은 같은 날 격리 규칙 때문에 일정 게이트가 생기는 S5로.
- **검증**: API 테스트 13개 통과, 웹 lint·build 통과. 로컬 브라우저로 TAT 6장면, 자기–타자(가치 할당 1위·조사), 삼항(원소 입력·중복 차단·패스 15초 지연·12축에서 정지), 인생 장면(링킹·기원 건너뛰기·타임라인)을 끝까지 진행해 저장 형식 확인.
- **다음 단계**: 사용자 — 삼항 실시간 게이트 결정([triad_elicitation](extraction/triad_elicitation.md) 미결), 「S1·S2 파일럿 기본값」 표 확정(런칭 전), 클러스터를 새 저장소로 이전. 개발 — S3(2계층 가명화, Claude API, 래더링, 클린 랭귀지; 인생 장면에 래더링 앵커 추가).

- **세션**: 서비스 코드를 비공개 저장소로 분리
- **수정 파일**: `src/`·`deploy/`·`.github/`·`docker-compose.yml`·`.env.example`·`.claude/launch.json` 삭제(→ `YiTanJang/ethm-pilot`), `.gitignore`·`README.md`·`AGENTS.md`(서비스 코드 위치·기록 규칙), `architecture/pilot.md`(결정표 '코드 저장소' 행·저장소 구조·이미지), `index.md`(파일럿 행).
- **핵심 결정**(사용자 위임): 서비스 코드·배포 설정은 비공개 저장소 `YiTanJang/ethm-pilot`(로컬 `../ethm-pilot`, `src/api`→`api`, `src/web`→`web`), 이미지는 비공개 GHCR `ghcr.io/yitanjang/ethm-pilot/{api,web}` + 클러스터 `ghcr-pull` 시크릿. 설계 정본과 공백·기본값 기록은 계속 이 번들. 기존 `src/` 이력은 이 저장소 git 히스토리에 남김(비밀값 없음, 공개 이력 재작성은 하지 않음).
- **다음 단계**: 사용자 — GHCR 읽기 토큰으로 `ghcr-pull` 시크릿 만들고 새 저장소에서 `kubectl apply -k deploy/k8s`, 예전 공개 패키지 `ethm-pilot-api`·`ethm-pilot-web` 삭제. 개발 — S2(서비스 저장소).

- **세션**: S1 결정 2건 반영 + 의존성 정리
- **수정 파일**: `architecture/pilot.md`(사용자 결정 표 2행·결정 사항 2건, 기본값 표 정리), `validation/validation_mode.md`(B-08 매칭 방향 본문 + 결정 사항), `extraction/`의 generative_metaphor·contextual_value_allocation·feared_self(파일럿 도메인 [해결됨], 남은 기본값 [User Review] 축소), `index.md`(활성 성분 행에 매칭 방법). 코드: `src/web/lib/modules/battery_a.ts`(`PILOT_DOMAIN`), `src/web/package.json`(@types/node ^24), `.github/dependabot.yml`(npm 메이저 제외), `.github/workflows/pilot-images.yml`(CI Python 3.14 — 이미지와 일치).
- **핵심 결정**(사용자): 도메인 결합 모듈은 모듈마다 한 도메인 순환(은유=자기·가치 할당=일·두려운 자기=관계). B-08은 자유서술 분량에 맞춘 배터리 모듈 무작위 부분집합(여러 번 평균)과 비교. Dependabot PR 정리 — #5(pytest 보안 수정)·#4·#6·#9·#3 머지, #7·#8·#10 닫음.
- **검증**: 업그레이드된 FastAPI 0.141·SQLAlchemy 2.1·Uvicorn 0.54로 API 테스트 12개 통과, 로컬 브라우저로 10개 과제 완주(참가자당 raw 44 → 22건), 도메인 저장 확인.
- **다음 단계**: 사용자 — 남은 「S1 파일럿 기본값」 표 확정. 개발 — S2.

- **세션**: 파일럿 S0 배포 확인 + 스프린트 S1 구현
- **수정 파일**: `architecture/pilot.md`(진행, 분량 매칭 방식, 「S1 파일럿 기본값」 표, 미결 3건), `index.md`(현재 단계), `extraction/` 8개(generative_metaphor·contextual_value_allocation·judgment_scenarios·attachment_narrative·core_conflict·feared_self·episodic_future_thinking·critical_incident — 파일럿 기본값 [User Review] 한 줄씩). 코드: `src/api`(고정 순서 `battery.py`, `module_completions` 테이블, `/api/progress`, raw 쓰기의 순서·잠금 강제, item id에 하이픈 허용, 테스트 12개), `src/web`(선언형 모듈 엔진 `components/engine`, 모듈 정의 `lib/modules`, `/m/[module]`, 순서형 홈).
- **핵심 결정**: 없음(사용자 확정 없음). 제안: 서버가 순서를 강제(arm 2개 → 배터리 8개, 앞 과제를 마쳐야 다음이 열림), 완료 기록은 raw 밖 별도 테이블, 자유서술은 30초 길이 스냅샷으로 B-08 사후 매칭. 문서 빈칸은 코드에 임시 기본값으로 넣고 전부 pilot.md 표와 각 모듈 [User Review]로 올림.
- **검증**: 로컬 브라우저로 10개 과제를 끝까지 진행 — 저장 형식이 각 문서 YAML 필드와 일치(가치 할당 allocations·flip_condition, CCRT 반복성, EFT skipped 등), 서버 초안만으로 다른 기기 이어하기 확인, 서버 오류 없음.
- **다음 단계**: 사용자 — 「S1 파일럿 기본값」 표와 B-08 분량 매칭 방향 결정. 개발 — S2(인생 장면·자기–타자·TAT·삼항·자유연상). TAT 폼 분할은 S2 착수 때 질문.

- **세션**: 터널 설정 안내 + 보안 보강 3건
- **수정 파일**: `architecture/pilot.md`(호스팅 행·보안 보강 행·[번복됨] 기록). 코드: `deploy/k8s/web.yaml`(NodePort 30380), `deploy/k8s/ingress.yaml` 삭제, `deploy/README.md`(현재 Cloudflare 대시보드 절차 — Networking > Tunnels · Published application — 와 보안 체크), `src/api/app/content.py`(동의 안내에 Cloudflare 경유 명시 → 동의 버전 변경), `src/api/requirements*.txt`(정확한 버전 고정), `.github/dependabot.yml`.
- **핵심 결정**(사용자): 터널 입구를 Traefik Ingress에서 `web` NodePort로 번복(Traefik 경유 시 host 없는 다른 Ingress가 파일럿 호스트명으로 노출될 수 있음). 동의 안내에 Cloudflare 전송 중 복호화를 밝힘. Dependabot 주간 업데이트 + 보안 업데이트 켬.
- **다음 단계**: 사용자가 터널 라우트의 Service URL을 `http://192.168.0.4:30380`으로 바꾸고 배포. 그다음 S1.

## 2026-09-30

- **세션**: 파일럿 결정 4건 반영
- **수정 파일**: `architecture/pilot.md`(사용자 결정 표·결정 사항), `index.md`(결정표), `extraction/`의 `core_conflict`·`judgment_scenarios`·`episodic_future_thinking`·`critical_incident`·`contextual_value_allocation`(UI 명세를 방법 절에 맞춰 고침, [User Review]→[해결됨]). 코드: 동의 안내에 Claude API 명시(동의 버전 변경), `deploy/k8s/ingress.yaml`(Traefik), `deploy/README.md`, `.env.example`.
- **핵심 결정**(사용자): LLM = Claude API · Q1 패키지 완성 뒤에만 초대 · 노드에서 kubectl, cloudflared는 호스트 → Traefik Ingress · UI 명세가 방법 절과 어긋나면 방법 절 기준. TAT 폼 분할은 방법 절 vs 원칙 문제라 S2에서 따로 묻는다.
- **다음 단계**: Tunnel 호스트명 받아 `ingress.yaml` 설정 → 홈랩 배포. S1(자유서술 arm + 선언형 모듈 엔진 + 정적 모듈 8종).

- **세션**: 파일럿 서비스 착수 — 설계 문서 + 스프린트 S0 구현
- **수정 파일**: 신규 `architecture/pilot.md`(Design) + `architecture/index.md`; `index.md`(현재 단계·결정표 '파일럿 서비스' 행); `AGENTS.md`(산출물에 `src/` 코드 추가·코드 작업 규칙); `vision.md`·`manual_experiment_guide.md`(프로젝트 정체성 [User Review] 해결); `experiment_ethics.md`(위기 번호 109 [User Review]). 코드: `src/api`, `src/web`, `deploy/`, `.github/workflows/pilot-images.yml`, `docker-compose.yml`·`.env.example` 교체, 옛 `backend/` 삭제.
- **핵심 결정**(사용자): 16종 전 모듈(LLM 동적 모듈 포함)·Q1 3-arm 실험 겸용·Next.js+FastAPI·홈랩 k3s(192.168.0.4)+Cloudflare Tunnel. 이에 따라 "앱이 아닌 방법론 위키" vs "앱 청사진" 정체성 모순을 앱 구축 쪽으로 해결. 제안(탐색중): 앱 안에는 LLM 없이 수집만, 예측·채점은 오프라인 단일 프롬프트; SQLite+PVC 단일 레플리카; 런칭 게이트 = Q1 패키지 완성 후 초대.
- **S0 구현**: 초대 코드(1회용)·재접속 코드(기기 이동)·세션 쿠키, 동의 문구·4종 토글(기본 꺼짐, append-only 이력), raw append-only 저장(verbatim), 임시저장, 본인 내보내기·영구 삭제(삭제 기록만 잔존), 관리자 초대·참가자·전체 내보내기, '힘들 때' 화면(109 — 2024 통합 번호 확인). API 테스트 11개 통과, 웹 lint·build 통과, 로컬 브라우저로 전 흐름 확인.
- **다음 단계**: `pilot.md` 미결 — ① LLM 제공자 ② 런칭 게이트 동의 ③ 배포 방식(kubectl/GitOps·네임스페이스·Tunnel 호스트명·노드 CPU 아키텍처) ④ 모듈 구현 기준(방법 절 우선). 그다음 S1(자유서술 arm + 선언형 모듈 엔진 + 정적 모듈 8종).

- **세션**: OKF 감사 — okf-system 2026-09-26 개정 적용 + 번들 전수 내용 감사(섹션별 병렬 감사 5개)
- **수정 파일**: 저장소 루트 `AGENTS.md`(브리핑 정본)·`CLAUDE.md`(`@AGENTS.md`·`@…/index.md` import)·`README.md`·`CONTRIBUTING.md`·`.gitignore`, 신규 `.claude/settings.json`(훅)·`.claude/okf/okf_check.py`(점검기 사본). 번들 `index.md`·`log.md`·섹션 index 5개, 개념 문서 37개 전부(frontmatter·`## 미결 사항`). 로컬 `review/` 2개.
- **핵심 결정**:
  - okf-system 개정 반영: `log.md` 날짜 헤딩 `## YYYY-MM-DD`만, 브리핑 정본 `AGENTS.md`, 점검기+SessionStart·PostToolUse·Stop 훅, `.gitignore`에 `review/`·`journal/`·`.claude/worktrees/`. 기본 브랜치는 `main`. 점검 결과 오류 9·경고 2 → 0.
  - `index.md`: 07-17 결정(저장·주입 raw 범위, 하이브리드 elicitation, A4 3-arm)을 가정·결정표에 반영, 현재 단계 명시, 마이그레이션 이력 블록 삭제, `## 핵심 원칙 (판단 기준)` 신설(`> 탐색중` — principles.md에서 옮긴 6개, 사용자 확인 필요).
  - 확정 본문은 링크 대상·내보내기 잔재("YAML" 줄) 수정 외 손대지 않음. 내용 모순(HIGH·MED)은 각 파일 `## 미결 사항`에 `[User Review]` 98건으로 등록, 이관 시점 자리표시 문장("새 미결 사항은 없다") 27곳 삭제. LOW·번들 밖 항목(`examples/`, docker 스캐폴딩, `refactor-docs` 브랜치)은 `review/20260930_okf_audit.md`, validation_mode 구조 개편안(정리 후 3파일 분할)은 `review/20260930_validation_restructure.md`.
  - type 교정: `mvp`(Goals)·`paper_strategy`(Reference)·`multi_agent_simulation`(Playbook) → Design. 07-17에 수정됐던 파일들의 낡은 timestamp·description 갱신.
- **다음 단계**: `[User Review]` 판정 — 뿌리가 같은 묶음부터 풀면 다수가 함께 닫힌다.
  1. 07-17 결정(런타임 요약 허용·하이브리드 elicitation)이 application·principles·일부 extraction 본문에 미전파.
  2. 검증 관문 의미: "최소 배터리 적재 완료 = 통과"(mvp §3-4) vs "실패 시 차단"(mvp·vision), 수동 실험 가이드는 검증을 선택 사항으로 둠.
  3. A4 정의: 3-arm 주장 A(결정) vs MBTI 요약본(comprehension)·soul.md(B-04).
  4. UI 명세 절이 같은 문서의 방법 절과 모순 — CCRT(LLM 꼬리질문), 판단 시나리오(A/B 즉시 선택), EFT(슬라이더), CIT(재유도), 가치 할당(재유도), TAT(입력창 분할).
  5. raw store 순도: 삼항의 파생 점수 저장, 인생 장면 단일 입력창 vs 두 필드 저장.
  6. 동의 모델(제공자별 용도 토글)과 "전 도메인 통합 주입" 결정이 번들 어디에도 기록돼 있지 않음.
  7. counseling_mode 위기 상담 번호 — 2024-01 통합 자살예방 상담전화 109 반영 여부 확인(안전).
  8. `index.md` 핵심 원칙 `> 탐색중` 해제, roadmap.md를 페이즈 타임라인으로 재작성할지.

## 2026-07-17

- **세션**: [User Review] 8건 사용자 판정 반영 — 확정 문서 리팩터링
- **principles**: 무-요약 제약을 폐기/모듈화하지 않고 **범위 명확화**(저장·주입=raw 불변, *런타임 LLM 처리·요약은 허용*) — 사용자 입장 반영. §1-0 범위 문장 추가, 결정 사항 기록. desk_research §1-1·open_questions Q1도 정합.
- **cognitive_engine**: 활용 elicitation=**하이브리드(타깃 질의 기본, 자율은 특정 모드만)**; §3에 역할별 judge 가중(Confident Liar) 추가; §5-1에 Tran&Kiela·MAS-ZERO citation + **A4 자체 확장 게이팅** 신설.
- **free_association**: 직교성 검증=**검증용 소규모 cue 별도 세션**(순수 추출 유지) 확정.
- **validation_mode**: 4건 전부 채택·본문 반영 — 3-arm A4(§1-3), 다중턴 심문+3차원 일관성(§3), 정규화 공식 표기 주의(§1-3), 문체통제 임포스터(§3 B2).
- **결과**: 열린 [User Review] 8→0. 각 문서 `## 결정 사항`에 [해결됨] 기록.

- **세션**: 데스크 리서치 편입 [3/3] — 개선 제안 마커. 문헌이 확증한 개선 제안을 각 문서 `[User Review]`로 심음(확정 본문은 미수정, 컨펌 대기).
- `validation_mode.md`: ① 3-arm A4(구조 고립) ② 다중턴 적대 심문(PICon) ③ 정규화 공식 명확화·퇴화 케이스 ④ 문체통제 역-튜링(TwinVoice).
- `free_association.md`: 직교성 측정법(cue-based)과 "자극어 없음" 설계의 긴장 → 소규모 cue 별도 세션 vs cue 없는 대안 지표.
- (cognitive_engine·principles 마커는 [1/3]에서 완료.)
- **열린 [User Review] 총계**: principles 1, cognitive_engine 2, validation_mode 4, free_association 1 = 사용자 판단 대기 8건. 열린 [TODO]도 다수(각 문서 미결 참조).

- **세션**: 데스크 리서치 편입 [2/3] — 소스 공백 2차 패스
- `desk_research_2026-07.md`에 **§7** 추가 — Q6/Q3/Q8 공백을 집중 웹 검색으로 재조사(citations [12]–[20]).
- **Q8 웹 RT**: Reimers&Stewart(2015, PMC4427652) ✅fetch — 웹 RT는 상수 오프셋(30–100ms) + 낮은 랜덤노이즈 → within-subject 상대 신호로 유효, cross-person 절대비교 부적합. **free_association §1 RT 예외 설계를 정확히 뒷받침.**
- **Q6 자유연상 의미망**: Aeschbach·Mata·Wulff(2024, 2410.18326) ✅fetch — 개인 의미망 추정법. 단 **cue-based 전제** → 프로젝트 "자극어 없음"과 긴장(Q5 직교성 방법에 영향). 암묵동기 코더(~.85), 서사 STM은 활용측 코딩 도구.
- **Q3**: cross-cultural 프레임 확보([17][18]), 한국 특정 수치 미확보 → open_questions Q3 부분 해소 표기.
- **잔존 공백**: 한국 경제게임 규준, 레퍼토리 그리드 NLP 자동화(desk_research 미결 [TODO]).
- **다음**: [3] validation_mode·free_association 개선 제안 마커.

- **세션**: 데스크 리서치 편입 [1/3] — Reference 문서 + 미답 질문 재구성
- **신규**: `research/desk_research_2026-07.md`(Reference) — 2024–26 문헌 데스크 리서치, 적대적 검증 통과 21 클레임 + 기각 4건 + 한계 + 소스 공백. 검증 표(vote) 병기.
- **테제 위협 3대**: ① 무-요약이 법칙 아니라 과업 의존적(BehaviorBench 2606.02798) ② 자율 생성 시 raw가 모델 prior로 붕괴(Habermolt 2605.24413) ③ 정규화 공식 문헌(비율 87.67%) vs 프로젝트(바닥차감 ~55.7%) 혼동 금지(Twin-2K 2505.17479).
- **open_questions**: Q1 재구성(무-요약→모듈별 검증 가설, 3-arm A4), Q2 증강(2604.02460·MAS-ZERO·Confident Liar), **Q6 신설**(활용 elicitation 자율생성 vs 타깃질의 prior-collapse). 상태요약 5→6.
- **[User Review] 마커**: `principles.md`(무-요약 법칙→모듈별 가설 재구성 제안), `cognitive_engine.md`(Habermolt 붕괴 → 타깃 질의 프로토콜 + 예산매칭/역할셔플/역할별 judge 보정).
- **다음**: [2] 소스 공백(Q6전산조작화·Q3한국경제게임·Q8웹RT) 2차 검색 → desk_research §7. [3] validation_mode 개선 제안 마커.

## 2026-07-16

- **세션**: 리뷰 [User Review] 2건 해결 — 사용자 판정
- **architecture.md 가명화**: "NER 기반 + 결정론적" 모순 → **2계층 설계 확정**(실명 유출 0 지향). 1계층=결정론적 사전·정규식 자동 치환, 2계층=NER 후보 최초 전송 전 사용자 확인. §2 Module 1 본문·frontmatter 리팩토링, `## 결정 사항`에 [해결됨] 기록.
- **laddering.md 중단 신호 "그냥"**: 이중 매핑 → **회피(defensive_exit) 재분류 확정**. `terminal_signals`에서 "그냥" 제거, `should_stop_laddering`에 `defensive_streak`·`defensive_exit` 추가, §5 산출물에 `stop_reason` 필드 신설. `## 결정 사항`에 [해결됨] 기록.
- 두 파일 모두 확정 본문을 사용자 결정에 따라 리팩토링(OKF 결정 기록 규칙 3). 남은 로컬 미결: laddering 반복감지 임베딩 교체 [TODO], architecture XP 임계치 [TODO].

- **세션**: 자유연상 재설계 — 순수·RT예외·격리. 사용자 지시로 `extraction/free_association.md` 재설계(설계 결정 3건 확정, `## 결정 사항`에 기록).
- **자극어 완전 제거**: 표준 WAT식 자극어를 없애고 순수 자유연상으로. 설계자 프레임이 사라져 무오염을 최대화 — 이전 자극어 출처 [User Review]는 이 결정으로 **해소**.
- **RT(반응지연) 예외 수집**: §1-2 전역 원칙(밀리초 측정 기각)에 대한 **명시적 예외**로 켬. 본문에 원칙 위배임을 명시하고, 웹 측정 노이즈 때문에 정밀 지표가 아닌 *보조 신호*(상대 지연·긴 정지 플래그)로만 한정. 전역 기본은 여전히 '제외'.
- **같은 날 타 검사 격리(§3)**: 타 기법의 점화(priming)가 순수 연상을 오염시키므로, 자유연상은 다른 검사와 같은 날 실시 금지(`administered_alone` 감사).
- **동기화**: `extraction/index.md` 후보 표, `index.md` 설계 결정 테이블 RT 행("기각 + 모듈 예외"), `open_questions.md` Q5(자극어 갈등 해소 → 직교성만 잔존)로 갱신.
- **미해결**: architecture·laddering의 [User Review] 2건은 사용자 판단 요청 상태(다음 항목).

- **세션**: 리뷰 마커 + 자유연상 후보 추가
- **문제 마커(리뷰)**: 이관 중 발견한 실제 결함에 OKF 마커 부착(본문 verbatim 불변, `## 미결 사항`에만 기재).
  - `architecture.md`: [User Review] 가명화 "NER 기반 + 결정론적" 모순(NER은 비결정론적 → PII 유출/verbatim 훼손 위험) · [TODO] `current_xp` 임계치 100 매직 넘버.
  - `extraction/laddering.md`: [User Review] 중단신호 "그냥"이 방어적 회피(프롬프트)와 종착 가치(코드)로 이중 매핑 · [TODO] 반복감지 코드(정확 일치)-주석(임베딩 유사도) 불일치.
- **신규 후보 모듈**: `extraction/free_association.md`(자유연상, 탐색중) 추가. RT는 프로젝트 결정대로 제외, 내용·자기보고로 대체. 자극어 출처(표준/raw파생/중립시드) 미결 → [User Review]. `extraction/index.md`에 '후보(탐색중)' 표로 분리 등재(16종 확정 카운트는 불변).
- **open_questions**: Q4 운영 결정 종결 표기, Q5(자유연상 편입 여부) 신설.
- **다음 단계**: Q5 자극어 출처 결정 후 free_association 진행 가능. architecture·laddering의 [User Review] 2건은 사용자 컨펌 대기.

- **세션**: OKF 마이그레이션 — 전체 이관 완료. 원본 34개 문서를 OKF 개념 문서로 **전부 이관 완료**(스켈레톤 3종 이후 나머지 31종을 병렬 서브에이전트로 변환).
- **이관 규칙**: 본문 verbatim 보존(불변), frontmatter(type/title/description/tags/timestamp) 부착, 옛 위키링크 `[텍스트](<한글.md>)` → 상대경로 OKF 링크, `## 미결 사항` 부착. 파일명 소문자_영어.
- **섹션 구성**: extraction 16, application 3, validation 4, architecture 2, research 2(+open_questions), overview 4, operations 3. 모든 섹션 `index.md` 상태표를 이관 완료로 갱신.
- **검증**: (a) 개념 문서 34종 전부 frontmatter 적합, (b) 한글 파일명 링크 잔존 0, (c) Obsidian 각괄호 링크 `](<…>)` 래퍼 제거, (d) 상대 .md 링크 전수 존재 확인(broken 0), (e) 본문 줄 수 대조 — 전 파일 원본 대비 +10~15줄(frontmatter+미결)로 truncation 없음. `validation_mode.md` 1115→1129.
- **발견된 로컬 미결**: `extraction/triad_elicitation.md` §5-2 Gate 2 STS 임계치 튜닝 `[TODO]` 1건(해당 파일 미결 사항에 보존).
- **후속(미해결)**: 저장소 루트 `okf-system/`은 untracked 상태 — 커밋할지 gitignore할지 사용자 결정 대기. 전체 변경 아직 미커밋.

- **세션**: OKF 마이그레이션 — 스켈레톤 + 첫 배치. 기존 ~40개 한국어 기획 문서를 OKF 지식 번들로 이관 시작.
- **구조 신설**: `extracting-the-human-mind/` 번들 생성. 7개 섹션(overview·extraction·application·validation·architecture·research·operations) + 각 `index.md`.
- **예약 파일**: `index.md`(핵심 가설·설계 결정 테이블), `log.md`, `research/open_questions.md` 생성.
- **저장소 루트**: `CLAUDE.md`/`AGENTS.md` 신설. 원본 ~40개 문서는 `inbox/`로 이동하고 `.gitignore`에 `inbox/`·`outbox/` 추가(로컬 전용, git 이력 보존).
- **개념 문서 이관 (첫 배치, 3종)**:
  - `extraction/laddering.md` (Playbook) ← `inbox/래더링.md`
  - `architecture/architecture.md` (Design) ← `inbox/아키텍처.md`
  - `research/related_research.md` (Reference) ← `inbox/관련 연구.md`
- **핵심 결정**: 원본 내용은 verbatim 보존(불변). 이관 = frontmatter 부착 + 옛 위키링크를 상대 경로로 교정 + `## 미결 사항` 섹션 부착. 파일명은 소문자+언더스코어 영어로 정규화.
- **다음 단계 (Next Steps)**: `inbox/`에 남은 원본 문서들을 각 섹션으로 이관 — extraction 13종(triad_elicitation, feared_self, defining_life_scenes, contextual_value_allocation, generative_metaphor, judgment_scenarios, self_other, critical_incident, core_conflict, behavioral_traces_esm, automated_tat, day_reconstruction, episodic_future_thinking, attachment_narrative, clean_language), application 3종, validation 4종, architecture의 cognitive_engine, research의 paper_strategy, overview 4종(vision·mvp·roadmap·principles), operations 3종. 각 섹션 `index.md`의 표에 이관 완료분을 반영할 것.

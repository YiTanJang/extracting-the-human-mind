@AGENTS.md
@extracting-the-human-mind/index.md

## Claude Code 전용

- 컨텍스트를 압축할 때는 이번 세션에서 고친 번들 파일 목록, 내린 결정, 새로 생긴 `[User Review]`·미결 항목을 보존한다. 세션 종료 때 `log.md` 인수인계의 재료다.
- `.claude/settings.json`의 훅이 `.claude/okf/okf_check.py`를 부른다(보고 전용): 세션 시작 때 번들 현황, 번들 파일 편집 직후 형식 점검, 종료 때 인수인계 누락 알림. 점검기 원본은 `okf-system/tools/`에 있으니, 원본이 바뀌면 사본을 다시 복사해 커밋한다.

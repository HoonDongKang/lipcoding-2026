# Sprint 3 — Copilot SDK AI 입력 (Tool Call + 스트리밍)

**목표:** 자연어로 입력하면 Copilot SDK 에이전트가 의도를 파악하고 Tool Call로 Todo 생성/우선순위 분석/태스크 분해를 처리한다.

> ⚠️ **심사 기준 1번(25%) 핵심 스프린트** — Tool Call 깊이, 스트리밍, 컨텍스트 처리 모두 시연 가능해야 한다.

**기간:** 3–4일 | **의존성:** Sprint 2 완료

---

## ✅ 성공 기준

- [ ] AI 입력창에서 자연어 입력 → SSE 스트리밍으로 응답 실시간 렌더링
- [ ] "다음 주 월요일 PR 리뷰 해야 해" → 날짜 파싱 + Todo 자동 생성 + 캘린더 반영
- [ ] "오늘 할 일 정리해줘" → 우선순위 분석 결과 스트리밍
- [ ] "이 태스크 쪼개줘" → 서브태스크 자동 생성, `parentId`로 연결
- [ ] AI 생성 Todo에 "AI" 배지 표시 (Responsible AI)
- [ ] BYOK: Azure AI Foundry를 LLM으로 사용
- [ ] 스트리밍 중 입력창 비활성화 + 로딩 인디케이터
- [ ] 시스템 프롬프트에 사용자 입력 직접 삽입 금지 (프롬프트 인젝션 방어)
- [ ] AgentService 단위 테스트 (툴 호출 mock)

---

## 📋 태스크

| # | 태스크 | 담당 | 크기 |
|---|--------|------|------|
| 1 | `@github/copilot-sdk` 설치 | Sage | S |
| 2 | `AgentModule` / `AgentController` / `AgentService` 스캐폴딩 | Sage | S |
| 3 | BYOK 설정: Azure AI Foundry provider 연결 (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`) | Sage | M |
| 4 | `createTask` Tool 구현 — 자연어 파싱 + `TasksService.create()` 호출 | Sage | M |
| 5 | `prioritizeTasks` Tool 구현 — 미완료 Todo 분석 + 우선순위 리스트 반환 | Sage | M |
| 6 | `decomposeTask` Tool 구현 — 태스크 → 서브태스크 배열 반환 + `parentId` 저장 | Sage | M |
| 7 | `POST /agent/chat` — 메시지 수신 → 에이전트 실행 → Tool Call → 결과 반환 | Sage | M |
| 8 | `GET /agent/stream` — SSE 스트리밍 엔드포인트 (`@Sse()` + `Observable`) | Sage | L |
| 9 | 프롬프트 인젝션 방어: 사용자 입력 sanitize 후 컨텍스트로만 전달 | Sage | M |
| 10 | AgentService 단위 테스트 (Tool Call mock) | Sage | M |
| 11 | `frontend/src/hooks/useStream.ts` — EventSource SSE 소비, 토큰 누적 | Nova | M |
| 12 | `AgentInput` 컴포넌트 — textarea + "AI에게 물어보기" 버튼 + 스트리밍 응답 영역 | Nova | M |
| 13 | 스트리밍 토큰 점진적 렌더링 (커서 애니메이션) | Nova | M |
| 14 | `TaskItem`에 `aiGenerated` 배지 추가 | Nova | S |
| 15 | 스트리밍 중 입력 비활성화 + 로딩 스피너 | Nova | S |
| 16 | `useStream` Vitest 테스트 작성 | Nova | M |
| 17 | AI 입력창 시각적 구분 — 팝업 하단 고정 영역 | Milo | S |
| 18 | "AI 생성" 배지 디자인, 스트리밍 응답 영역 스타일 | Milo | S |

---

## 🤖 Dev Team 실행 프롬프트

```
PROJECT_BRIEF.md와 docs/sprint-3/plan.md를 읽어라.

브랜치: git checkout -b feature/sprint-3

순서:
1. Sage: @github/copilot-sdk 설치 → BYOK 설정 → 3개 Tool 구현 → chat/stream 엔드포인트 → 테스트 → 커밋
2. Nova: useStream 훅 → AgentInput → 스트리밍 렌더링 → 배지/로딩 → 테스트 → 커밋
3. Milo: AI 입력창 레이아웃 + 스타일 → 커밋

BYOK 키는 반드시 환경변수로만 사용, 코드에 직접 삽입 금지
검증: 자연어 입력 → 스트리밍 응답 → 캘린더 Todo 반영 확인
완료 후: PR 생성, docs/sprint-3/done.md 작성
```

# Sprint 3 — Progress

**브랜치:** `feature/sprint-3`
**시작일:** 2026-06-20

---

## 엔지니어링 결정사항

### `@github/copilot-sdk` vs `openai` SDK

`@github/copilot-sdk`는 GitHub Copilot CLI를 JSON-RPC로 제어하는 SDK로, 실행 시 로컬/서버에 `gh copilot` CLI가 설치되어 있어야 합니다. Azure App Service 환경에서 CLI를 사용하기 어렵기 때문에, 다음과 같이 결정:

- `@github/copilot-sdk`: 설치 완료, `defineTool` 유틸리티/타입 정의에 참조
- `openai` npm 패키지: `AzureOpenAI` 클래스로 실제 BYOK Tool Call + 스트리밍 구현
- ProviderConfig type은 `"azure"` (SDK 실제 값), plan의 `"azure-openai"` 표기와 약간 다름
- 환경변수(`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`) 없으면 mock 응답 반환

### 커서 애니메이션
- Tailwind의 `animate-pulse` 대신 커스텀 `@keyframes blink` CSS 사용 (`index.css`)
- `prefers-reduced-motion` 미디어 쿼리로 접근성 준수

---

## 진행 상황

### Phase 1: 패키지 설치 ✅
- `@github/copilot-sdk` 설치
- `openai` 설치

### Phase 2: Backend AgentModule ✅
- [x] agent.module.ts
- [x] agent.controller.ts
- [x] agent.service.ts
- [x] AppModule 등록
- [x] 단위 테스트

### Phase 3: Frontend ✅
- [x] `useStream.ts` 훅 — EventSource SSE, token/tool_call/error/done 처리
- [x] `AgentInput.tsx` 컴포넌트 — textarea (max 500자), AI에게 물어보기 버튼, 스트리밍 응답, collapsible
- [x] `App.tsx` 업데이트 — AgentInput 하단 배치
- [x] `TaskItem.tsx` — aiGenerated 배지 (보라색 pill) 확인 완료
- [x] `useStream` Vitest 테스트 — EventSource 클래스 mock, 11개 테스트 케이스

### Phase 4: 스타일 ✅
- [x] `@keyframes blink` 커서 깜빡임 애니메이션 (`index.css`)
- [x] AgentInput — 파란 그라디언트 border, 회색 응답 배경
- [x] "✨ AI" 배지 — 보라색 pill (`TaskItem.tsx`)

---

## 테스트 결과

```
Test Files  4 passed (4)
Tests       31 passed (31)
```

- lint: ✅ 0 errors
- build: ✅ 273.90 kB / gzip 86.30 kB

---

## 커밋 로그

- `feat: frontend AI input with SSE streaming`

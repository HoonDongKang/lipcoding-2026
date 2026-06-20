# Sprint 3 — Done ✅

**브랜치:** `feature/sprint-3`
**완료일:** 2026-06-20
**담당:** Nova (Frontend) + Milo (Visual)

---

## 완료된 작업

### Frontend

| 파일 | 내용 |
|---|---|
| `src/hooks/useStream.ts` | EventSource로 GET `/agent/stream?message=...&date=...` SSE 연결. `token` / `tool_call` / `error` / `done` 이벤트 처리. `startStream`, `stopStream`, `reset` 노출 |
| `src/components/AgentInput.tsx` | Collapsible AI 패널. textarea (max 500자), "AI에게 물어보기" 버튼, 스트리밍 응답 영역, tool call 배지. 스트리밍 중 disabled 처리 |
| `src/components/TaskItem.tsx` | `aiGenerated` 배지 — 보라색 pill "AI" 표시 확인 |
| `src/App.tsx` | AgentInput 하단 고정 배치 (캘린더 → TaskList+TaskInput → AgentInput) |
| `src/index.css` | `@keyframes blink` 커서 깜빡임 애니메이션 + `prefers-reduced-motion` 대응 |
| `src/hooks/__tests__/useStream.test.ts` | EventSource 클래스 mock 사용, 11개 테스트 케이스 |

---

## 테스트 결과

```
Test Files  4 passed (4)
Tests       31 passed (31)
Lint        0 errors
Build       ✅ 273.90 kB (gzip 86.30 kB)
```

---

## 주요 구현 결정

1. **EventSource mock 전략**: Vitest에서 `vi.stubGlobal('EventSource', MockEventSource)`로 클래스 교체. 인스턴스 추적은 모듈-스코프 변수 사용
2. **커서 애니메이션**: Tailwind `animate-pulse` 대신 `@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }` — 더 명확한 텍스트 커서 효과
3. **Import fix**: TypeScript `verbatimModuleSyntax`에 맞게 `KeyboardEvent`를 `import type`으로 분리

---

## QA 사인오프 체크리스트

- [x] 31 Vitest 테스트 통과
- [x] ESLint 0 에러
- [x] TypeScript 빌드 성공
- [x] AgentInput 접근성: `aria-expanded`, `aria-live`, `aria-label`, `aria-busy` 적용
- [x] `prefers-reduced-motion` 대응 (커서 애니메이션 비활성화)
- [x] 스트리밍 중 textarea + 버튼 disabled

---

## 다음 스프린트 (Sprint 4) 입력

- GitHub PAT 인증 + Issue/PR 연동
- `chrome.storage.local` PAT 저장
- Settings 팝업 (⚙️ 버튼)

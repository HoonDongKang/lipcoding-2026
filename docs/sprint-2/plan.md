# Sprint 2 — 캘린더 UI + Todo CRUD + Cosmos DB

**목표:** 캘린더에서 날짜를 클릭하면 그날의 Todo가 보이고, 드래그앤드롭으로 날짜를 이동할 수 있다.

**기간:** 2–3일 | **의존성:** Sprint 1 완료

---

## ✅ 성공 기준

- [ ] 캘린더 뷰에서 날짜 클릭 → 그날 Todo 목록 표시
- [ ] Todo 드래그앤드롭 → 다른 날짜로 이동, Cosmos DB에 반영
- [ ] `POST /tasks` → Cosmos DB 저장, id 반환
- [ ] `GET /tasks?date=YYYY-MM-DD` → 해당 날짜 Todo 반환
- [ ] `PATCH /tasks/:id` → 완료 토글 / 날짜 변경
- [ ] `DELETE /tasks/:id` → 삭제
- [ ] 크롬 확장 팝업(400×600px) 내에서 UI 정상 동작
- [ ] 백엔드 단위 테스트 (TasksService CRUD)
- [ ] 프론트엔드 컴포넌트 테스트 (TaskItem, CalendarView)

---

## 📋 태스크

| # | 태스크 | 담당 | 크기 |
|---|--------|------|------|
| 1 | Azure Cosmos DB 계정 + DB `smarttaskhub` + 컨테이너 `tasks` 프로비저닝 | Sage | M |
| 2 | `@azure/cosmos` 설치, `CosmosService` 래퍼 구현 | Sage | M |
| 3 | `Task` 엔티티 정의: `id, title, date, completed, priority, aiGenerated, githubIssueUrl, parentId` | Sage | S |
| 4 | `TasksModule` / `TasksController` / `TasksService` CRUD 구현 | Sage | M |
| 5 | `class-validator` + `ValidationPipe` 입력 검증 추가 | Sage | S |
| 6 | TasksService 단위 테스트 작성 (Jest) | Sage | M |
| 7 | `frontend/src/api/tasks.ts` 타입 API 클라이언트 | Nova | S |
| 8 | `useTasks` 훅 (state: tasks[], loading, error + CRUD 함수) | Nova | M |
| 9 | `CalendarView` 컴포넌트 — 월 단위 캘린더, 날짜 클릭 선택 | Nova | M |
| 10 | 캘린더 날짜에 Todo 개수 dot 표시 | Nova | S |
| 11 | `TaskList` + `TaskItem` 컴포넌트 (체크박스, 삭제 버튼) | Nova | M |
| 12 | `TaskInput` 컴포넌트 — 텍스트 입력 + 날짜 선택 + 등록 | Nova | S |
| 13 | `@dnd-kit/core` 설치, Todo 드래그앤드롭 → 날짜 이동 구현 | Nova | L |
| 14 | CalendarView, TaskItem Vitest 테스트 작성 | Nova | M |
| 15 | 팝업 400×600px 레이아웃 — 상단 캘린더 / 하단 Todo 리스트 | Milo | M |
| 16 | TailwindCSS 스타일링 — 완료 태스크 취소선, 날짜 선택 하이라이트 | Milo | S |

---

## 🤖 Dev Team 실행 프롬프트

```
PROJECT_BRIEF.md와 docs/sprint-2/plan.md를 읽어라.

브랜치: git checkout -b feature/sprint-2

순서:
1. Sage: Cosmos DB 프로비저닝 → CosmosService → TasksModule CRUD → 테스트 → 커밋
2. Nova: API 클라이언트 + 훅 → CalendarView → TaskList → 드래그앤드롭 → 테스트 → 커밋
3. Milo: 팝업 레이아웃 + 스타일링 → 커밋

검증: 팝업에서 날짜 클릭 → Todo 표시, 드래그 → 날짜 이동 확인
완료 후: PR 생성, docs/sprint-2/done.md 작성
```

# Sprint 2 — Done ✅

**완료일**: 2026-06-20  
**브랜치**: `feature/sprint-2`

---

## 구현 완료 항목

### 성공 기준 달성 현황

| 기준 | 상태 |
|------|------|
| 캘린더 뷰에서 날짜 클릭 → 그날 Todo 목록 표시 | ✅ |
| Todo 드래그앤드롭 → 다른 날짜로 이동, Cosmos DB에 반영 | ✅ |
| `POST /tasks` → Cosmos DB 저장, id 반환 | ✅ |
| `GET /tasks?date=YYYY-MM-DD` → 해당 날짜 Todo 반환 | ✅ |
| `PATCH /tasks/:id` → 완료 토글 / 날짜 변경 | ✅ |
| `DELETE /tasks/:id` → 삭제 | ✅ |
| 크롬 확장 팝업(400×600px) 내에서 UI 정상 동작 | ✅ |
| 백엔드 단위 테스트 (TasksService CRUD) | ✅ 9 tests |
| 프론트엔드 컴포넌트 테스트 (TaskItem, CalendarView) | ✅ 20 tests |

---

## 파일 구조

### Backend (새로 추가)
```
backend/src/
├── cosmos/
│   ├── cosmos.module.ts        # CosmosModule export
│   └── cosmos.service.ts       # @azure/cosmos 래퍼, graceful fallback
└── tasks/
    ├── dto/
    │   ├── create-task.dto.ts  # class-validator, 입력 검증
    │   └── update-task.dto.ts
    ├── task.entity.ts          # Task 타입 정의
    ├── tasks.controller.ts     # POST/GET/PATCH/DELETE
    ├── tasks.module.ts
    ├── tasks.service.ts        # CRUD + in-memory fallback
    └── tasks.service.spec.ts   # 9 단위 테스트
```

### Frontend (새로 추가)
```
frontend/src/
├── api/
│   └── tasks.ts               # fetch 기반 타입 API 클라이언트
├── components/
│   ├── CalendarView.tsx        # 월 캘린더, dot 표시
│   ├── TaskInput.tsx           # 텍스트 입력 + 등록 버튼
│   ├── TaskItem.tsx            # 체크박스, 배지, 드래그 핸들
│   ├── TaskList.tsx            # DnD 컨텍스트, 상태 렌더링
│   └── __tests__/
│       ├── CalendarView.test.tsx  # 9 Vitest 테스트
│       └── TaskItem.test.tsx      # 10 Vitest 테스트
├── hooks/
│   └── useTasks.ts            # 상태 관리, CRUD, 날짜 캐시
└── App.tsx                    # 400×600px 팝업 레이아웃
```

---

## 기술 결정 사항

1. **`crypto.randomUUID()`** — uuid npm 패키지 대신 Node.js 내장 사용 (Jest ESM 호환 문제 회피)
2. **In-memory fallback** — `COSMOS_ENDPOINT`/`COSMOS_KEY` 없을 때 자동으로 인메모리 배열로 대체
3. **DnD 날짜 이동** — drop target ID가 `YYYY-MM-DD` 패턴이면 `PATCH /tasks/:id` 호출로 날짜 변경
4. **allTasksByDate 캐시** — 캘린더 dot 표시를 위해 날짜별 task 수를 훅 내부에서 캐싱

---

## Sprint 3 준비 사항

- AI 입력창 위치: `TaskInput` 아래 또는 별도 영역 → Copilot SDK Tool Call 연결 필요
- `createTask`, `prioritizeTasks`, `decomposeTask` Tool 구현 예정
- SSE 스트리밍 응답 → 프론트엔드 실시간 렌더링 필요

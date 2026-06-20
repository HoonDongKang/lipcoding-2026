# QA Sign-off — Sprint 3 (Full Production QA)

**Date:** 2026-06-20  
**QA Engineer:** Ivy  
**Tested commit:** `bb57f59` (HEAD → main)  
**Environment:**
- Frontend: https://icy-bay-0df707d00.7.azurestaticapps.net
- Backend: https://smart-task-hub-api.azurewebsites.net

---

## 1. Automated Test Results

| Suite | Tool | Tests | Passed | Failed | Warnings |
|---|---|---|---|---|---|
| Backend unit tests | Jest | 19 | 19 | 0 | 0 |
| Frontend unit tests | Vitest | 31 | 31 | 0 | 2 (act() warning) |
| Backend lint | ESLint | — | — | **7 errors** | 0 |
| Frontend lint | ESLint | — | — | 0 | 0 |

**Total tests: 50 / 50 passed (100%)**  
**Lint: 7 errors (backend only)**

---

## 2. API Manual Test Results

| 항목 | Endpoint | Expected | Actual | 결과 |
|---|---|---|---|---|
| Health check | GET /health | `{"status":"ok"}` | `{"status":"ok","timestamp":"..."}` | ✅ |
| 태스크 생성 | POST /tasks | 201 + Task JSON | 201 + Task JSON | ✅ |
| 날짜별 조회 | GET /tasks?date=2026-06-20 | 200 + Task[] | 200 + Task[] | ✅ |
| 체크박스 토글 | PATCH /tasks/:id `{"completed":true}` | 200 + updated Task | **500 Internal Server Error** | ❌ **BLOCKER** |
| 존재하지 않는 ID PATCH | PATCH /tasks/non-existent | 404 Not Found | 404 Not Found | ✅ |
| 잘못된 타입 PATCH | PATCH /tasks/:id `{"completed":"str"}` | 400 Bad Request | 400 Bad Request | ✅ |
| 태스크 삭제 | DELETE /tasks/:id | 204 No Content | 204 No Content | ✅ |
| SSE 스트림 | GET /agent/stream?message=...&date=... | SSE token stream | SSE token stream 정상 | ✅ |

---

## 3. Frontend Static Analysis

| 항목 | 결과 | 비고 |
|---|---|---|
| Frontend HTTP 응답 | ✅ 200 OK | https://icy-bay-0df707d00.7.azurestaticapps.net |
| VITE_API_URL 번들 포함 | ✅ | `smart-task-hub-api.azurewebsites.net` 번들에 삽입 확인 |
| `/tasks` API 엔드포인트 | ✅ | JS 번들에서 확인 |
| `/agent` API 엔드포인트 | ✅ | JS 번들에서 확인 |

---

## 4. Issues Filed

| Issue # | Title | Severity | Status |
|---|---|---|---|
| [#4](https://github.com/HoonDongKang/lipcoding-2026/issues/4) | PATCH /tasks/:id returns 500 Internal Server Error on production | **Blocker** | Open |
| [#5](https://github.com/HoonDongKang/lipcoding-2026/issues/5) | API responses expose Cosmos DB internal system fields | Minor | Open |
| [#6](https://github.com/HoonDongKang/lipcoding-2026/issues/6) | Backend lint: 7 ESLint errors in agent.service.ts and tasks.service.ts | Minor | Open |
| [#7](https://github.com/HoonDongKang/lipcoding-2026/issues/7) | Frontend test warning: React act() missing in App.test.tsx | Minor | Open |

---

## 5. Blocker Summary

### 🚨 Issue #4 — PATCH /tasks/:id → 500 (BLOCKER)

- **What breaks:** Checkbox toggle is 100% broken in production. Every attempt to mark a task complete/incomplete fails with 500.
- **Root cause suspected:** The `TasksService.update()` Cosmos DB `.replace()` call fails at runtime on Azure. The etag-stripping fix exists in local `dist/` (matching commit `24bffcb`) but the production API is still responding with 500 — suggesting either the deployment did not apply correctly, or there is a runtime error in the `replace()` call itself that is not surfaced in local testing.
- **Validation evidence:** The query phase works (404 for non-existent IDs), validation works (400 for bad input), only the `replace()` step produces 500.

---

## 6. Test Data Cleanup

All QA-created test tasks (`[QA Test] 2026-06-20 task`, `[QA PATCH Test]`) were deleted after testing. Only pre-existing data (`배포 테스트 Todo`) remains in Cosmos DB for `date=2026-06-20`.

---

## 7. Sign-off Decision

```
❌ BLOCKED
```

**Reason:** Issue #4 is a blocker. The core task completion feature (`PATCH /tasks/:id`) is broken in production. Users cannot toggle task completion — the fundamental checkbox interaction returns 500 on every attempt.

Sprint 3 cannot be signed off until Issue #4 is resolved and verified.

---

*QA: Ivy — 2026-06-20*

# Sprint 2 Progress

## Status: ✅ COMPLETE

| Phase | Status | Details |
|-------|--------|---------|
| Backend packages | ✅ | @azure/cosmos, class-validator, class-transformer installed |
| CosmosService | ✅ | Graceful fallback when env vars absent, in-memory mode |
| Task entity | ✅ | id, title, date, completed, priority, aiGenerated, parentId |
| TasksModule CRUD | ✅ | POST/GET/PATCH/DELETE with ValidationPipe |
| Backend tests | ✅ | 9 tests (create, findByDate, update, remove) |
| Frontend packages | ✅ | @dnd-kit/core, sortable, utilities, date-fns installed |
| API client | ✅ | Typed fetch, VITE_API_URL support |
| useTasks hook | ✅ | State, CRUD, date cache |
| CalendarView | ✅ | Monthly grid, navigation, dot indicators |
| TaskList | ✅ | DnD context, empty/loading/error states |
| TaskItem | ✅ | Checkbox, priority badge, AI badge, drag handle |
| TaskInput | ✅ | Enter/click submit |
| App.tsx layout | ✅ | 400×600px popup, 300/300 split |
| Frontend tests | ✅ | 20 tests (TaskItem: 10, CalendarView: 9, App: 1) |
| CSS polish | ✅ | Scrollbar, reduced-motion, popup constraints |

## Commits
1. `feat(backend)` — Cosmos DB service + Tasks CRUD + 9 unit tests
2. `feat(frontend)` — Calendar UI + Task CRUD + drag-and-drop + 20 tests
3. `style(milo)` — popup layout polish, custom scrollbar, reduced-motion

## Decisions Made
- Used `crypto.randomUUID()` (Node built-in) instead of uuid package (ESM issues with Jest)
- DnD drop target: date-string IDs on calendar cells allow cross-date moves
- In-memory fallback for Cosmos lets frontend devs work without Azure credentials

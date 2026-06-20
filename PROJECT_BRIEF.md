# PROJECT_BRIEF.md — Smart Task Hub

## 1. 프로젝트 개요

**Smart Task Hub** — 크롬 확장 팝업 형태의 AI-native 캘린더 Todo 앱.
캘린더에서 날짜별 Todo를 관리하고, Copilot SDK 에이전트가 자연어 명령을 Tool Call로 처리한다.
GitHub Issue/PR 연동으로 개발자 생산성을 높인다.

- **대회**: lipcoding-kr/lipcoding-competition-2026
- **배포 URL (FE)**: (배포 후 기입)
- **배포 URL (BE)**: (배포 후 기입)

---

## 2. 앱 형태

- **크롬 확장 팝업** (400×600px)
- 상단: 월 캘린더 뷰 (날짜 클릭 → 해당 날의 Todo)
- Todo 드래그앤드롭 → 다른 날짜로 이동
- Todo 항목마다 GitHub 버튼 → Issue 등록 / PR 연결
- 하단 고정: AI 입력창 (자연어 → Copilot SDK Tool Call)
- 우측 상단 ⚙️ → Settings (PAT + 레포 등록)

---

## 3. 기술 스택

| 레이어 | 기술 |
|---|---|
| 크롬 확장 | React + TypeScript + Vite + TailwindCSS (Manifest V3) |
| 드래그앤드롭 | @dnd-kit/core |
| Backend | NestJS + TypeScript (포트 3000) |
| AI 핵심 | @github/copilot-sdk (BYOK → Azure AI Foundry) |
| Tool Call | createTask, prioritizeTasks, decomposeTask |
| DB | Azure Cosmos DB |
| GitHub 연동 | @octokit/rest (PAT 방식) |
| 배포 | Azure Static Web App (FE) + Azure App Service (BE) |
| 시크릿 | Azure Key Vault (App Service Managed Identity) |
| 테스트 FE | Vitest |
| 테스트 BE | Jest + Supertest |
| CI/CD | GitHub Actions |

---

## 4. Copilot SDK Tool Call 목록

| Tool | 설명 |
|---|---|
| `createTask` | 자연어에서 날짜/제목 파싱 → Cosmos DB 저장 |
| `prioritizeTasks` | 미완료 Todo 분석 → 우선순위 리스트 스트리밍 |
| `decomposeTask` | 복잡한 태스크 → 서브태스크 분해 + `parentId` 저장 |

---

## 5. GitHub 연동

- **인증**: PAT (Personal Access Token) — Settings에서 1회 입력, `chrome.storage.local` 저장
- **레포**: 여러 개 등록 가능, Todo에서 레포 선택 후 Issue 등록
- **Responsible AI**: GitHub 쓰기 작업 전 반드시 확인 모달 표시

---

## 6. 에이전트 역할

| 에이전트 | 페르소나 | 담당 |
|---|---|---|
| `ai-team-producer` | **Remy** | 스프린트 계획, PR 머지, PROJECT_BRIEF 유지 |
| `ai-team-dev` | **Nova/Sage/Milo** | 기능 구현 |
| `ai-team-qa` | **Ivy** | 테스트, 버그 리포트, QA 사인오프 |

---

## 7. 현재 상태 (Remy가 업데이트)

- **현재 스프린트**: Sprint 1 대기 중
- **완료된 스프린트**: Sprint 0 ✅
- **열린 이슈**: 없음
- **마지막 업데이트**: 2026-06-20

---

## 8. 스프린트 로드맵

| 스프린트 | 목표 | 상태 | 계획 |
|---|---|---|---|
| Sprint 0 | 문서화 + 에이전트 설정 | ✅ 완료 | — |
| Sprint 1 | 스캐폴딩 + CI/CD + Azure 초기 배포 | 🔜 대기 | `docs/sprint-1/plan.md` |
| Sprint 2 | 캘린더 UI + Todo CRUD + Cosmos DB | 🔜 대기 | `docs/sprint-2/plan.md` |
| Sprint 3 | Copilot SDK AI 입력 (Tool Call + 스트리밍) ⭐ | 🔜 대기 | `docs/sprint-3/plan.md` |
| Sprint 4 | GitHub 연동 (PAT + Issue/PR) | 🔜 대기 | `docs/sprint-4/plan.md` |
| Sprint 5 | 크롬 확장 패키징 + 최종 배포 검증 | 🔜 대기 | `docs/sprint-5/plan.md` |

> ⭐ Sprint 3 = 심사 기준 1번(Copilot SDK 25%) 핵심

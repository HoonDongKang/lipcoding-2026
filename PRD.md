# PRD — Smart Task Hub

> **lipcoding-kr/lipcoding-competition-2026** 출품작  
> 버전: 1.0 | 최종 업데이트: 2026-06-20

---

## 1. 제품 개요

**Smart Task Hub**는 GitHub Copilot SDK 기반의 AI-native 개인 생산성 앱입니다.  
캘린더 뷰에서 날짜별 Todo를 관리하고, 자연어 명령으로 AI가 Todo 생성·분석·GitHub Issue 연동을 자동 처리합니다.  
Chrome 확장 팝업 형태로 동작하며 Azure 클라우드에 배포됩니다.

### 핵심 가치 제안

| 문제 | 해결 |
|------|------|
| 개발자가 할 일 → GitHub 이슈 전환에 시간 낭비 | AI가 자연어를 이슈로 자동 변환 |
| 우선순위 판단에 소요되는 인지 부하 | AI가 날짜별 미완료 태스크를 우선순위 분석 |
| 복잡한 태스크를 직접 쪼개야 하는 번거로움 | AI가 서브태스크로 자동 분해 |

---

## 2. 대상 사용자

- **1차**: 개인 프로젝트를 진행하는 개발자
- **2차**: 할 일 관리와 GitHub 이슈를 동시에 다루는 소규모 팀

---

## 3. 기능 명세

### 3.1 캘린더 & Todo CRUD

| 기능 | 설명 |
|------|------|
| 월 캘린더 뷰 | 날짜 클릭 → 해당 날 Todo 목록 표시 |
| Todo 추가 | 수동 입력 or AI 자동 생성 |
| Todo 완료 처리 | 체크박스 토글 |
| Todo 삭제 | 항목 제거 |
| Todo 이동 | 드래그앤드롭으로 다른 날짜로 이동 |
| GitHub 이슈 링크 | 이슈 생성 시 Todo에 🔗 URL 표시 |

### 3.2 AI 에이전트 (GitHub Copilot SDK)

| Tool | 트리거 예시 | 동작 |
|------|-------------|------|
| `createTask` | "내일 PR 리뷰 추가해줘" | 날짜·제목 파싱 → Cosmos DB 저장 |
| `prioritizeTasks` | "오늘 할 일 정리해줘" | 미완료 태스크 우선순위(high→medium→low) 분석 반환 |
| `decomposeTask` | "이 태스크 세부 단계로 쪼개줘" | 서브태스크 자동 생성 + parentId 연결 |
| `createGitHubIssue` | "GitHub 이슈 만들어줘" | PAT + GitHub REST API로 이슈 생성, Todo에 URL 연결 |

**스트리밍**: SSE(Server-Sent Events)로 AI 응답 토큰 실시간 표시

### 3.3 GitHub 설정 UI

- 헤더 ⚙️ 버튼 → 모달에서 PAT + Repository 입력
- `localStorage` 저장 → AI 요청 시 자동 전달
- 서버 재시작 없이 즉시 반영

### 3.4 Chrome 확장

- Manifest V3, 400×600px 팝업
- `frontend/dist/` → `chrome://extensions/` 압축 해제 로드

---

## 4. 기술 스택

### Frontend
| 항목 | 기술 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 | Vite 8 |
| 스타일 | TailwindCSS 3 |
| 드래그앤드롭 | @dnd-kit/core |
| 테스트 | Vitest |

### Backend
| 항목 | 기술 |
|------|------|
| 프레임워크 | NestJS + TypeScript |
| **AI SDK** | **@github/copilot-sdk 1.0.2 (BYOK)** |
| Tool 스키마 | Zod |
| 스트리밍 | NestJS SSE (@Sse decorator) |
| 테스트 | Jest + Supertest |

### Cloud (Azure)
| 서비스 | 용도 |
|--------|------|
| Azure Static Web App | 프론트엔드 배포 |
| Azure App Service | 백엔드 API 배포 |
| Azure Cosmos DB | Todo 데이터 (NoSQL, in-memory fallback) |
| Azure OpenAI (Sweden Central) | Copilot SDK BYOK LLM — gpt-4o |

---

## 5. 아키텍처

```
[Chrome Extension Popup]
  React + Vite + TailwindCSS
  ├── CalendarView (날짜 선택)
  ├── TaskList (Todo CRUD)
  ├── TaskInput (수동 입력)
  └── AgentInput (SSE 스트리밍 AI 채팅)
         │ GET /agent/stream?message=...&githubPat=...
         ▼
[Azure App Service — NestJS]
  ├── AgentController (@Sse /agent/stream)
  └── AgentService
        │ GitHub Copilot SDK (BYOK)
        │   CopilotClient.createSession({
        │     provider: { type: "azure", baseUrl, apiKey }
        │     tools: [createTask, prioritizeTasks,
        │             decomposeTask, createGitHubIssue]
        │   })
        │   session.on("assistant.message") → SSE token
        │   session.on("tool.execution_complete") → SSE tool_call
        │
        ├── TasksService → Azure Cosmos DB
        └── GitHub REST API (PAT 인증)

[Azure Cosmos DB]
  database: smarttaskhub / container: tasks
```

---

## 6. 심사 기준 대응

| # | 항목 (가중치) | 대응 |
|---|---------------|------|
| 1 | Effective Use of Copilot SDK (25%) | `@github/copilot-sdk` BYOK + `defineTool` + Zod 스키마 + SSE 스트리밍 |
| 2 | Productivity Impact & Problem Fit (18%) | 자연어 → Todo·GitHub Issue 자동화로 개발자 반복 작업 제거 |
| 3 | Azure AI & Cloud Integration (18%) | Azure OpenAI (Sweden Central) BYOK + App Service + Cosmos DB + SWA |
| 4 | Functionality & Technical Execution (16%) | E2E CRUD, SSE 스트리밍, Cosmos/in-memory fallback, CI/CD |
| 5 | User Experience & Workflow Design (12%) | 400×600px 팝업, 드래그앤드롭, 스트리밍 커서, 설정 모달 |
| 6 | Responsible AI, Security & Trust (6%) | 입력 sanitize, 시스템 프롬프트 분리, PAT localStorage 저장 |
| 7 | Innovation & Originality (5%) | 캘린더 + AI + GitHub 이슈를 단일 크롬 확장으로 통합 |

---

## 7. API 명세

### Tasks

| Method | Path | 설명 |
|--------|------|------|
| GET | `/tasks?date=YYYY-MM-DD` | 날짜별 Todo 조회 |
| POST | `/tasks` | Todo 생성 |
| PATCH | `/tasks/:id` | Todo 수정 (완료 토글, 이동 등) |
| DELETE | `/tasks/:id` | Todo 삭제 |

### Agent

| Method | Path | 설명 |
|--------|------|------|
| POST | `/agent/chat` | 동기 AI 응답 |
| GET | `/agent/stream` | SSE 스트리밍 AI 응답 |

#### SSE 이벤트 형식

```json
{ "type": "token",     "content": "안녕하세요..." }
{ "type": "tool_call", "toolName": "createTask", "toolResult": {...} }
{ "type": "error",     "content": "오류 메시지" }
{ "type": "done" }
```

---

## 8. 환경 변수

### Backend (`backend/.env`)

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/
AZURE_OPENAI_KEY=<key>
AZURE_OPENAI_DEPLOYMENT=gpt-4o

COSMOS_ENDPOINT=https://<account>.documents.azure.com:443/
COSMOS_KEY=<key>
COSMOS_DATABASE=smarttaskhub
COSMOS_CONTAINER=tasks

GITHUB_PAT=<personal-access-token>
GITHUB_REPO=HoonDongKang/lipcoding-2026
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:3000
```

---

## 9. 배포 URL

| 환경 | URL |
|------|-----|
| Frontend (SWA) | https://icy-bay-0df707d00.7.azurestaticapps.net |
| Backend (App Service) | https://smart-task-hub-api.azurewebsites.net |

---

## 10. 스프린트 히스토리

| 스프린트 | 내용 | PR |
|----------|------|----|
| Sprint 1 | 프로젝트 스캐폴딩, CI/CD, Azure 초기 배포 | #1~#3 |
| Sprint 2 | 캘린더 UI, Todo CRUD, Cosmos DB 연동 | #4~#5 |
| Sprint 3 | AgentInput SSE, Azure OpenAI 연동, Tool Calls | #6~#7 |
| Sprint 4 | createGitHubIssue Tool, 🔗 이슈 링크 UI | #8 |
| Sprint 5 | Chrome 확장 패키징, GitHub Settings UI | #9 |
| Sprint 5b | **@github/copilot-sdk BYOK 마이그레이션** | #10 |

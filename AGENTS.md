# AGENTS.md — Smart Task Hub

## 프로젝트 개요

**Smart Task Hub**는 GitHub Copilot SDK를 핵심으로 활용하는 AI-native Todo 웹 앱입니다.
사용자가 자연어로 할 일을 입력하면, Copilot SDK 에이전트가 의도를 파악하고 GitHub Issue/PR 연동, 우선순위 분석, 태스크 분해를 자동으로 처리합니다.

### 대회 요구사항 체크리스트

- [x] 웹 앱 (React + Node.js/NestJS)
- [x] GitHub Copilot SDK 핵심 활용
- [x] Azure 플랫폼 배포 (Azure Static Web App + Azure App Service + Azure Cosmos DB)
- [x] Azure OpenAI / Microsoft Foundry AI 모델 계층

---

## 아키텍처 개요

```
[React Frontend]
    │  자연어 입력, 스트리밍 응답 표시
    │
    ▼
[NestJS Backend]
    │
    ├── Copilot SDK Agent ──────────────────┐
    │     - 의도 파악 (멀티턴 대화)              │
    │     - Tool Call 선택 & 실행              │
    │     - 스트리밍 응답                      │
    │                                        │
    ├── Tool: create_github_issue()           │
    ├── Tool: fetch_github_prs()             │← Copilot SDK Tools
    ├── Tool: create_github_pr_comment()     │
    ├── Tool: prioritize_tasks()             │
    └── Tool: decompose_task()──────────────┘
    │
    ├── Azure OpenAI / Foundry (LLM 계층)
    └── Azure Cosmos DB (Todo 데이터)
```

### 핵심 유저 플로우

| 자연어 입력 예시               | 에이전트 동작                               |
| ------------------------------ | ------------------------------------------- |
| "로그인 버그 수정해야 해"      | GitHub Issue 자동 생성 → Todo 연결          |
| "이번 주 PR 리뷰 필요해"       | GitHub PR 목록 fetch → Todo 항목으로 변환   |
| "오늘 할 일 정리해줘"          | 미완료 Todo 분석 → 우선순위 리스트 스트리밍 |
| "이 태스크 세부 단계로 쪼개줘" | Copilot SDK 에이전트가 서브태스크로 분해    |

---

## 기술 스택

### Frontend (`frontend/`)

- **React** + TypeScript
- **Vite** (dev server, 포트 5173)
- **TailwindCSS** (UI)
- Copilot SDK 스트리밍 응답 실시간 렌더링

### Backend (`backend/`)

- **Node.js** + **NestJS** + TypeScript
- NestJS Module/Controller/Service 구조로 기능 단위 분리
- **GitHub Copilot SDK** (`@copilot/sdk`) — 에이전트 & 툴콜 핵심
- **Azure OpenAI SDK** (`@azure/openai`) — LLM 계층
- **Azure Cosmos DB SDK** (`@azure/cosmos`) — Todo 데이터 영속성
- 포트: 3000

### Cloud (Azure)

| 서비스                           | 용도                              |
| -------------------------------- | --------------------------------- |
| Azure Static Web App             | 프론트엔드 배포                   |
| Azure App Service                | 백엔드 API 배포                   |
| Azure Cosmos DB                  | Todo 데이터 (NoSQL)               |
| Azure OpenAI / Microsoft Foundry | Copilot SDK LLM 백엔드            |
| Azure Key Vault                  | GitHub Token, API Key 시크릿 관리 |

---

## 디렉토리 구조

```
lipcoding-2026/
├── frontend/
│   ├── src/
│   │   ├── api/            # 백엔드 API 호출 함수
│   │   ├── components/     # UI 컴포넌트
│   │   │   ├── TaskInput.tsx       # 자연어 입력창 (스트리밍 표시)
│   │   │   ├── TaskList.tsx        # Todo 목록
│   │   │   └── GitHubPanel.tsx     # GitHub 연동 상태 표시
│   │   ├── hooks/          # 커스텀 훅 (useStream, useTasks 등)
│   │   └── App.tsx
│   └── vite.config.ts      # /api/* → localhost:3000 프록시
│
├── backend/
│   ├── src/
│   │   ├── tasks/                  # Tasks 기능 모듈
│   │   │   ├── tasks.module.ts
│   │   │   ├── tasks.controller.ts # CRUD /api/tasks
│   │   │   ├── tasks.service.ts
│   │   │   └── task.entity.ts      # Cosmos DB Task 스키마
│   │   ├── agent/                  # Copilot SDK 에이전트 모듈
│   │   │   ├── agent.module.ts
│   │   │   ├── agent.controller.ts # POST /api/agent (스트리밍 진입점)
│   │   │   ├── agent.service.ts    # Copilot SDK 에이전트 초기화
│   │   │   └── tools/
│   │   │       ├── github.tool.ts      # GitHub API 툴콜 구현
│   │   │       └── task-ops.tool.ts    # 우선순위/분해 툴콜 구현
│   │   ├── github/                 # GitHub 연동 모듈
│   │   │   ├── github.module.ts
│   │   │   └── github.service.ts
│   │   └── app.module.ts           # 루트 모듈
│   └── .env.example
│
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
│       └── deploy.yml      # Azure 배포 CI/CD
│
└── AGENTS.md               # 이 파일
```

---

## Copilot SDK 구현 가이드

### 에이전트 초기화 (`backend/src/agent/agent.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { CopilotAgent } from '@copilot/sdk';
import { GithubTool } from './tools/github.tool';
import { TaskOpsTool } from './tools/task-ops.tool';

@Injectable()
export class AgentService {
  private agent: CopilotAgent;

  constructor(
    private readonly githubTool: GithubTool,
    private readonly taskOpsTool: TaskOpsTool,
  ) {
    this.agent = new CopilotAgent({
      model: process.env.AZURE_OPENAI_DEPLOYMENT, // Azure OpenAI / Foundry
      tools: [...githubTool.definitions, ...taskOpsTool.definitions],
      systemPrompt: `
        당신은 개인 생산성 도우미입니다. 사용자의 할 일을 관리하고,
        필요하면 GitHub Issue/PR과 연동합니다.
        항상 한국어로 응답하세요.
      `,
      streaming: true,
    });
  }

  streamAgent(messages: any[], userId: string) {
    return this.agent.stream({ messages, context: { userId } });
  }
}
```

### Tool Call 예시 (`backend/src/agent/tools/github.tool.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { GithubService } from '../../github/github.service';

@Injectable()
export class GithubTool {
  constructor(private readonly githubService: GithubService) {}

  get definitions() {
    return [
      {
        name: 'create_github_issue',
        description: '사용자의 태스크를 GitHub Issue로 생성합니다',
        parameters: {
          title: { type: 'string', description: '이슈 제목' },
          body: { type: 'string', description: '이슈 본문' },
          labels: { type: 'array', items: { type: 'string' } },
        },
        execute: ({ title, body, labels }) =>
          this.githubService.createIssue({ title, body, labels }),
      },
      {
        name: 'fetch_github_prs',
        description: '현재 열린 GitHub PR 목록을 가져옵니다',
        parameters: {},
        execute: () => this.githubService.fetchOpenPRs(),
      },
    ];
  }
}
```

### 스트리밍 API 엔드포인트 (`backend/src/agent/agent.controller.ts`)

```typescript
import { Controller, Post, Body, Res, Request } from '@nestjs/common';
import { Response } from 'express';
import { AgentService } from './agent.service';

@Controller('api/agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  // POST /api/agent — SSE 스트리밍 응답
  @Post()
  async stream(@Body() body: { messages: any[] }, @Request() req, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');

    const stream = this.agentService.streamAgent(body.messages, req.user.id);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.end();
  }
}
```

---

## 환경 변수

### `backend/.env.example`

```env
# Azure OpenAI / Microsoft Foundry
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<your-key>
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure Cosmos DB
COSMOS_ENDPOINT=https://<your-account>.documents.azure.com:443/
COSMOS_KEY=<your-key>
COSMOS_DATABASE=smarttaskhub
COSMOS_CONTAINER=tasks

# GitHub OAuth App
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>
GITHUB_TOKEN=<your-personal-access-token>   # 개발용

# App
PORT=3000
FRONTEND_URL=http://localhost:5173
```

> **⚠️ 모든 시크릿은 Azure Key Vault에서 관리. 코드에 직접 커밋 금지.**

---

## 빌드 & 실행

### Frontend (`frontend/`)

```bash
npm install
npm run dev          # 개발 서버 (포트 5173)
npm run build        # 프로덕션 빌드
npm test             # 전체 테스트
npm test -- --testPathPattern=<파일명>  # 단일 파일 테스트
npm run lint
```

### Backend (`backend/`)

```bash
npm install
npm run start:dev    # 개발 서버 watch 모드 (포트 3000)
npm run build        # 프로덕션 빌드
npm run start:prod   # 프로덕션 서버
npm test             # 전체 테스트
npm test -- <파일명>  # 단일 파일 테스트
npm run lint
```

---

## Responsible AI 체크리스트

- [ ] GitHub Issue/PR 생성 전 **사용자 확인 UI** 표시 (자동 실행 금지)
- [ ] AI 응답에 **"AI가 생성한 내용입니다"** 레이블 표시
- [ ] GitHub Token은 필요한 최소 scope만 요청 (`repo`, `issues`)
- [ ] 프롬프트 인젝션 방어: 사용자 입력을 시스템 프롬프트에 직접 삽입 금지
- [ ] 에러 발생 시 원인을 사용자에게 명확히 표시 (할루시네이션 최소화)

---

## 개발 우선순위 (MVP → 데모)

### Phase 1 — MVP

1. Todo CRUD (로컬 Cosmos DB 연결)
2. Copilot SDK 에이전트 기본 연결 (자연어 → Todo 생성)
3. 스트리밍 응답 UI

### Phase 2 — GitHub 연동

4. GitHub OAuth 로그인
5. `create_github_issue` 툴 구현
6. `fetch_github_prs` → Todo 변환

### Phase 3 — AI 심화

7. 태스크 우선순위 분석 (`prioritize_tasks` 툴)
8. 태스크 분해 (`decompose_task` 툴)

### Phase 4 — 배포

9. Azure 배포 (Static Web App + App Service)
10. GitHub Actions CI/CD 파이프라인

# Copilot Instructions

## Project Overview

This is a fullstack web application monorepo with a React frontend and Node.js/NestJS backend.

## Repository Structure

```
lipcoding-2026/
├── frontend/        # React app
└── backend/         # Node.js/NestJS API
```

## Build, Test & Lint Commands

### Frontend (`frontend/`)

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run all tests
npm test -- --testPathPattern=<file>  # Run a single test file
npm run lint         # Lint
```

### Backend (`backend/`)

```bash
npm run start:dev    # Start dev server (watch mode)
npm run build        # Production build
npm run start:prod   # Start production server
npm test             # Run all tests
npm test -- <file>   # Run a single test file
npm run lint         # Lint
```

## Architecture

- **frontend/**: React SPA. API calls go to the backend via a proxy (configured in `vite.config.js` or `package.json`).
- **backend/**: NestJS REST API. Controllers in `src/**/*.controller.ts`, business logic in `src/**/*.service.ts`, modules in `src/**/*.module.ts`, DB entities in `src/**/*.entity.ts`.
- Frontend and backend run on separate ports in development (frontend: 5173, backend: 3000).

## Collaboration Style

- **작업 전 반드시 계획 먼저 제안하고 승인을 받은 후 실행한다.** 요청을 받으면 바로 실행하지 말고, 무엇을 어떻게 할지 먼저 설명하고 사용자의 확인을 받는다.
- 계획 제안 시 포함할 내용: 작업 범위, 접근 방식, 예상 결과물, 조정이 필요한 부분
- 사용자가 명시적으로 "진행해줘" / "해줘"라고 확인한 후에만 실행한다.

## Key Conventions

_Update this section as patterns emerge in the codebase._

- API base path: `/api/v1/...` (update when confirmed)
- Environment variables: frontend uses `VITE_` prefix; backend uses `.env` at project root
- Keep frontend API calls in a dedicated `src/api/` or `src/services/` directory
- NestJS: feature별로 Module/Controller/Service 묶음으로 구성 (`tasks/tasks.module.ts`, `tasks/tasks.controller.ts`, `tasks/tasks.service.ts`)
- NestJS 라우트는 Controller 데코레이터 기반 (`@Get()`, `@Post()` 등); Express 스타일 Router 사용 안 함
- DI(의존성 주입)는 NestJS 내장 컨테이너 사용; 직접 인스턴스화 금지

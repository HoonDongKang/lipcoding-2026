# Sprint 1 — Progress

**Branch:** feature/sprint-1  
**Started:** 2026-06-20  
**Status:** 🔄 In Progress

---

## Phase 1 — Backend Scaffolding (Sage) ✅
- [x] NestJS scaffolded with `@nestjs/cli` (Node 20, npm)
- [x] `@nestjs/config` installed, `ConfigModule.forRoot({ isGlobal: true })` added to AppModule
- [x] `HealthController` → `GET /health` → `{ status: 'ok', timestamp }`
- [x] CORS configured in `main.ts` using `FRONTEND_URL` env var (fallback: `http://localhost:5173`)
- [x] `backend/.env.example` created with all required keys (no real values)
- [x] Jest confirmed present (NestJS default)

## Phase 2 — Frontend Scaffolding (Nova) ✅
- [x] React + Vite + TypeScript scaffolded
- [x] `npm install` complete
- [x] TailwindCSS v3 installed and configured (`tailwind.config.js`, `postcss.config.js`)
- [x] Tailwind directives added to `src/index.css`
- [x] Chrome Extension `public/manifest.json` (Manifest V3) created
- [x] `vite.config.ts` updated: rollup input, dev proxy, vitest config
- [x] `frontend/.env.example` created
- [x] `src/App.tsx` replaced with 400×600px shell component
- [x] Vitest + @testing-library/react + jsdom installed
- [x] `src/test/setup.ts` created
- [x] `src/App.test.tsx` created
- [x] `"test": "vitest run"` added to `package.json`
- [x] `staticwebapp.config.json` created

## Phase 3 — Git Setup ✅
- [x] `git init` at project root
- [x] `feature/sprint-1` branch created
- [x] `.gitignore` created

## Phase 4 — CI/CD Workflows ✅
- [x] `.github/workflows/ci.yml` — PR checks (backend + frontend tests + lint)
- [x] `.github/workflows/deploy-backend.yml` — push to main → Azure App Service
- [x] `.github/workflows/deploy-frontend.yml` — push to main → Azure Static Web App

## Phase 5 — Azure & Docs ✅
- [x] `docs/sprint-1/azure-setup.sh` — all `az` commands for user to run manually
- [x] `README.md` created with local dev setup instructions

---

## Decisions Made
- NestJS CLI placed backend at wrong path (lowercase macOS path issue) → moved to correct location manually
- TailwindCSS v3 specified explicitly to avoid v4 breaking changes
- Azure provisioning skipped in-shell (permission issues) → written to `azure-setup.sh` for manual execution

## Blockers
- None

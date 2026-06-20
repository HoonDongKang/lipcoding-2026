# Sprint 1 — 스캐폴딩 + CI/CD + Azure 초기 배포

**목표:** 코드 한 줄 없이도 Azure에 배포되는 파이프라인을 먼저 확보한다. 이후 모든 스프린트는 main 머지 즉시 자동 배포된다.

**기간:** 1–2일 | **의존성:** 없음

---

## ✅ 성공 기준

- [ ] `frontend/` → localhost:5173 정상 실행
- [ ] `backend/` → localhost:3000 정상 실행, `GET /health` → `{ status: 'ok' }`
- [ ] 크롬 확장 팝업으로 로드 가능 (manifest.json)
- [ ] GitHub Actions → main push 시 Azure 자동 배포
- [ ] Azure Static Web App (FE) + Azure App Service (BE) 모두 HTTPS로 접근 가능
- [ ] ESLint + Vitest(FE) + Jest(BE) CI에서 통과
- [ ] `.env.example` 커밋, 실제 시크릿은 Azure Key Vault

---

## 📋 태스크

| # | 태스크 | 담당 | 크기 |
|---|--------|------|------|
| 1 | `nest new backend --package-manager npm` 스캐폴딩 | Sage | S |
| 2 | `@nestjs/config` 설치, `ConfigModule.forRoot({ isGlobal: true })` | Sage | S |
| 3 | `HealthController` → `GET /health` → `{ status: 'ok', timestamp }` | Sage | S |
| 4 | CORS 설정 (`FRONTEND_URL` env var 기반) | Sage | S |
| 5 | `backend/.env.example` 전체 env key 작성 (값 비움) | Sage | S |
| 6 | Jest + Supertest 기본 설정 확인 (NestJS 기본 제공) | Sage | S |
| 7 | `npm create vite@latest frontend -- --template react-ts` | Nova | S |
| 8 | TailwindCSS v3 설치 및 설정 (tailwind.config.js, postcss) | Nova | S |
| 9 | 크롬 확장 `manifest.json` 작성 (Manifest V3, popup 설정) | Nova | S |
| 10 | `vite.config.ts` → 크롬 확장 빌드 설정 (`crx` 또는 `rollup` 멀티 엔트리) | Nova | M |
| 11 | `frontend/.env.example` → `VITE_API_URL=http://localhost:3000` | Nova | S |
| 12 | Vitest 설치 및 기본 설정 | Nova | S |
| 13 | Azure Static Web App 프로비저닝 | Sage | M |
| 14 | Azure App Service 프로비저닝 (Node 20, Linux) | Sage | M |
| 15 | Azure Key Vault 프로비저닝, App Service Managed Identity 연결 | Sage | M |
| 16 | `.github/workflows/deploy-frontend.yml` 작성 | Nova | M |
| 17 | `.github/workflows/deploy-backend.yml` 작성 | Sage | M |
| 18 | `staticwebapp.config.json` SPA 라우팅 설정 | Nova | S |
| 19 | `README.md` 로컬 개발 환경 설정 방법 작성 | Milo | S |

---

## 🤖 Dev Team 실행 프롬프트

```
PROJECT_BRIEF.md와 docs/sprint-1/plan.md를 읽어라.

브랜치: git checkout -b feature/sprint-1

순서:
1. Sage: backend 스캐폴딩 (태스크 1-6) → 커밋
2. Nova: frontend 스캐폴딩 + 크롬 확장 설정 (태스크 7-12) → 커밋
3. Sage + Nova: Azure 프로비저닝 + CI/CD 파이프라인 (태스크 13-18) → 커밋
4. Milo: README 작성 → 커밋

검증: GitHub Actions 실행 확인, Azure URL HTTPS 접근 확인
완료 후: PR 생성, docs/sprint-1/done.md 작성
```

# Sprint 1 — Done ✅

**Completed:** 2026-06-20  
**Branch:** feature/sprint-1  
**Commit:** Initial scaffolding commit

---

## 완료된 작업 요약

### 🔧 Backend (Sage)
| 태스크 | 상태 |
|--------|------|
| NestJS 스캐폴딩 (`npm`, `--skip-git`) | ✅ |
| `@nestjs/config` 설치 + `ConfigModule.forRoot({ isGlobal: true })` | ✅ |
| `HealthController` → `GET /health` → `{ status, timestamp }` | ✅ |
| CORS 설정 (`FRONTEND_URL` env var, fallback `http://localhost:5173`) | ✅ |
| `backend/.env.example` (모든 키, 빈 값) | ✅ |
| Jest 기본 설정 확인 (NestJS 기본 제공) | ✅ |

### 🎨 Frontend (Nova + Milo)
| 태스크 | 상태 |
|--------|------|
| React + Vite + TypeScript 스캐폴딩 | ✅ |
| TailwindCSS v3 설치 및 설정 | ✅ |
| Chrome Extension `manifest.json` (Manifest V3) | ✅ |
| `vite.config.ts` — rollup input + dev proxy + vitest config | ✅ |
| `frontend/.env.example` | ✅ |
| `src/App.tsx` 셸 컴포넌트 (400×600px, TailwindCSS) | ✅ |
| Vitest + @testing-library/react 설치 | ✅ |
| `src/App.test.tsx` 기본 테스트 | ✅ |
| `staticwebapp.config.json` SPA 라우팅 설정 | ✅ |

### 🔗 CI/CD
| 파일 | 상태 |
|------|------|
| `.github/workflows/ci.yml` | ✅ |
| `.github/workflows/deploy-backend.yml` | ✅ |
| `.github/workflows/deploy-frontend.yml` | ✅ |

### ☁️ Azure 설정
| 항목 | 상태 |
|------|------|
| `docs/sprint-1/azure-setup.sh` (수동 실행 스크립트) | ✅ |

### 📄 문서
| 파일 | 상태 |
|------|------|
| `README.md` (로컬 개발 환경 설정) | ✅ |
| `docs/sprint-1/progress.md` | ✅ |

---

## 테스트 결과
```
Frontend: 1/1 tests passed ✅ (vitest run)
Backend:  1/1 tests passed ✅ (jest)
Frontend build: ✅ (tsc + vite build)
Backend build:  ✅ (nest build)
```

---

## 남은 작업 (사용자가 수동으로 실행 필요)
1. **GitHub 레포 생성**: https://github.com/new
2. **Azure 프로비저닝**: `bash docs/sprint-1/azure-setup.sh`
3. **GitHub Secrets 등록**:
   - `AZURE_APP_SERVICE_NAME`
   - `AZURE_WEBAPP_PUBLISH_PROFILE`
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - `VITE_API_URL`
4. **git remote 설정**: `git remote add origin <repo-url>`
5. **PR 머지**: Remy가 처리

---

## 주요 결정사항
- NestJS CLI가 소문자 경로에 생성하는 버그 → 수동으로 올바른 경로로 이동
- `vite.config.ts`에서 `defineConfig`를 `vitest/config`에서 import → Vite + Vitest 타입 병합
- 테스트 파일은 `tsconfig.app.json`의 `exclude`로 프로덕션 빌드에서 제외
- Azure provisioning은 권한 문제로 in-shell 실행 불가 → `azure-setup.sh`에 기록

# Sprint 5 — 크롬 확장 패키징 + 최종 배포 검증

**목표:** 완성된 앱을 크롬 확장 .zip으로 패키징하고, Azure 프로덕션 환경에서 전체 흐름을 검증한다.

**기간:** 1–2일 | **의존성:** Sprint 1–4 완료

---

## ✅ 성공 기준

- [ ] `npm run build:extension` → `dist-extension/` 생성
- [ ] 크롬 `chrome://extensions` → "압축 해제된 확장 프로그램 로드" → 정상 동작
- [ ] 프로덕션 Azure 백엔드 URL로 API 호출 정상
- [ ] 전체 E2E 시나리오 수동 검증:
  - [ ] 캘린더 날짜 클릭 → Todo 표시
  - [ ] Todo 드래그앤드롭 → 날짜 이동
  - [ ] AI 입력 → 스트리밍 → Todo 생성
  - [ ] GitHub Issue 생성 → 확인 모달 → Issue URL 표시
- [ ] `GET /health` 프로덕션 URL 정상
- [ ] 모든 시크릿 Azure Key Vault 경유 확인
- [ ] 최종 `README.md` — 크롬 확장 설치 방법 + 프로덕션 URL 업데이트

---

## 📋 태스크

| # | 태스크 | 담당 | 크기 |
|---|--------|------|------|
| 1 | `vite.config.ts` 크롬 확장 빌드 최종 검증 (manifest.json 포함) | Nova | M |
| 2 | `package.json` `build:extension` 스크립트 추가 | Nova | S |
| 3 | 프로덕션 `VITE_API_URL` Azure App Service URL로 설정 | Nova | S |
| 4 | 백엔드 Key Vault 시크릿 로드 최종 검증 (`@azure/keyvault-secrets`) | Sage | M |
| 5 | 프로덕션 CORS Azure Static Web App URL 허용 확인 | Sage | S |
| 6 | GitHub Actions deploy 파이프라인 최종 실행 확인 | Sage | M |
| 7 | 크롬 확장 로컬 로드 테스트 → 팝업 UI 전체 점검 | Nova | M |
| 8 | E2E 수동 시나리오 전체 검증 (위 성공 기준 체크리스트) | Nova + Sage | M |
| 9 | Responsible AI 최종 감사: AI 배지, 확인 모달 프로덕션 동작 확인 | Milo | S |
| 10 | 팝업 UI 최종 폴리싱 (여백, 폰트, 색상 일관성) | Milo | M |
| 11 | `README.md` 크롬 확장 설치 가이드 + 프로덕션 URL 업데이트 | Milo | S |
| 12 | `PROJECT_BRIEF.md` 섹션 7+8 최종 업데이트 | Sage | S |

---

## 🤖 Dev Team 실행 프롬프트

```
PROJECT_BRIEF.md와 docs/sprint-5/plan.md를 읽어라.

브랜치: git checkout -b feature/sprint-5

순서:
1. Nova: 크롬 확장 빌드 설정 → 로컬 로드 테스트 → E2E 시나리오 검증 → 커밋
2. Sage: Key Vault + CORS + CI/CD 최종 확인 → 커밋
3. Milo: Responsible AI 감사 + UI 폴리싱 + README 업데이트 → 커밋

검증: 크롬 확장 설치 → 전체 시나리오 동작 확인
완료 후: PR 생성, docs/sprint-5/done.md 작성, PROJECT_BRIEF.md 업데이트
```

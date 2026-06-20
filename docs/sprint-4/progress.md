# Sprint 4 — Progress

**브랜치:** main (직접 작업)
**날짜:** 2026-06-20

---

## ✅ 완료된 작업

### Sage — 백엔드

#### `@github/copilot-sdk` 패키지 조사
- **결과:** `@github/copilot-sdk@1.x`는 GitHub Copilot CLI JSON-RPC 제어용 SDK로,
  BYOK LLM 패턴을 노출하지 않음.
- **결정:** 기존 Azure OpenAI 직접 호출 유지 + GitHub REST API로 이슈 생성 구현
  (plan의 fallback 경로)

#### `createGitHubIssue` Tool 추가 (`backend/src/agent/agent.service.ts`)
- `TOOLS` 배열에 `createGitHubIssue` function tool 추가
- `executeCreateGitHubIssue()` 메서드 구현:
  - `GITHUB_PAT` env var 없으면 안전 에러 메시지 반환
  - `https://api.github.com/repos/{owner}/{repo}/issues` POST 호출
  - 이슈 생성 성공 시 `taskId`가 있으면 `tasksService.update()` → `githubIssueUrl` 저장
  - 에러 케이스(네트워크, API 오류) 모두 처리
- `dispatchTool()` switch에 `createGitHubIssue` case 추가
- `SYSTEM_PROMPT` 업데이트: createGitHubIssue 도구 안내 + 규칙 추가

#### 환경변수 준비 (코드 레벨)
- `GITHUB_PAT`: GitHub Personal Access Token (repo 권한)
- `GITHUB_REPO`: 대상 레포 (default: `HoonDongKang/lipcoding-2026`)
- **실제 등록**: 사용자가 Azure App Service 환경변수에 추가 필요

---

### Nova — 프론트엔드

#### `TaskItem.tsx` GitHub Issue 링크
- `task.githubIssueUrl` 있으면 `🔗 #` 뱃지 렌더링
- `target="_blank" rel="noopener noreferrer"` 보안 설정
- `onClick e.stopPropagation()` 으로 부모 이벤트 버블링 차단
- 기존 뱃지 스타일 패턴과 일관성 유지

---

### 빌드/린트

| 항목 | 결과 |
|------|------|
| `backend npm run lint` | ✅ 0 에러 |
| `frontend npm run lint` | ✅ 0 에러 |
| `backend npm run build` | ✅ 성공 |
| `frontend npm run build` | ✅ 성공 (274KB JS gzip 86KB) |

---

## 📋 남은 작업 (plan.md 기준)

Sprint 4 full scope 중 이번 커밋 범위:
- ✅ `createGitHubIssue` tool (Sage)
- ✅ `TaskItem` GitHub 링크 UI (Nova/Milo)
- 🔜 GithubModule / GithubService (`@octokit/rest` 기반) — 별도 구현 예정
- 🔜 Settings 화면 (PAT + 레포 등록) — 별도 구현 예정
- 🔜 ConfirmationModal — 별도 구현 예정

---

## 🔑 배포 체크리스트 (사용자 액션 필요)

Azure App Service → 환경변수 추가:
```
GITHUB_PAT=<GitHub Personal Access Token, repo 권한>
GITHUB_REPO=HoonDongKang/lipcoding-2026
```

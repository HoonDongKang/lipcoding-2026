# Sprint 4 — GitHub 연동 (PAT + 레포 설정 + Issue/PR)

**목표:** Settings에서 PAT와 레포를 등록하고, Todo 항목에서 GitHub Issue 생성 및 PR 연결을 할 수 있다.

**기간:** 2–3일 | **의존성:** Sprint 3 완료

---

## ✅ 성공 기준

- [ ] Settings 화면: PAT 입력 + 레포 여러 개 등록/선택 + "연결 테스트" 버튼
- [ ] PAT + 레포 목록 `chrome.storage.local`에 저장
- [ ] Todo 항목 GitHub 버튼 클릭 → 레포 선택 드롭다운 → Issue 등록
- [ ] Issue 등록 전 **확인 모달** 표시 (Responsible AI)
- [ ] 등록된 Issue URL이 TodoItem에 링크로 표시
- [ ] GitHub PR 목록 fetch → Todo로 변환 (선택적)
- [ ] GithubService 단위 테스트 (Octokit mock)
- [ ] 에러 처리: 잘못된 PAT, 레포 없음, API rate limit

---

## 📋 태스크

| # | 태스크 | 담당 | 크기 |
|---|--------|------|------|
| 1 | `@octokit/rest` 설치 | Sage | S |
| 2 | `GithubModule` / `GithubService` — PAT 기반 Octokit 클라이언트 | Sage | M |
| 3 | `GithubService.createIssue(owner, repo, title, body)` 구현 | Sage | M |
| 4 | `GithubService.fetchPRs(owner, repo)` 구현 | Sage | M |
| 5 | `POST /github/issues` 엔드포인트 (확인 후 실행) | Sage | M |
| 6 | `GET /github/prs` 엔드포인트 | Sage | S |
| 7 | GithubService 단위 테스트 (Octokit mock) | Sage | M |
| 8 | `frontend/src/api/github.ts` — PAT/레포 설정 저장, Issue/PR API 호출 | Nova | S |
| 9 | `Settings` 화면 컴포넌트 — PAT 입력, 레포 추가/삭제/선택, 연결 테스트 | Nova | L |
| 10 | `chrome.storage.local` 유틸 — PAT + 레포 목록 저장/조회 | Nova | S |
| 11 | `TodoItem` GitHub 버튼 — 클릭 시 레포 선택 드롭다운 표시 | Nova | M |
| 12 | `ConfirmationModal` — "이 Issue를 등록하시겠습니까?" 확인/취소 | Nova | M |
| 13 | Issue 등록 성공 후 `githubIssueUrl` TaskItem에 링크 표시 | Nova | S |
| 14 | PR fetch → Todo 변환 UI (선택적 import) | Nova | M |
| 15 | 에러 상태 처리 UI (잘못된 PAT, 레포 없음 메시지) | Nova | S |
| 16 | Settings, ConfirmationModal Vitest 테스트 | Nova | M |
| 17 | Settings 화면 스타일, GitHub 아이콘, 링크 색상 처리 | Milo | S |

---

## 🤖 Dev Team 실행 프롬프트

```
PROJECT_BRIEF.md와 docs/sprint-4/plan.md를 읽어라.

브랜치: git checkout -b feature/sprint-4

중요: GitHub 쓰기 작업(Issue 생성)은 반드시 ConfirmationModal 확인 후 실행
PAT는 chrome.storage.local에만 저장, 백엔드에 전송 시 HTTPS로만

순서:
1. Sage: GithubModule → createIssue/fetchPRs → 엔드포인트 → 테스트 → 커밋
2. Nova: chrome.storage 유틸 → Settings 화면 → GitHub 버튼 → ConfirmationModal → 테스트 → 커밋
3. Milo: 스타일링 → 커밋

검증: PAT 등록 → 레포 선택 → Todo에서 Issue 생성 → GitHub에서 Issue 확인
완료 후: PR 생성, docs/sprint-4/done.md 작성
```

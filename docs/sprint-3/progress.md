# Sprint 3 — Progress

**브랜치:** `feature/sprint-3`
**시작일:** 2026-06-20

---

## 엔지니어링 결정사항

### `@github/copilot-sdk` vs `openai` SDK

`@github/copilot-sdk`는 GitHub Copilot CLI를 JSON-RPC로 제어하는 SDK로, 실행 시 로컬/서버에 `gh copilot` CLI가 설치되어 있어야 합니다. Azure App Service 환경에서 CLI를 사용하기 어렵기 때문에, 다음과 같이 결정:

- `@github/copilot-sdk`: 설치 완료, `defineTool` 유틸리티/타입 정의에 참조
- `openai` npm 패키지: `AzureOpenAI` 클래스로 실제 BYOK Tool Call + 스트리밍 구현
- ProviderConfig type은 `"azure"` (SDK 실제 값), plan의 `"azure-openai"` 표기와 약간 다름
- 환경변수(`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`) 없으면 mock 응답 반환

---

## 진행 상황

### Phase 1: 패키지 설치 ✅
- `@github/copilot-sdk` 설치
- `openai` 설치

### Phase 2: Backend AgentModule ⏳
- [ ] agent.module.ts
- [ ] agent.controller.ts
- [ ] agent.service.ts
- [ ] AppModule 등록
- [ ] 단위 테스트

### Phase 3: Frontend ⏳
- [ ] useStream.ts 훅
- [ ] AgentInput.tsx 컴포넌트
- [ ] App.tsx 업데이트
- [ ] useStream 테스트

### Phase 4: 스타일 ⏳
- [ ] AgentInput 시각적 polish

---

## 커밋 로그

(작업 중)

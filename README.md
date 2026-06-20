# Smart Task Hub

AI-native 캘린더 Todo 크롬 확장 앱. GitHub Copilot SDK + Azure AI Foundry + Cosmos DB.

## 로컬 개발 환경 설정

### 필수 조건
- Node.js 20+
- Azure CLI (`az login` 완료)

### Backend
```bash
cd backend
cp .env.example .env
# .env 파일에 실제 값 입력
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 크롬 확장 빌드 & 로드
```bash
cd frontend
npm run build
# chrome://extensions → 개발자 모드 → 압축 해제된 확장 프로그램 로드 → frontend/dist 선택
```

## Azure 초기 설정
```bash
bash docs/sprint-1/azure-setup.sh
```

## 배포 URL
- Frontend: (배포 후 기입)
- Backend: (배포 후 기입)

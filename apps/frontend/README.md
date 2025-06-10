# TaskFlow Frontend

TaskFlow 업무 관리 시스템의 프론트엔드 애플리케이션입니다.

## 기능

- ✅ **사용자 인증**: JWT 기반 로그인/회원가입
- ✅ **대시보드**: JIRA 스타일의 칸반 보드
- ✅ **그룹 관리**: 그룹 생성, 편집, 삭제
- ✅ **실시간 UI**: 반응형 디자인 및 모던 UX
- ✅ **검색 기능**: 태스크 및 그룹 검색
- ✅ **접근성**: 키보드 네비게이션 및 스크린 리더 지원

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS Variables
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Form Handling**: React Hook Form + Zod

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음을 설정:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=TaskFlow
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 주요 페이지

### 로그인 페이지 (`/login`)
- 이메일/비밀번호 로그인
- 데모 계정: `admin@taskflow.com` / `password`

### 대시보드 (`/dashboard`)
- 칸반 스타일 태스크 보드
- 태스크 상세 모달
- 실시간 검색 및 필터링

### 그룹 관리 (`/groups`)
- 그룹 생성/편집/삭제
- 권한 기반 접근 제어
- 통계 대시보드

## 디자인 시스템

### 색상 팔레트 (Atlassian 기반)
```css
--color-primary: #0052CC
--color-background-neutral: #FAFBFC
--color-background-card: #FFFFFF
--color-text-primary: #172B4D
--color-border: #DFE1E6
```

### 간격 시스템 (8px Grid)
```css
--space-100: 8px
--space-200: 16px
--space-300: 24px
--space-400: 32px
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── dashboard/         # 대시보드 페이지
│   ├── groups/            # 그룹 관리 페이지
│   ├── login/             # 로그인 페이지
│   ├── globals.css        # 글로벌 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지
├── lib/                   # 유틸리티 및 설정
│   └── api.ts            # API 클라이언트
├── store/                 # 상태 관리
│   ├── auth.ts           # 인증 상태
│   └── groups.ts         # 그룹 상태
└── styles/               # 스타일 파일
    └── globals.css       # 글로벌 CSS
```

## API 연동

백엔드 API와의 연동을 위한 클라이언트 설정:

```typescript
// lib/api.ts
export const authAPI = {
  login: (email: string, password: string) => 
    apiClient.post('/auth/login', { email, password }),
  
  getProfile: () => 
    apiClient.get('/auth/profile'),
};

export const groupAPI = {
  getGroups: () => 
    apiClient.get('/groups'),
  
  createGroup: (data) => 
    apiClient.post('/groups', data),
};
```

## 주요 컴포넌트

### TaskCard
- 개별 태스크 카드 컴포넌트
- 드래그 앤 드롭 지원
- 우선순위 및 담당자 표시

### KanbanColumn
- 칸반 보드의 컬럼 컴포넌트
- 태스크 상태별 그룹화
- 태스크 카운트 표시

### TaskModal
- 태스크 상세 편집 모달
- 폼 검증 및 상태 관리
- 키보드 접근성 지원

## 스타일링 가이드

### CSS 변수 사용
```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: var(--space-100) var(--space-200);
  border-radius: var(--radius-medium);
}
```

### 반응형 디자인
```css
@media (max-width: 768px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
}
```

## 개발 가이드라인

### 코딩 스타일
- TypeScript 엄격 모드 사용
- 함수형 컴포넌트 선호
- Named exports 사용
- 명확한 인터페이스 정의

### 폴더 명명 규칙
- kebab-case for directories
- PascalCase for components
- camelCase for functions and variables

### 접근성
- ARIA 라벨 및 역할 정의
- 키보드 네비게이션 지원
- 의미있는 HTML 구조
- 색상 대비 준수

## 성능 최적화

### 코드 분할
- 페이지별 자동 코드 분할
- 동적 import 사용
- React.lazy 컴포넌트

### 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP 포맷 선호
- 지연 로딩 적용

## 배포

### Production 빌드
```bash
npm run build
npm run start
```

### 환경별 설정
- Development: `.env.local`
- Production: 환경 변수 설정

## 향후 계획

- [ ] PWA 지원
- [ ] 다크 테마
- [ ] 다국어 지원 (i18n)
- [ ] 실시간 알림 (WebSocket)
- [ ] 오프라인 지원

## 문제 해결

### 일반적인 이슈

1. **API 연결 실패**
   - 백엔드 서버 실행 확인
   - CORS 설정 확인
   - 환경 변수 확인

2. **스타일이 적용되지 않음**
   - CSS 변수 정의 확인
   - Tailwind 설정 확인
   - 빌드 후 재시작

3. **타입 에러**
   - 인터페이스 정의 확인
   - 타입 import 확인
   - TypeScript 버전 확인

## 기여하기

1. 이슈 생성 또는 기존 이슈 확인
2. 개발 브랜치 생성
3. 코딩 가이드라인 준수
4. 테스트 작성 및 실행
5. Pull Request 생성

## 라이선스

MIT License 
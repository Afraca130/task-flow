# TaskFlow - 업무 진행 관리 시스템

TaskFlow는 효율적인 업무 진행 관리를 위한 현대적인 웹 애플리케이션입니다. NestJS 백엔드와 Next.js 프론트엔드로 구성된 풀스택 애플리케이션입니다.

## 🏗️ 프로젝트 구조

```
taskflow/
├── apps/
│   ├── backend/          # NestJS API 서버
│   │   ├── src/
│   │   │   ├── domain/           # 도메인 레이어 (엔티티, 값 객체)
│   │   │   ├── application/      # 애플리케이션 레이어 (유스케이스, 서비스)
│   │   │   ├── infrastructure/   # 인프라 레이어 (리포지토리, 외부 서비스)
│   │   │   └── presentation/     # 프레젠테이션 레이어 (컨트롤러, DTO)
│   │   └── package.json
│   └── frontend/         # Next.js 클라이언트
│       ├── src/
│       │   ├── app/             # App Router 페이지
│       │   ├── components/      # 재사용 가능한 컴포넌트
│       │   ├── lib/            # 유틸리티 함수
│       │   ├── hooks/          # 커스텀 훅
│       │   └── types/          # TypeScript 타입 정의
│       └── package.json
└── package.json          # 모노레포 루트 설정
```

## 🚀 기술 스택

### 백엔드 (NestJS)

- **Framework**: NestJS v10
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Architecture**: Clean Architecture 패턴

### 프론트엔드 (Next.js)

- **Framework**: Next.js v14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI + Radix UI
- **State Management**: Nuqs (URL state)
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios

## 📋 주요 기능

- ✅ **작업 관리**: 작업 생성, 할당, 상태 추적
- 👥 **팀 협업**: 실시간 협업 도구
- 📊 **진행 추적**: 프로젝트 진행 상황 시각화
- 🔐 **사용자 인증**: JWT 기반 보안 인증
- 📱 **반응형 디자인**: 모바일 우선 UI/UX

## 🛠️ 설치 및 실행

### 전체 설치

```bash
# 루트 디렉토리에서 모든 의존성 설치
npm install

# 백엔드 및 프론트엔드 의존성 설치
npm run install:all
```

### 개발 환경 실행

```bash
# 백엔드와 프론트엔드 동시 실행
npm run dev

# 개별 실행
npm run dev:backend    # 백엔드만 실행 (포트 3001)
npm run dev:frontend   # 프론트엔드만 실행 (포트 3000)
```

### 환경 설정

#### 백엔드 환경 변수

`apps/backend/env.example`을 참조하여 `.env` 파일을 생성하세요:

```env
# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=taskflow
DB_PASSWORD=taskflow
DB_DATABASE=taskflow



# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
```

#### 프론트엔드 환경 변수

프론트엔드의 경우 `.env.local` 파일을 생성하세요:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Docker를 사용한 실행

가장 간단한 방법은 Docker Compose를 사용하는 것입니다:

```bash
# Docker 컨테이너 실행 (백그라운드)
npm run docker:up

# Docker 컨테이너 실행 (포그라운드, 로그 확인)
npm run docker:dev

# 로그 확인
npm run docker:logs

# 컨테이너 중지
npm run docker:down

# 완전 재빌드 (캐시 무시)
npm run docker:rebuild

# 모든 데이터 삭제 후 정리
npm run docker:clean
```

### 로컬 개발 환경 설정

Docker 없이 로컬에서 실행하려면:

1. PostgreSQL을 로컬에 설치하거나 Docker로 실행:

```bash
# PostgreSQL만 Docker로 실행
docker run -d --name taskflow-postgres -e POSTGRES_DB=taskflow -e POSTGRES_USER=taskflow -e POSTGRES_PASSWORD=taskflow -p 5432:5432 postgres:15-alpine
```

2. 환경 변수를 설정하고 애플리케이션 실행:

```bash
# 백엔드 디렉토리에서 .env 파일 생성
cp apps/backend/env.example apps/backend/.env

# 개발 서버 실행
npm run dev
```

### 코드 포맷팅 및 린팅

프로젝트는 ESLint와 Prettier를 사용하여 코드 품질을 관리합니다:

```bash
# 전체 프로젝트 포맷팅
npm run format

# 개별 포맷팅
npm run format:backend   # 백엔드 포맷팅
npm run format:frontend  # 프론트엔드 포맷팅

# 린팅
npm run lint:backend     # 백엔드 린팅
npm run lint:frontend    # 프론트엔드 린팅
```

#### VS Code 설정

자동 포맷팅을 위해 다음 VS Code 확장을 설치하세요:

- ESLint
- Prettier - Code formatter
- TypeScript Importer

프로젝트에는 이미 `.vscode/settings.json` 파일이 구성되어 있어 저장 시 자동 포맷팅이 적용됩니다.

## 📖 API 문서

백엔드 서버 실행 후 Swagger 문서에 접근할 수 있습니다:

- **URL**: http://localhost:3001/api/docs

## 🧪 테스트

```bash
# 전체 테스트 실행
npm run test

# 개별 테스트
npm run test:backend   # 백엔드 테스트
npm run test:frontend  # 프론트엔드 테스트
```

## 🏗️ 빌드 및 배포

```bash
# 전체 빌드
npm run build

# 개별 빌드
npm run build:backend
npm run build:frontend
```

## 📁 프로젝트 구조

### 백엔드 구조 (기본 NestJS 패턴)

```
src/
├── controllers/     # HTTP 요청/응답 처리
├── services/       # 비즈니스 로직 및 유스케이스
├── entities/       # TypeORM 엔터티
├── dto/           # 데이터 전송 객체
├── repositories/   # 데이터 접근 레이어
├── config/        # 애플리케이션 설정
├── guards/        # 인증/인가 가드
├── filters/       # 예외 필터
├── interceptors/  # 요청/응답 인터셉터
├── decorators/    # 커스텀 데코레이터
├── swagger/       # API 문서화
├── database/      # 데이터베이스 마이그레이션
├── interfaces/    # TypeScript 인터페이스
├── exceptions/    # 커스텀 예외 클래스
├── common/        # 공통 유틸리티
└── modules/       # NestJS 모듈
```

## 🤝 기여하기

1. 이 리포지토리를 Fork합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

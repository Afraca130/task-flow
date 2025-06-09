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
`apps/backend/env.template`을 참조하여 `.env` 파일을 생성하세요:

```env
# Database
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

1. PostgreSQL과 Redis를 로컬에 설치하거나 Docker로 실행:
```bash
# PostgreSQL과 Redis만 Docker로 실행
docker run -d --name taskflow-postgres -e POSTGRES_DB=taskflow -e POSTGRES_USER=taskflow -e POSTGRES_PASSWORD=taskflow -p 5432:5432 postgres:15-alpine
docker run -d --name taskflow-redis -p 6379:6379 redis:7-alpine
```

2. 환경 변수를 설정하고 애플리케이션 실행:
```bash
# 백엔드 디렉토리에서 .env 파일 생성
cp apps/backend/env.template apps/backend/.env

# 개발 서버 실행
npm run dev
```

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

## 📁 클린 아키텍처 구조

### 백엔드 레이어 구조

#### 1. Domain Layer (도메인 레이어)
- **Entities**: 핵심 비즈니스 객체
- **Value Objects**: 불변 값 객체
- **Domain Services**: 도메인 로직
- **Specifications**: 비즈니스 규칙

#### 2. Application Layer (애플리케이션 레이어)
- **Use Cases**: 애플리케이션 비즈니스 규칙
- **Ports**: 외부 의존성 인터페이스
- **Commands/Queries**: CQRS 패턴
- **Application Services**: 유스케이스 조합

#### 3. Infrastructure Layer (인프라 레이어)
- **Adapters**: 포트 구현체
- **Repositories**: 데이터 접근 구현
- **External Services**: 외부 서비스 연동
- **Persistence**: 데이터베이스 관련

#### 4. Presentation Layer (프레젠테이션 레이어)
- **Controllers**: HTTP 요청/응답 처리
- **DTOs**: 데이터 전송 객체
- **Guards**: 인증/인가
- **Filters**: 예외 처리

## 🤝 기여하기

1. 이 리포지토리를 Fork합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

문제가 있거나 질문이 있으시면 [Issues](https://github.com/your-username/taskflow/issues)를 통해 문의해 주세요. 
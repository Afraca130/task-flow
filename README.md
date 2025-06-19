# 🚀 TaskFlow - 현대적인 프로젝트 관리 플랫폼

TaskFlow는 팀 협업과 프로젝트 관리를 위한 현대적인 웹 애플리케이션입니다. Clean Architecture 원칙을 따르는 NestJS 백엔드와 최신 Next.js App Router를 사용하는 프론트엔드로 구성된 풀스택 애플리케이션입니다.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## ✨ 주요 기능

### 📊 프로젝트 관리

- **프로젝트 생성/관리**: 공개/비공개 프로젝트 생성 및 설정
- **멤버 관리**: 소유자, 관리자, 멤버 역할 기반 권한 관리
- **초대 시스템**: 이메일 기반 프로젝트 초대 및 승인

### 📋 태스크 관리

- **칸반 보드**: To Do, In Progress, Done 상태로 태스크 관리
- **권한 기반 액세스**: 소유자/관리자는 모든 태스크, 멤버는 자신이 생성한 태스크만 수정 가능
- **태스크 할당**: 팀 멤버에게 태스크 할당 및 관리
- **우선순위**: 높음, 보통, 낮음 우선순위 설정
- **태그 시스템**: 태그를 통한 태스크 분류 및 필터링
- **댓글 시스템**: 태스크별 댓글 및 토론

### 🐛 이슈 관리

- **버그 추적**: 프로젝트 이슈 등록 및 상태 관리
- **이슈 분류**: 버그, 개선사항, 새 기능 등으로 분류

### 🔔 알림 시스템

- **실시간 알림**: 태스크 할당, 댓글, 초대 등에 대한 실시간 알림
- **알림 히스토리**: 모든 알림 내역 확인 및 관리

### 📈 활동 로그

- **변경 추적**: 모든 프로젝트 활동 로그 기록
- **히스토리**: 프로젝트 내 모든 변경사항 추적

### 👤 사용자 관리

- **프로필 관리**: 사용자 정보 및 프로필 사진 관리
- **JWT 인증**: 안전한 토큰 기반 인증 시스템

## 🏗️ 기술 스택

### 백엔드 (NestJS)

- **Framework**: NestJS v10 (Clean Architecture)
- **Language**: TypeScript
- **Database**: PostgreSQL + TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest
- **Architecture**: Clean Architecture 패턴 적용

### 프론트엔드 (Next.js)

- **Framework**: Next.js v14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: Shadcn UI + Radix UI
- **State Management**: React Context + Custom Hooks
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form

### 개발/배포 환경

- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15
- **Code Quality**: ESLint + Prettier
- **Version Control**: Git

## 🚀 빠른 시작

### 전제 조건

- Node.js 18+
- Docker & Docker Compose
- Git

### 1. 프로젝트 클론

```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Docker로 개발 환경 실행

```bash
# Docker Compose로 전체 애플리케이션 실행
docker-compose up -d

# 또는 편의 스크립트 사용
./start-docker.sh
```

### 4. 애플리케이션 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs

## 📁 프로젝트 구조

```
TaskFlow/
├── apps/
│   ├── backend/                     # NestJS Backend
│   │   ├── src/
│   │   │   ├── common/             # 공통 유틸리티 및 인터페이스
│   │   │   │   ├── dto/           # 공통 DTO
│   │   │   │   ├── entities/      # 기본 엔티티
│   │   │   │   ├── interfaces/    # 공통 인터페이스
│   │   │   │   ├── utils/         # 유틸리티 함수
│   │   │   │   └── value-objects/ # 값 객체
│   │   │   ├── config/            # 설정 파일들
│   │   │   ├── decorators/        # 커스텀 데코레이터
│   │   │   ├── filters/           # 예외 필터
│   │   │   ├── interceptors/      # 인터셉터
│   │   │   ├── modules/           # 기능별 모듈
│   │   │   │   ├── auth/         # 인증 관리
│   │   │   │   ├── users/        # 사용자 관리
│   │   │   │   ├── projects/     # 프로젝트 관리
│   │   │   │   ├── tasks/        # 태스크 관리
│   │   │   │   ├── issues/       # 이슈 관리
│   │   │   │   ├── notifications/ # 알림 관리
│   │   │   │   ├── invitations/  # 초대 관리
│   │   │   │   ├── activity-logs/# 활동 로그
│   │   │   │   └── shared/       # 공유 모듈
│   │   │   └── swagger/          # API 문서화
│   │   ├── Dockerfile.dev
│   │   └── package.json
│   └── frontend/                   # Next.js Frontend
│       ├── src/
│       │   ├── app/              # App Router 페이지
│       │   │   ├── dashboard/    # 대시보드
│       │   │   ├── projects/     # 프로젝트 관리
│       │   │   ├── tasks/        # 태스크 관리
│       │   │   ├── issues/       # 이슈 관리
│       │   │   ├── notifications/# 알림
│       │   │   ├── profile/      # 사용자 프로필
│       │   │   └── auth/         # 인증 페이지
│       │   ├── components/       # 재사용 컴포넌트
│       │   │   ├── ui/          # UI 컴포넌트
│       │   │   └── providers/   # Context Providers
│       │   ├── lib/             # 유틸리티
│       │   └── store/           # 상태 관리
│       ├── Dockerfile.dev
│       └── package.json
├── docker-compose.yml
├── start-docker.sh
└── README.md
```

## 🔧 개발 환경 설정

### 로컬 개발 (Docker 없이)

1. **PostgreSQL 설치 및 설정**

```bash
# Docker로 PostgreSQL 실행
docker run -d \
  --name taskflow-postgres \
  -e POSTGRES_DB=taskflow \
  -e POSTGRES_USER=taskflow \
  -e POSTGRES_PASSWORD=taskflow \
  -p 5432:5432 \
  postgres:15-alpine
```

2. **환경 변수 설정**

```bash
# 백엔드 환경 변수
cp apps/backend/.env.example apps/backend/.env

# 프론트엔드 환경 변수
cp apps/frontend/.env.example apps/frontend/.env.local
```

3. **개발 서버 실행**

```bash
# 백엔드와 프론트엔드 동시 실행
npm run dev

# 개별 실행
npm run dev:backend   # 포트 3001
npm run dev:frontend  # 포트 3000
```

### Docker 개발 환경

```bash
# 모든 서비스 실행 (백그라운드)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend

# 서비스 중지
docker-compose down

# 볼륨 포함 완전 삭제
docker-compose down -v
```

## 🧪 테스트

```bash
# 전체 테스트 실행
npm test

# 백엔드 테스트
cd apps/backend && npm test

# 프론트엔드 테스트
cd apps/frontend && npm test

# 테스트 커버리지
npm run test:cov
```

## 📖 API 문서

백엔드 서버 실행 후 Swagger UI에서 API 문서를 확인할 수 있습니다:

- **URL**: http://localhost:3001/api/docs
- **Features**:
  - 모든 API 엔드포인트 문서화
  - 인터랙티브 API 테스트
  - JWT 인증 지원
  - 요청/응답 스키마 정의

## 🏗️ 아키텍처

### Clean Architecture 패턴

백엔드는 Clean Architecture 원칙을 따라 설계되었습니다:

1. **Domain Layer**: 비즈니스 로직과 엔티티
2. **Application Layer**: 유스케이스와 애플리케이션 서비스
3. **Infrastructure Layer**: 데이터베이스, 외부 서비스 연동
4. **Presentation Layer**: API 컨트롤러와 DTO

### 의존성 관리

- **SharedModule**: 순환 참조 해결을 위한 중앙집중식 인터페이스 관리
- **Interface Segregation**: 각 모듈은 필요한 인터페이스만 의존
- **Dependency Injection**: NestJS IoC 컨테이너 활용

## 🔐 보안

- **JWT Authentication**: 토큰 기반 인증
- **Role-based Access Control**: 프로젝트별 역할 기반 권한 관리
- **Input Validation**: class-validator를 통한 입력 검증
- **SQL Injection Prevention**: TypeORM 쿼리 빌더 사용
- **CORS Configuration**: 안전한 CORS 설정

## 🚀 배포

### 프로덕션 빌드

```bash
# 전체 빌드
npm run build

# 개별 빌드
npm run build:backend
npm run build:frontend
```

### Docker 프로덕션 배포

```bash
# 프로덕션 이미지 빌드
docker-compose -f docker-compose.prod.yml build

# 프로덕션 환경 실행
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 기여하기

1. 프로젝트를 Fork합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 코드 스타일을 확인합니다 (`npm run lint`)
4. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
5. 브랜치에 Push합니다 (`git push origin feature/amazing-feature`)
6. Pull Request를 생성합니다

### 코드 스타일

프로젝트는 ESLint와 Prettier를 사용합니다:

```bash
# 코드 포맷팅
npm run format

# 린팅 검사
npm run lint

# 자동 수정
npm run lint:fix
```

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 👨‍💻 개발자

- **개발자**: TaskFlow Team
- **이메일**: support@taskflow.com
- **GitHub**: https://github.com/taskflow-team

## 🆘 지원

문제가 발생하거나 질문이 있으시면:

1. [GitHub Issues](https://github.com/your-username/taskflow/issues)에 이슈를 등록하세요
2. [Discussions](https://github.com/your-username/taskflow/discussions)에서 토론하세요
3. 이메일로 문의하세요: support@taskflow.com

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!

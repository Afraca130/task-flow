# TaskFlow Backend

NestJS 기반의 TaskFlow 백엔드 API 서버입니다.

## 🚀 시작하기

### 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경변수를 설정하세요:

```bash
# Application Environment
NODE_ENV=development
PORT=3001

# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=taskflow_user
DB_PASSWORD=taskflow_password
DB_DATABASE=taskflow_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# API Configuration
API_PREFIX=api
API_VERSION=v1

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Swagger Configuration
SWAGGER_ENABLED=true
SWAGGER_PATH=api/docs

# Database Advanced Settings (Optional)
DB_LOGGING=true
DB_MAX_CONNECTIONS=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
DB_RETRY_ATTEMPTS=10
DB_RETRY_DELAY=3000
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run start:dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start:prod
```

## 📁 프로젝트 구조

```
src/
├── domain/                     # 도메인 레이어 (엔티티, 비즈니스 규칙)
│   └── entities/
├── application/                # 애플리케이션 레이어 (유즈케이스, 포트)
│   ├── services/
│   └── ports/
├── infrastructure/             # 인프라스트럭처 레이어 (어댑터, 설정)
│   ├── adapters/
│   └── config/
│       ├── database.config.ts  # 데이터베이스 설정
│       └── app.config.ts       # 애플리케이션 설정
├── presentation/               # 프레젠테이션 레이어 (컨트롤러, DTO)
│   ├── controllers/
│   ├── dto/
│   ├── guards/
│   └── filters/
└── shared/                     # 공유 유틸리티
    ├── config/
    └── utils/
```

## ⚙️ 설정 관리

### DatabaseConfig
TypeORM 데이터베이스 연결 설정을 관리합니다.

```typescript
// infrastructure/config/database.config.ts
@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  // 데이터베이스 연결 옵션 생성
  createTypeOrmOptions(): TypeOrmModuleOptions
  
  // 필수 환경변수 검증
  validateDatabaseConfig(): void
  
  // 데이터베이스 URL 생성
  getDatabaseUrl(): string
}
```

### AppConfig
애플리케이션 전체 설정을 중앙화하여 관리합니다.

```typescript
// infrastructure/config/app.config.ts
@Injectable()
export class AppConfig {
  // 환경별 설정
  get nodeEnv(): string
  get isProduction(): boolean
  get isDevelopment(): boolean
  
  // API 설정
  get apiPrefix(): string
  get apiVersion(): string
  
  // 보안 설정
  get jwt(): JwtConfig
  get allowedOrigins(): string[]
  
  // 필수 환경변수 검증
  validateRequiredEnvVars(): void
}
```

## 🔒 보안

### JWT 설정
- `JWT_SECRET`: 최소 32자 이상의 강력한 시크릿 키 사용
- `JWT_EXPIRES_IN`: 토큰 만료 시간 (예: 7d, 24h, 60m)

### 데이터베이스 보안
- 프로덕션에서는 SSL 연결 활성화
- 데이터베이스 계정에 최소 권한 부여
- 연결 풀 설정으로 리소스 관리

## 📊 모니터링

### 설정 검증
애플리케이션 시작 시 필수 환경변수와 설정을 자동으로 검증합니다.

### 로깅
- 개발 환경: 상세한 설정 정보 출력
- 프로덕션 환경: 민감한 정보 제외하고 필수 정보만 출력

## 🔗 API 문서

Swagger UI는 다음 URL에서 확인할 수 있습니다:
- 개발: http://localhost:3001/api/docs
- 프로덕션: `SWAGGER_ENABLED=false`로 비활성화 권장

## 🐳 Docker

```bash
# Docker로 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f backend
```

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
``` 
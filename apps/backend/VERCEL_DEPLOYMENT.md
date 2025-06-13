# TaskFlow Backend Vercel 배포 가이드

## 📋 배포 전 체크리스트

### 1. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

```env
# Application Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_TYPE=postgres
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_NAME=taskflow_db
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_URL=postgresql://username:password@host:port/database

# MongoDB Configuration (활동 로그용)
MONGODB_URI=mongodb://your-mongo-connection-string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Security
BCRYPT_ROUNDS=12
```

### 2. 데이터베이스 설정

#### PostgreSQL (추천: Supabase, Neon, PlanetScale)

```bash
# Supabase 사용 예시
DATABASE_URL=postgresql://postgres:password@db.project-id.supabase.co:5432/postgres
```

#### MongoDB (추천: MongoDB Atlas)

```bash
# MongoDB Atlas 사용 예시
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflow
```

## 🚀 배포 방법

### 방법 1: Vercel CLI 사용

```bash
npm i -g vercel
cd apps/backend
vercel --prod
```

### 방법 2: GitHub 연동

1. GitHub에 코드 푸시
2. Vercel 대시보드에서 "New Project" 클릭
3. GitHub 리포지토리 선택
4. Root Directory를 `apps/backend`로 설정
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Install Command: `npm install`

### 방법 3: Vercel 대시보드에서 직접 배포

1. 프로젝트 디렉토리에서 `vercel.json` 확인
2. Vercel 대시보드 > Import Project
3. 환경 변수 설정
4. 배포 실행

## ⚙️ Vercel 설정 파일

`vercel.json`:

```json
{
  "version": 2,
  "name": "taskflow-backend",
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.ts"
    }
  ],
  "functions": {
    "api/index.ts": {
      "maxDuration": 30
    }
  }
}
```

`api/index.ts`:

- NestJS 애플리케이션을 Vercel Serverless Function으로 래핑
- Express 어댑터 사용
- CORS 및 보안 설정 포함

## 🔍 배포 후 확인사항

### 1. API 엔드포인트 테스트

```bash
curl https://your-backend-domain.vercel.app/health
curl https://your-backend-domain.vercel.app/api/auth/profile
```

### 2. 데이터베이스 연결 확인

```bash
curl https://your-backend-domain.vercel.app/api/projects
```

### 3. CORS 설정 확인

프론트엔드에서 API 호출이 정상적으로 작동하는지 확인

## 🐛 문제 해결

### 1. Cold Start 문제

Vercel Serverless는 첫 번째 요청 시 지연이 발생할 수 있습니다.

- 해결책: Warmer 함수 구현 또는 Vercel Pro 플랜 사용

### 2. 타임아웃 문제

기본 실행 시간 제한은 10초입니다.

- 해결책: `vercel.json`에서 `maxDuration` 설정 (Pro 플랜 필요)

### 3. 환경 변수 문제

- Vercel 대시보드에서 환경 변수가 정확히 설정되었는지 확인
- 민감한 정보는 절대 코드에 하드코딩하지 말 것

### 4. 데이터베이스 연결 문제

- 연결 풀 설정 확인
- 데이터베이스 호스트가 외부 접근을 허용하는지 확인

## 📊 성능 최적화

### 1. 연결 풀 설정

```typescript
// typeorm 설정 예시
{
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  }
}
```

### 2. 캐싱 전략

- Redis 또는 Vercel KV 사용 고려
- 자주 사용되는 데이터 캐싱

## 🔐 보안 고려사항

1. **환경 변수**: 모든 민감한 정보는 환경 변수로 관리
2. **CORS**: 정확한 도메인만 허용
3. **JWT 시크릿**: 강력한 시크릿 키 사용
4. **데이터베이스**: SSL 연결 사용
5. **헤더**: 보안 관련 HTTP 헤더 설정

## 📞 지원

배포 중 문제가 발생하면:

1. Vercel 로그 확인
2. 데이터베이스 연결 상태 확인
3. 환경 변수 설정 재확인
4. CORS 설정 검토

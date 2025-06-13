# Vercel 프론트엔드 → Localhost 백엔드 연결 설정 가이드

## 🎯 개요

배포된 Vercel 프론트엔드에서 로컬 백엔드 서버에 연결하는 방법입니다.

## 🔧 설정 단계

### 1. Vercel 대시보드 환경 변수 설정

Vercel 프로젝트 설정에서 다음 환경 변수를 추가하세요:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**설정 방법:**

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 새 변수 추가:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `http://localhost:3001`
   - **Environment**: Production, Preview, Development 모두 선택

### 2. 백엔드 CORS 설정 확인

백엔드 서버에서 Vercel 도메인을 허용하도록 설정되었습니다:

```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://taskflow-frontend.vercel.app",
    /\.vercel\.app$/,
    /^https:\/\/.*\.vercel\.app$/,
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
  ],
  optionsSuccessStatus: 200,
});
```

### 3. 프론트엔드 API 설정 확인

프론트엔드에서 동적 API URL 설정이 적용되었습니다:

```typescript
// apps/frontend/src/lib/api.ts
const getBaseURL = () => {
  // 프로덕션 환경에서는 프록시를 통해 연결
  if (
    typeof window !== "undefined" &&
    window.location.origin.includes("vercel.app")
  ) {
    return "/api";
  }
  // 로컬 개발 환경
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api";
};
```

### 4. Next.js 프록시 설정 확인

```javascript
// apps/frontend/next.config.js
async rewrites() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return [
    {
      source: '/api/:path*',
      destination: `${apiUrl}/api/:path*`,
    },
  ];
}
```

## 🚀 실행 방법

### 1. 로컬 백엔드 서버 실행

```bash
cd apps/backend
npm run start:dev
```

### 2. Vercel 프론트엔드 재배포

```bash
cd apps/frontend
vercel --prod
```

또는 Vercel 대시보드에서 수동 재배포

## 🔍 연결 테스트

### 1. 백엔드 서버 상태 확인

```bash
curl http://localhost:3001/health
```

### 2. Vercel 프론트엔드에서 API 호출 테스트

브라우저 개발자 도구의 Network 탭에서 API 요청 확인

### 3. CORS 헤더 확인

```bash
curl -H "Origin: https://your-vercel-domain.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization,content-type" \
     -X OPTIONS \
     http://localhost:3001/api/projects
```

## 🐛 문제 해결

### 1. CORS 오류 발생 시

- 백엔드 서버가 실행 중인지 확인
- 백엔드 CORS 설정에 정확한 Vercel 도메인이 포함되어 있는지 확인
- 브라우저 개발자 도구에서 정확한 오류 메시지 확인

### 2. 네트워크 연결 오류 시

- 로컬 방화벽 설정 확인
- 백엔드 서버 포트 3001이 열려있는지 확인
- 프록시 설정이 올바른지 확인

### 3. 환경 변수가 적용되지 않을 때

- Vercel 프로젝트 재배포 필요
- 브라우저 캐시 청소
- 개발자 도구 Network 탭에서 실제 API 호출 URL 확인

## 💡 추가 팁

### 1. 개발 환경 구분

```javascript
// 개발 환경 체크
const isDevelopment = process.env.NODE_ENV === "development";
const isVercelProduction =
  typeof window !== "undefined" &&
  window.location.origin.includes("vercel.app");
```

### 2. 디버깅 로그 추가

```javascript
// API 호출 전 로그
console.log("API Base URL:", getBaseURL());
console.log("Current Origin:", window.location.origin);
```

### 3. 백엔드 로그 확인

```bash
# 백엔드 서버 로그에서 CORS 요청 확인
tail -f apps/backend/logs/app.log
```

## 🔐 보안 고려사항

1. **개발 환경에서만 사용**: 이 설정은 개발/테스트 목적으로만 사용하세요
2. **방화벽 설정**: 로컬 백엔드 서버 포트를 외부에 노출하지 마세요
3. **HTTPS → HTTP**: Mixed Content 보안 정책으로 인해 일부 브라우저에서 차단될 수 있습니다

## 📞 지원

문제가 발생하면:

1. 브라우저 개발자 도구 Console 탭 확인
2. Network 탭에서 실제 API 호출 URL 확인
3. 백엔드 서버 로그 확인
4. CORS preflight 요청 확인

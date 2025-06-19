# Backend Service Tests Guide

## 개요

이 프로젝트는 Jest를 사용하여 NestJS 백엔드 서비스들에 대한 포괄적인 단위 테스트를 제공합니다.

## 테스트 실행

### 모든 테스트 실행

```bash
npm test
```

### 감시 모드로 테스트 실행

```bash
npm run test:watch
```

### 테스트 커버리지 확인

```bash
npm run test:cov
```

### 특정 테스트 파일 실행

```bash
npm test -- auth.service.spec.ts
```

### 디버그 모드로 테스트 실행

```bash
npm run test:debug
```

## 작성된 테스트 파일들

### 1. AuthService 테스트 (`auth.service.spec.ts`)

- **테스트 범위**: 사용자 인증 및 권한 관리
- **주요 테스트 케이스**:
  - 회원가입 (성공/실패 시나리오)
  - 로그인 (성공/실패 시나리오)
  - 비밀번호 변경
  - 프로필 조회 및 업데이트
  - JWT 토큰 검증

### 2. UsersService 테스트 (`users.service.spec.ts`)

- **테스트 범위**: 사용자 관리 기능
- **주요 테스트 케이스**:
  - 사용자 조회 (ID, 이메일)
  - 사용자 생성, 수정, 삭제
  - 활성 사용자 조회
  - 사용자 검색 기능
  - 비밀번호 및 로그인 시간 업데이트

### 3. ProjectsService 테스트 (`projects.service.spec.ts`)

- **테스트 범위**: 프로젝트 관리 기능
- **주요 테스트 케이스**:
  - 프로젝트 생성 (Clean Architecture 패턴)
  - 프로젝트 조회 (권한 검증 포함)
  - 사용자별 프로젝트 목록
  - 공개 프로젝트 목록
  - 프로젝트 업데이트 및 권한 관리
  - 프로젝트 멤버 관리

### 4. TasksService 테스트 (`tasks.service.spec.ts`)

- **테스트 범위**: 태스크 관리 기능
- **주요 테스트 케이스**:
  - 태스크 생성 (LexoRank 알고리즘 포함)
  - 태스크 조회 및 필터링
  - 태스크 업데이트 및 삭제
  - 태스크 통계 조회
  - 알림 처리 (실패 시 graceful handling)

### 5. NotificationsService 테스트 (`notifications.service.spec.ts`)

- **테스트 범위**: 알림 관리 기능
- **주요 테스트 케이스**:
  - 알림 생성 및 조회
  - 읽음 상태 관리
  - 알림 삭제 및 권한 검증
  - 프로젝트 초대 알림
  - 태스크 할당 알림

## 테스트 패턴 및 베스트 프랙티스

### 1. Mock 패턴

모든 테스트는 의존성을 mock하여 순수한 단위 테스트로 작성:

```typescript
const mockRepository = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};
```

### 2. AAA 패턴 (Arrange-Act-Assert)

모든 테스트는 명확한 구조를 따름:

```typescript
it('should do something', async () => {
  // Arrange - 테스트 데이터 및 mock 설정
  mockRepository.findById.mockResolvedValue(mockData);

  // Act - 실제 테스트할 기능 실행
  const result = await service.methodUnderTest(input);

  // Assert - 결과 검증
  expect(result).toEqual(expectedOutput);
  expect(mockRepository.findById).toHaveBeenCalledWith(input);
});
```

### 3. 에러 시나리오 테스트

성공 케이스뿐만 아니라 실패 케이스도 포함:

```typescript
it('should throw error when data not found', async () => {
  mockRepository.findById.mockResolvedValue(null);

  await expect(service.methodUnderTest('invalid-id')).rejects.toThrow(
    new NotFoundException('Data not found'),
  );
});
```

### 4. Mock 초기화

각 테스트 전에 mock을 초기화:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 확장 가능한 테스트 구조

### 추가할 서비스 테스트들

1. **IssuesService 테스트**
2. **ActivityLogService 테스트**
3. **InvitationsService 테스트**
4. **CommentsService 테스트**

### 새로운 테스트 파일 작성 시 고려사항

1. **의존성 Mock**: 모든 외부 의존성(Repository, Service)을 mock
2. **Error Handling**: 예외 상황에 대한 테스트 포함
3. **Edge Cases**: 경계값 및 특수 상황 테스트
4. **Type Safety**: TypeScript 타입 안정성 유지

## 테스트 커버리지 목표

- **Line Coverage**: 80% 이상
- **Function Coverage**: 90% 이상
- **Branch Coverage**: 75% 이상

## 통합 테스트 (E2E)

단위 테스트 외에도 전체 API 흐름을 테스트하는 E2E 테스트 작성 고려:

```bash
npm run test:e2e
```

## 성능 테스트

대용량 데이터 처리 및 동시성 테스트를 위한 별도 테스트 스위트 구성 가능.

## CI/CD 통합

테스트는 CI/CD 파이프라인에서 자동으로 실행되며, 모든 테스트가 통과해야 배포가 진행됩니다.

---

## 개발자 가이드

### 새로운 서비스 테스트 작성 시:

1. `[service-name].service.spec.ts` 파일 생성
2. 위의 패턴을 따라 테스트 구조 작성
3. Mock 데이터 및 의존성 설정
4. 모든 public 메서드에 대한 테스트 케이스 작성
5. 성공/실패 시나리오 모두 포함

### 테스트 실행 전 확인사항:

1. 모든 import 경로가 올바른지 확인
2. Mock 데이터가 실제 엔터티와 일치하는지 확인
3. 타입 오류가 없는지 확인
4. 테스트 격리가 잘 되어있는지 확인 (각 테스트가 독립적으로 실행)

이 가이드를 따라 일관성 있고 신뢰할 수 있는 테스트 코드를 작성할 수 있습니다.

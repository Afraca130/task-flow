// MongoDB 초기화 스크립트
// TaskFlow 애플리케이션용 데이터베이스 및 사용자 설정

// TaskFlow 데이터베이스로 전환
db = db.getSiblingDB("taskflow");

// TaskFlow 사용자 생성
db.createUser({
  user: "taskflow",
  pwd: "taskflow123",
  roles: [
    {
      role: "readWrite",
      db: "taskflow",
    },
  ],
});

// 초기 컬렉션 생성 (선택사항)
db.createCollection("notifications");

print("MongoDB 초기화 완료: taskflow 데이터베이스 및 사용자 생성됨");

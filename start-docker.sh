#!/bin/bash

echo "🐳 TaskFlow Docker 환경을 시작합니다..."

# Docker Compose가 설치되어 있는지 확인
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose가 설치되어 있지 않습니다."
    exit 1
fi

# Docker가 실행 중인지 확인
if ! docker info &> /dev/null; then
    echo "❌ Docker가 실행되고 있지 않습니다. Docker를 시작해주세요."
    exit 1
fi

echo "📦 이전 컨테이너를 정리합니다..."
docker-compose down

echo "🔨 이미지를 빌드합니다..."
docker-compose build

echo "컨테이너를 시작합니다..."
docker-compose up -d

echo "서비스가 시작될 때까지 잠시 기다려주세요..."
sleep 10

echo "TaskFlow가 성공적으로 시작되었습니다!"
echo ""
echo "📱 프론트엔드: http://localhost:3000"
echo "🔌 백엔드 API: http://localhost:3001"
echo "📚 API 문서: http://localhost:3001/api/docs"
echo ""
echo "로그를 확인하려면: npm run docker:logs"
echo "컨테이너를 중지하려면: npm run docker:down"

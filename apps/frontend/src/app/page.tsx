export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            TaskFlow
          </h1>
          <p className="text-lg leading-8 text-gray-600 max-w-2xl">
            효율적인 업무 진행 관리를 위한 현대적인 솔루션입니다.
            팀의 생산성을 높이고 프로젝트를 성공적으로 완료하세요.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              시작하기
            </button>
            <button className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600">
              더 알아보기
            </button>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="작업 관리"
            description="직관적인 인터페이스로 작업을 쉽게 생성, 할당, 추적할 수 있습니다."
            icon="📝"
          />
          <FeatureCard
            title="팀 협업"
            description="실시간 협업 도구로 팀원들과 원활하게 소통하고 작업을 공유하세요."
            icon="👥"
          />
          <FeatureCard
            title="진행 추적"
            description="프로젝트 진행 상황을 시각적으로 확인하고 일정을 효과적으로 관리하세요."
            icon="📊"
          />
        </div>
      </div>
    </main>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-center">
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
} 
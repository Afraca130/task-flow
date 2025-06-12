'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      // 인증된 사용자는 인사이트로 이동
      router.replace('/insights');
    } else {
      // 인증되지 않은 사용자는 로그인으로 이동
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
        <p className='text-gray-500'>페이지를 로딩 중...</p>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className='rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow'>
      <div className='text-center'>
        <div className='text-3xl mb-4'>{icon}</div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>{title}</h3>
        <p className='text-sm text-gray-600'>{description}</p>
      </div>
    </div>
  );
}

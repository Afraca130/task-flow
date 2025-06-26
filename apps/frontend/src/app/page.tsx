'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // auth store에서 사용하는 토큰 키로 확인
    const token = localStorage.getItem('auth-token');
    const userStr = localStorage.getItem('auth-user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('🏠 HomePage redirect check:', {
          hasToken: !!token,
          hasUser: !!user,
          lastProjectId: user.lastProjectId,
        });

        // lastProjectId가 있으면 해당 프로젝트 dashboard로, 없으면 일반 dashboard로
        if (user.lastProjectId) {
          console.log('🎯 Redirecting to last project dashboard:', user.lastProjectId);
          // localStorage에도 저장
          localStorage.setItem('selectedProjectId', user.lastProjectId);
          router.push(`/dashboard?projectId=${user.lastProjectId}`);
        } else {
          console.log('🏠 Redirecting to general dashboard (no lastProjectId)');
          // lastProjectId가 없으면 localStorage도 정리
          localStorage.removeItem('selectedProjectId');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        router.push('/dashboard');
      }
    } else {
      console.log('🔐 No auth token, redirecting to login');
      router.push('/login');
    }
  }, [router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
        <p className='mt-4 text-gray-600'>TaskFlow 로딩 중...</p>
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

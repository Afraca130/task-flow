'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // 대시보드는 인사이트로 리다이렉트
    router.replace('/insights');
  }, [router]);

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
        <p className='text-gray-500'>인사이트 페이지로 이동 중...</p>
      </div>
    </div>
  );
}

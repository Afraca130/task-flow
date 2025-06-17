'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Bug, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function IssuesPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto py-8 px-4'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.back()}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>이슈 게시판</h1>
              <p className='text-gray-600'>프로젝트 이슈를 관리하세요</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className='mr-2 h-4 w-4' />새 이슈 작성
          </Button>
        </div>

        <div className='text-center py-12'>
          <Bug className='w-16 h-16 text-gray-300 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>등록된 이슈가 없습니다</h3>
          <p className='text-gray-600 mb-6'>새 이슈를 생성하여 시작해보세요.</p>
        </div>

        {showCreateModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg max-w-2xl w-full p-6'>
              <h3 className='text-lg font-semibold mb-4'>새 이슈 작성</h3>
              <div className='space-y-4'>
                <input
                  type='text'
                  placeholder='이슈 제목을 입력하세요'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg'
                />
                <textarea
                  rows={4}
                  placeholder='이슈 내용을 입력하세요'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg'
                />
                <div className='flex justify-end gap-3'>
                  <Button variant='outline' onClick={() => setShowCreateModal(false)}>
                    취소
                  </Button>
                  <Button onClick={() => setShowCreateModal(false)}>등록</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

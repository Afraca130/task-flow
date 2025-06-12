'use client';

import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ArrowLeft, Palette, Save, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const PROFILE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#F59E0B', // Yellow
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#84CC16', // Lime
  '#A855F7', // Violet
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    profileColor: '#3B82F6',
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        profileColor: user.profileColor || '#3B82F6',
      });
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const updatedUser = await authApi.updateProfile(
        formData.name.trim(),
        user?.profileImage,
        formData.profileColor
      );

      setUser(updatedUser);
      alert('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, profileColor: color }));
  };

  if (!isAuthenticated || !user) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-500'>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-2xl mx-auto py-8 px-4'>
        {/* Header */}
        <div className='flex items-center gap-4 mb-8'>
          <button
            onClick={() => router.back()}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <h1 className='text-2xl font-bold text-gray-900'>프로필 설정</h1>
        </div>

        {/* Profile Form */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Profile Preview */}
            <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
              <div
                className='w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-medium'
                style={{ backgroundColor: formData.profileColor }}
              >
                {formData.name.charAt(0) || user.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className='font-medium text-gray-900'>
                  {formData.name || user.name || '사용자'}
                </h3>
                <p className='text-sm text-gray-500'>{user.email}</p>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <User className='w-4 h-4 inline mr-2' />
                이름
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='이름을 입력하세요'
                required
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                <Palette className='w-4 h-4 inline mr-2' />
                프로필 색상
              </label>
              <div className='grid grid-cols-6 gap-3'>
                {PROFILE_COLORS.map(color => (
                  <button
                    key={color}
                    type='button'
                    onClick={() => handleColorSelect(color)}
                    className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 ${
                      formData.profileColor === color
                        ? 'border-gray-400 ring-2 ring-blue-500 ring-offset-2'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`색상: ${color}`}
                  />
                ))}
              </div>
              <p className='text-xs text-gray-500 mt-2'>
                선택한 색상은 프로필 아바타와 태스크 카드에서 사용됩니다.
              </p>
            </div>

            {/* Submit Button */}
            <div className='flex justify-end pt-4'>
              <button
                type='submit'
                disabled={loading}
                className='inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {loading ? (
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                ) : (
                  <Save className='w-4 h-4' />
                )}
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
          <h3 className='font-medium text-blue-900 mb-2'>프로필 색상 정보</h3>
          <ul className='text-sm text-blue-700 space-y-1'>
            <li>• 선택한 색상은 대시보드의 프로필 아바타에 적용됩니다</li>
            <li>• 태스크 카드에서 담당자 표시에도 사용됩니다</li>
            <li>• 팀원들이 쉽게 구분할 수 있도록 도와줍니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

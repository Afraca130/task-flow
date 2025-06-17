'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { ArrowLeft, Building, Mail, Save, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    profileColor: '#3B82F6',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 프로필 색상 옵션
  const colorOptions = [
    '#3B82F6', // 파랑
    '#EF4444', // 빨강
    '#10B981', // 초록
    '#F59E0B', // 주황
    '#8B5CF6', // 보라
    '#EC4899', // 핑크
    '#06B6D4', // 청록
    '#84CC16', // 라임
    '#F97316', // 오렌지
    '#6366F1', // 인디고
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        organization: (user as any).organization || '',
        profileColor: user.profileColor || '#3B82F6',
      });
    }
  }, [isAuthenticated, user, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // API 호출로 사용자 정보 업데이트
      const { authApi } = await import('@/lib/api');
      const updatedUser = await authApi.updateProfile(
        formData.name,
        undefined, // profileImage - 현재는 이미지 업로드 기능이 없음
        formData.profileColor,
        formData.organization
      );

      // Auth store 업데이트
      setUser(updatedUser);

      // 로컬 스토리지도 업데이트
      localStorage.setItem('auth-user', JSON.stringify(updatedUser));

      setIsEditing(false);
      alert('프로필이 성공적으로 업데이트되었습니다!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('프로필 업데이트에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        organization: (user as any).organization || '',
        profileColor: user.profileColor || '#3B82F6',
      });
    }
    setIsEditing(false);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto py-8 px-4'>
        {/* 헤더 */}
        <div className='flex items-center gap-4 mb-8'>
          <button
            onClick={() => router.back()}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>내 정보</h1>
            <p className='text-gray-600'>프로필 정보를 관리하세요</p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* 프로필 카드 */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <div className='text-center'>
                <div
                  className='w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold'
                  style={{ backgroundColor: formData.profileColor }}
                >
                  {formData.name?.charAt(0) || 'U'}
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>{formData.name || '사용자'}</h3>
                <p className='text-gray-600'>{formData.email}</p>
                {formData.organization && (
                  <p className='text-sm text-gray-500 mt-1'>{formData.organization}</p>
                )}
              </div>

              {/* 프로필 색상 선택 */}
              {isEditing && (
                <div className='mt-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-3'>
                    프로필 색상
                  </label>
                  <div className='grid grid-cols-5 gap-2'>
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => handleInputChange('profileColor', color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.profileColor === color
                            ? 'border-gray-400 scale-110'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 정보 편집 폼 */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-lg font-semibold text-gray-900'>개인 정보</h2>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant='outline'>
                    편집
                  </Button>
                ) : (
                  <div className='flex gap-2'>
                    <Button onClick={handleCancel} variant='outline'>
                      취소
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className='w-4 h-4 mr-2' />
                          저장
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className='space-y-6'>
                {/* 이름 */}
                <div>
                  <label className='flex items-center gap-2 text-sm font-medium text-gray-700 mb-2'>
                    <User className='w-4 h-4' />
                    이름
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='이름을 입력하세요'
                    />
                  ) : (
                    <div className='px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900'>
                      {formData.name || '이름이 설정되지 않았습니다'}
                    </div>
                  )}
                </div>

                {/* 이메일 */}
                <div>
                  <label className='flex items-center gap-2 text-sm font-medium text-gray-700 mb-2'>
                    <Mail className='w-4 h-4' />
                    이메일
                  </label>
                  {isEditing ? (
                    <input
                      type='email'
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='이메일을 입력하세요'
                    />
                  ) : (
                    <div className='px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900'>
                      {formData.email || '이메일이 설정되지 않았습니다'}
                    </div>
                  )}
                </div>

                {/* 소속 */}
                <div>
                  <label className='flex items-center gap-2 text-sm font-medium text-gray-700 mb-2'>
                    <Building className='w-4 h-4' />
                    소속
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      value={formData.organization}
                      onChange={e => handleInputChange('organization', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='소속을 입력하세요 (선택사항)'
                    />
                  ) : (
                    <div className='px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900'>
                      {formData.organization || '소속이 설정되지 않았습니다'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

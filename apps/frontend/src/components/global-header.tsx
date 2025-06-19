'use client';

import { LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { NotificationBell } from './notifications/notification-bell';

export function GlobalHeader() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 로그인/회원가입 페이지에서는 헤더를 숨김
  const hideHeaderPaths = ['/login', '/signup'];

  // 현재 경로가 숨김 대상인지 확인
  const shouldHideHeader = hideHeaderPaths.some(path => pathname.startsWith(path));

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // 인증되지 않았거나 헤더를 숨겨야 하는 페이지인 경우 렌더링하지 않음
  if (!user || shouldHideHeader) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className='fixed top-0 right-0 z-50 p-4'>
      <div className='bg-white rounded-lg shadow-md border border-gray-200 px-4 py-2'>
        <div className='flex items-center gap-3'>
          {/* 알림 벨 */}
          <NotificationBell />

          {/* 사용자 정보 */}
          <div className='relative' ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className='flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors'
            >
              <div
                className='w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium'
                style={{ backgroundColor: user.profileColor || '#6B7280' }}
              >
                {user.name
                  ? user.name.charAt(0).toUpperCase()
                  : user.email?.charAt(0).toUpperCase()}
              </div>
              <span className='text-sm font-medium text-gray-700'>{user.name || user.email}</span>
            </button>

            {/* 사용자 드롭다운 메뉴 */}
            {showUserMenu && (
              <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2'>
                <div className='px-4 py-2 border-b border-gray-200'>
                  <p className='text-sm font-medium text-gray-900'>{user.name || '사용자'}</p>
                  <p className='text-xs text-gray-500'>{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className='w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2'
                >
                  <LogOut className='w-4 h-4' />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

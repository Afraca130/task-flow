'use client';

import { ArrowLeft, Bell, CheckCheck, Clock, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Notification, notificationsApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication with delay to prevent immediate redirect
  useEffect(() => {
    const checkAuth = () => {
      console.log('🔐 알림 페이지 인증 확인:', { isAuthenticated, user: user?.email });

      if (!isAuthenticated && authChecked) {
        console.log('❌ 인증되지 않은 사용자, 로그인 페이지로 이동');
        router.replace('/login');
        return;
      }

      if (!authChecked) {
        // Give some time for auth to initialize
        setTimeout(() => {
          setAuthChecked(true);
        }, 500);
      }
    };

    checkAuth();
  }, [isAuthenticated, user, authChecked, router]);

  // Load notifications only when authenticated
  useEffect(() => {
    if (!isAuthenticated || !authChecked) {
      console.log('⏳ 인증 대기 중...');
      return;
    }

    const fetchNotifications = async () => {
      try {
        console.log('📥 알림 데이터 로드 시작');
        setLoading(true);
        const data = await notificationsApi.getNotifications();
        console.log('알림 데이터 로드 성공:', data);
        setNotifications(data);
      } catch (error) {
        console.error('❌ 알림 데이터 로드 실패:', error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, authChecked]);

  // Show loading spinner while checking auth
  if (!authChecked) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-500'>인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // Show login message if not authenticated after check
  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Bell className='w-16 h-16 text-gray-300 mx-auto mb-4' />
          <p className='text-gray-500'>로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/login')}
            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (selectedFilter === 'unread' && notification.isRead) return false;
    if (selectedFilter === 'read' && !notification.isRead) return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const handleNotificationClick = async (notification: Notification) => {
    console.log('🔔 알림 클릭:', notification.title);

    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        console.log('알림 읽음 표시 완료');
      } catch (error) {
        console.error('❌ 알림 읽음 표시 실패:', error);
      }
    }

    // For now, just mark as read - navigation can be added later based on notification type
    console.log('📝 알림 상세 정보:', notification);
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('📖 모든 알림 읽음 표시 시작');
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      console.log('모든 알림 읽음 표시 완료');
    } catch (error) {
      console.error('❌ 모든 알림 읽음 표시 실패:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_UPDATED':
      case 'TASK_COMPLETED':
        return '📋';
      case 'COMMENT_ADDED':
        return '💬';
      case 'PROJECT_INVITATION':
        return '📧';
      case 'DUE_DATE_APPROACHING':
        return '⏰';
      default:
        return '🔔';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto py-8 px-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.back()}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>알림</h1>
              <p className='text-gray-600'>
                {notifications.filter(n => !n.isRead).length}개의 읽지 않은 알림
              </p>
            </div>
          </div>

          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllAsRead}
              className='flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <CheckCheck className='w-4 h-4' />
              모두 읽음
            </button>
          )}
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg border border-gray-200 p-4 mb-6'>
          <div className='flex flex-col sm:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1'>
              <div className='relative'>
                <Search className='w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  placeholder='알림 검색...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            {/* Filter buttons */}
            <div className='flex gap-2'>
              {[
                { key: 'all', label: '전체' },
                { key: 'unread', label: '읽지 않음' },
                { key: 'read', label: '읽음' },
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>알림을 불러오는 중...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className='text-center py-12'>
            <Bell className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {searchTerm || selectedFilter !== 'all'
                ? '조건에 맞는 알림이 없습니다'
                : '알림이 없습니다'}
            </h3>
            <p className='text-gray-500'>
              {searchTerm || selectedFilter !== 'all'
                ? '다른 조건으로 검색해보세요'
                : '새로운 알림이 있을 때 여기에 표시됩니다'}
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className='flex items-start gap-3'>
                  <span className='text-2xl'>{getNotificationIcon(notification.type)}</span>
                  <div className='flex-1'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <h4
                          className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}
                        >
                          {notification.title}
                        </h4>
                        <p className='text-gray-600 text-sm mt-1'>{notification.message}</p>
                      </div>
                      <div className='flex items-center gap-2 ml-4'>
                        <Clock className='w-4 h-4 text-gray-400' />
                        <span className='text-sm text-gray-500'>
                          {formatDate(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

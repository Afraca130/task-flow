'use client';

import { ArrowLeft, Bell, CheckCheck, Clock, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Notification, notificationsApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Load notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
  }, [isAuthenticated]);

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
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Handle navigation based on notification type and data
    if (notification.data) {
      const data = notification.data;
      switch (notification.type) {
        case 'TASK_ASSIGNED':
          if (data.taskId) {
            router.push(`/tasks/${data.taskId}`);
          }
          break;
        case 'PROJECT_INVITATION':
          if (data.projectId) {
            router.push(`/projects/${data.projectId}`);
          }
          break;
        case 'COMMENT_MENTION':
          if (data.taskId) {
            router.push(`/tasks/${data.taskId}`);
          }
          break;
        case 'ISSUE_ASSIGNED':
        case 'ISSUE_MENTION':
          if (data.issueId) {
            router.push(`/issues/${data.issueId}`);
          }
          break;
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
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
      case 'COMMENT_MENTION':
        return '💬';
      case 'PROJECT_INVITATION':
        return '📧';
      case 'DUE_DATE_APPROACHING':
        return '⏰';
      case 'ISSUE_ASSIGNED':
      case 'ISSUE_MENTION':
        return '🔍';
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

          <button
            onClick={handleMarkAllAsRead}
            className='flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <CheckCheck className='w-4 h-4' />
            모두 읽음
          </button>
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
              {selectedFilter === 'all'
                ? '알림이 없습니다'
                : selectedFilter === 'unread'
                  ? '읽지 않은 알림이 없습니다'
                  : '읽은 알림이 없습니다'}
            </h3>
            <p className='text-gray-500'>새로운 알림이 오면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-lg border p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  notification.isRead ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className='flex items-start gap-4'>
                  <div className='text-2xl'>{getNotificationIcon(notification.type)}</div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-4'>
                      <h3 className='text-sm font-medium text-gray-900'>{notification.title}</h3>
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4 text-gray-400' />
                        <span className='text-sm text-gray-500 whitespace-nowrap'>
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className='mt-1 text-sm text-gray-600'>{notification.message}</p>
                    {!notification.isRead && (
                      <div className='mt-2 w-2 h-2 bg-blue-500 rounded-full'></div>
                    )}
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

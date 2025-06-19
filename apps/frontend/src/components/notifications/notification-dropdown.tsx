'use client';

import { ArrowRight, Bell, CheckCheck, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relativeTime: string;
  action?: {
    type: 'navigate' | 'modal' | 'external' | 'none';
    url?: string;
    params?: Record<string, any>;
  };
  metadata?: {
    taskId?: string;
    taskTitle?: string;
    projectId?: string;
    projectName?: string;
    userName?: string;
  };
}

interface NotificationDropdownProps {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  loading,
  unreadCount,
  onNotificationClick,
  onMarkAllAsRead,
  onClose,
}: NotificationDropdownProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return '📋';
      case 'TASK_STATUS_CHANGED':
        return '🔄';
      case 'TASK_COMPLETED':
        return '';
      case 'COMMENT_ADDED':
        return '💬';
      case 'PROJECT_INVITED':
        return '👥';
      case 'PROJECT_MEMBER_JOINED':
        return '🎉';
      case 'TASK_DUE_SOON':
        return '';
      case 'TASK_OVERDUE':
        return '🚨';
      default:
        return '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600 bg-red-50';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50';
      case 'NORMAL':
        return 'text-blue-600 bg-blue-50';
      case 'LOW':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '🚨';
      case 'HIGH':
        return '🔥';
      default:
        return null;
    }
  };

  return (
    <div className='absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden'>
      {/* 헤더 */}
      <div className='p-4 border-b border-gray-200 bg-gray-50'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Bell className='w-5 h-5 text-gray-600' />
            <h3 className='font-semibold text-gray-900'>알림</h3>
            {unreadCount > 0 && (
              <span className='bg-red-500 text-white text-xs px-2 py-1 rounded-full'>
                {unreadCount}
              </span>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1'
                title='모두 읽음 처리'
              >
                <CheckCheck className='w-4 h-4' />
                모두 읽음
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      <div className='max-h-80 overflow-y-auto'>
        {loading ? (
          <div className='p-4 text-center'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto'></div>
            <p className='text-sm text-gray-500 mt-2'>알림을 불러오는 중...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className='p-8 text-center'>
            <Bell className='w-12 h-12 text-gray-300 mx-auto mb-3' />
            <p className='text-gray-500 text-sm'>새로운 알림이 없습니다</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-100'>
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => onNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className='flex items-start gap-3'>
                  {/* 알림 아이콘 */}
                  <div className='flex-shrink-0 mt-1'>
                    <span className='text-lg'>{getNotificationIcon(notification.type)}</span>
                  </div>

                  {/* 알림 내용 */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1'>
                        <p
                          className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p
                          className={`text-sm mt-1 ${
                            !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                          }`}
                        >
                          {notification.message}
                        </p>

                        {/* 메타데이터 표시 */}
                        {notification.metadata && (
                          <div className='flex items-center gap-2 mt-2 text-xs text-gray-500'>
                            {notification.metadata.projectName && (
                              <span className='bg-gray-100 px-2 py-1 rounded'>
                                {notification.metadata.projectName}
                              </span>
                            )}
                            {notification.metadata.taskTitle && (
                              <span className='bg-gray-100 px-2 py-1 rounded'>
                                📋 {notification.metadata.taskTitle}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 우선순위 및 시간 */}
                      <div className='flex flex-col items-end gap-1'>
                        {getPriorityBadge(notification.priority) && (
                          <span className='text-sm'>{getPriorityBadge(notification.priority)}</span>
                        )}
                        <div className='flex items-center gap-1 text-xs text-gray-500'>
                          <Clock className='w-3 h-3' />
                          <span title={new Date(notification.createdAt).toLocaleString('ko-KR')}>
                            {notification.relativeTime}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                        )}
                      </div>
                    </div>

                    {/* 액션 힌트 */}
                    {notification.action?.type === 'navigate' && (
                      <div className='flex items-center gap-1 mt-2 text-xs text-blue-600'>
                        <ArrowRight className='w-3 h-3' />
                        클릭하여 이동
                      </div>
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

'use client';

import { notificationsApi } from '@/lib/api';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NotificationDropdown } from './notification-dropdown';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 읽지 않은 알림 개수 조회
  useEffect(() => {
    fetchUnreadCount();
    // 실시간 업데이트를 위한 폴링 (실제로는 WebSocket 사용 권장)
    const interval = setInterval(fetchUnreadCount, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // 읽지 않은 알림인 경우 읽음 처리
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);

        // 로컬 상태 업데이트
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // 알림에 따른 페이지 이동
    if (notification.action?.type === 'navigate' && notification.action.url) {
      let url = notification.action.url;

      // URL 파라미터 치환
      if (notification.action.params) {
        Object.entries(notification.action.params).forEach(([key, value]) => {
          url = url.replace(`:${key}`, String(value));
        });
      }

      // 페이지 이동
      window.location.href = url;
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className={`p-2 hover:bg-gray-100 rounded-md relative transition-colors ${className}`}
        aria-label='알림'
      >
        <Bell className='w-5 h-5 text-gray-600' />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          unreadCount={unreadCount}
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

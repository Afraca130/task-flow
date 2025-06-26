'use client';

import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { invitationsApi, notificationsApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { InvitationModal } from './invitation-modal';
import { NotificationDropdown } from './notification-dropdown';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 초대 모달 상태
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState<any>(null);

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
    if (!user) return;

    fetchUnreadCount();
    // 실시간 업데이트를 위한 폴링 (실제로는 WebSocket 사용 권장)
    const interval = setInterval(fetchUnreadCount, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, [user]);

  // 인증되지 않은 경우 렌더링하지 않음
  if (!user) {
    return null;
  }

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (loading || !user) return;

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
    console.log('🔔 Notification clicked - START:', notification);
    console.log('🔔 Notification type:', notification.type);
    console.log('🔔 Notification action:', notification.action);

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

    // 초대 알림인 경우 특별 처리 (두 가지 타입 모두 지원)
    if (notification.type === 'PROJECT_INVITATION' || notification.type === 'PROJECT_INVITED') {
      console.log('🎯 Project invitation notification clicked:', notification);
      console.log('🔍 Notification type detected:', notification.type);

      try {
        // Get actual invitation data using token
        const token = notification.data?.invitationToken;
        console.log('🔑 Using invitation token:', token);

        if (token) {
          console.log('📞 Fetching invitation details...');
          const invitationData = await invitationsApi.getInvitation(token);
          console.log('Invitation data received:', invitationData);

          // Create enhanced notification with actual invitation data
          const enhancedNotification = {
            ...notification,
            invitationData,
            data: {
              ...notification.data,
              projectName: invitationData.project?.name || notification.data?.projectName,
              inviterName: invitationData.inviter?.name || notification.data?.inviterName,
              projectId: invitationData.projectId,
              invitationToken: token,
            },
          };

          console.log('🎪 Setting enhanced invitation modal to show');
          setCurrentInvitation(enhancedNotification);
          setShowInvitationModal(true);
          setIsOpen(false);
          console.log('✅ Modal state should now be visible');
          return;
        } else {
          console.warn('⚠️ No invitation token found in notification data');
        }
      } catch (error) {
        console.error('❌ Failed to fetch invitation details:', error);
        // Fallback to original notification data
      }

      console.log('🎪 Setting fallback invitation modal to show');
      setCurrentInvitation(notification);
      setShowInvitationModal(true);
      setIsOpen(false);
      console.log('✅ Fallback modal state should now be visible');
      return;
    }

    // 다른 알림의 경우 기본 처리
    console.log('🔄 Handling non-invitation notification');

    if (notification.action?.type === 'navigate' && notification.action.url) {
      console.log('🚀 Navigation action detected:', notification.action);
      let url = notification.action.url;

      // URL 파라미터 치환
      if (notification.action.params) {
        console.log('🔧 Replacing URL parameters:', notification.action.params);
        Object.entries(notification.action.params).forEach(([key, value]) => {
          url = url.replace(`:${key}`, String(value));
        });
      }

      console.log('🎯 Final navigation URL:', url);
      // 페이지 이동
      window.location.href = url;
    } else {
      console.log('❓ No navigation action defined for notification:', {
        hasAction: !!notification.action,
        actionType: notification.action?.type,
        hasUrl: !!notification.action?.url,
      });

      // 기본 동작: 알림 타입에 따른 처리
      switch (notification.type) {
        case 'TASK_ASSIGNED':
        case 'TASK_STATUS_CHANGED':
        case 'TASK_COMPLETED':
          console.log('📋 Task-related notification, considering navigation to tasks');
          if (notification.metadata?.projectId) {
            console.log('🎯 Navigating to project tasks:', notification.metadata.projectId);
            window.location.href = `/projects/${notification.metadata.projectId}/tasks`;
          } else {
            console.log('🎯 Navigating to general tasks page');
            window.location.href = '/tasks';
          }
          break;

        case 'PROJECT_MEMBER_JOINED':
          console.log('👥 Project member notification');
          if (notification.metadata?.projectId) {
            console.log('🎯 Navigating to project people:', notification.metadata.projectId);
            window.location.href = `/projects/${notification.metadata.projectId}`;
          }
          break;

        default:
          console.log('ℹ️ Notification clicked but no specific action defined');
        // 단순히 읽음 처리만 하고 특별한 동작 없음
      }
    }

    console.log('🔔 Closing notification dropdown');
    setIsOpen(false);
  };

  const handleAcceptInvitation = async () => {
    if (!currentInvitation) return;

    console.log('🎯 Accept invitation called with:', currentInvitation);

    try {
      // Try to get token from data, fallback to invitationId for backward compatibility
      const token =
        currentInvitation.data?.invitationToken || currentInvitation.metadata?.invitationId;

      console.log('🔑 Token found:', token);
      console.log('📋 Invitation data:', currentInvitation.data);
      console.log('📋 Invitation metadata:', currentInvitation.metadata);

      if (token) {
        console.log('📞 Calling accept invitation API with token:', token);
        // 실제 초대 수락 API 호출
        await invitationsApi.acceptInvitation(token);
        console.log('Accept invitation API call successful');

        // 알림을 읽음 처리
        await notificationsApi.markAsRead(currentInvitation.id);
        setNotifications(prev =>
          prev.map(n => (n.id === currentInvitation.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        alert('초대를 수락했습니다! 프로젝트 페이지로 이동합니다.');

        // 프로젝트 페이지로 이동
        const projectId =
          currentInvitation.data?.projectId || currentInvitation.metadata?.projectId;
        if (projectId) {
          window.location.href = `/projects/${projectId}`;
        }
      } else {
        console.error('❌ No token found in invitation data');
        alert('초대 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ Failed to accept invitation:', error);
      alert('초대 수락에 실패했습니다.');
    } finally {
      setShowInvitationModal(false);
      setCurrentInvitation(null);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!currentInvitation) return;

    console.log('🎯 Decline invitation called with:', currentInvitation);

    try {
      // Try to get token from data, fallback to invitationId for backward compatibility
      const token =
        currentInvitation.data?.invitationToken || currentInvitation.metadata?.invitationId;

      console.log('🔑 Token found:', token);

      if (token) {
        console.log('📞 Calling decline invitation API with token:', token);
        // 실제 초대 거절 API 호출
        await invitationsApi.declineInvitation(token);
        console.log('Decline invitation API call successful');

        // 알림을 읽음 처리
        await notificationsApi.markAsRead(currentInvitation.id);
        setNotifications(prev =>
          prev.map(n => (n.id === currentInvitation.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        alert('초대를 거절했습니다.');
      } else {
        console.error('❌ No token found in invitation data');
        alert('초대 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ Failed to decline invitation:', error);
      alert('초대 거절에 실패했습니다.');
    } finally {
      setShowInvitationModal(false);
      setCurrentInvitation(null);
    }
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
    <>
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

      {/* 초대 모달 */}
      {console.log('🎭 Rendering InvitationModal with:', {
        isOpen: showInvitationModal,
        currentInvitation: currentInvitation,
        inviterName:
          currentInvitation?.data?.inviterName || currentInvitation?.metadata?.userName || '누군가',
        projectName:
          currentInvitation?.data?.projectName ||
          currentInvitation?.metadata?.projectName ||
          '프로젝트',
      })}
      <InvitationModal
        isOpen={showInvitationModal}
        inviterName={
          currentInvitation?.data?.inviterName || currentInvitation?.metadata?.userName || '누군가'
        }
        projectName={
          currentInvitation?.data?.projectName ||
          currentInvitation?.metadata?.projectName ||
          '프로젝트'
        }
        message={currentInvitation?.message}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
        onClose={() => {
          console.log('🎭 Closing invitation modal');
          setShowInvitationModal(false);
          setCurrentInvitation(null);
        }}
      />
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  ArrowLeft, 
  Filter, 
  Search, 
  CheckCheck, 
  Trash2, 
  Settings,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  X
} from 'lucide-react';

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

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Mock data for demonstration
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'TASK_ASSIGNED',
      priority: 'HIGH',
      title: '새 업무가 할당되었습니다',
      message: '홍길동님이 "로그인 기능 구현" 업무를 할당했습니다.',
      isRead: false,
      createdAt: '2023-12-01T09:00:00Z',
      relativeTime: '2시간 전',
      action: {
        type: 'navigate',
        url: '/tasks/:taskId',
        params: { taskId: 'task-123' }
      },
      metadata: {
        taskId: 'task-123',
        taskTitle: '로그인 기능 구현',
        projectId: 'project-456',
        projectName: '웹 애플리케이션',
        userName: '홍길동'
      }
    },
    {
      id: '2',
      type: 'COMMENT_ADDED',
      priority: 'NORMAL',
      title: '새 댓글이 추가되었습니다',
      message: '김철수님이 "데이터베이스 설계" 업무에 댓글을 작성했습니다.',
      isRead: false,
      createdAt: '2023-12-01T08:30:00Z',
      relativeTime: '3시간 전',
      action: {
        type: 'navigate',
        url: '/tasks/:taskId#comments',
        params: { taskId: 'task-456' }
      },
      metadata: {
        taskId: 'task-456',
        taskTitle: '데이터베이스 설계',
        projectId: 'project-456',
        projectName: '웹 애플리케이션',
        userName: '김철수'
      }
    },
    {
      id: '3',
      type: 'TASK_DUE_SOON',
      priority: 'URGENT',
      title: '업무 마감일이 다가옵니다',
      message: '"API 문서 작성" 업무의 마감일(12월 3일)이 다가옵니다.',
      isRead: true,
      createdAt: '2023-12-01T07:00:00Z',
      relativeTime: '5시간 전',
      action: {
        type: 'navigate',
        url: '/tasks/:taskId',
        params: { taskId: 'task-789' }
      },
      metadata: {
        taskId: 'task-789',
        taskTitle: 'API 문서 작성',
        projectId: 'project-456',
        projectName: '웹 애플리케이션'
      }
    },
    {
      id: '4',
      type: 'PROJECT_INVITED',
      priority: 'NORMAL',
      title: '프로젝트에 초대되었습니다',
      message: '이영희님이 "모바일 앱 개발" 프로젝트에 초대했습니다.',
      isRead: true,
      createdAt: '2023-11-30T16:00:00Z',
      relativeTime: '1일 전',
      action: {
        type: 'navigate',
        url: '/projects/:projectId',
        params: { projectId: 'project-789' }
      },
      metadata: {
        projectId: 'project-789',
        projectName: '모바일 앱 개발',
        userName: '이영희'
      }
    },
    {
      id: '5',
      type: 'TASK_STATUS_CHANGED',
      priority: 'LOW',
      title: '업무 상태가 변경되었습니다',
      message: '박민수님이 "UI 디자인" 업무 상태를 완료로 변경했습니다.',
      isRead: true,
      createdAt: '2023-11-30T14:30:00Z',
      relativeTime: '1일 전',
      action: {
        type: 'navigate',
        url: '/tasks/:taskId',
        params: { taskId: 'task-101' }
      },
      metadata: {
        taskId: 'task-101',
        taskTitle: 'UI 디자인',
        projectId: 'project-456',
        projectName: '웹 애플리케이션',
        userName: '박민수'
      }
    }
  ];

  useEffect(() => {
    fetchNotifications();
  }, [selectedFilter, selectedType, selectedPriority, searchTerm, page]);

  const fetchNotifications = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      let filtered = mockNotifications;
      
      // Apply filters
      if (selectedFilter === 'unread') {
        filtered = filtered.filter(n => !n.isRead);
      } else if (selectedFilter === 'read') {
        filtered = filtered.filter(n => n.isRead);
      }
      
      if (selectedType !== 'all') {
        filtered = filtered.filter(n => n.type === selectedType);
      }
      
      if (selectedPriority !== 'all') {
        filtered = filtered.filter(n => n.priority === selectedPriority);
      }
      
      if (searchTerm) {
        filtered = filtered.filter(n => 
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setNotifications(filtered);
      setLoading(false);
    }, 500);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return '📋';
      case 'TASK_STATUS_CHANGED':
        return '🔄';
      case 'TASK_COMPLETED':
        return '✅';
      case 'COMMENT_ADDED':
        return '💬';
      case 'PROJECT_INVITED':
        return '👥';
      case 'PROJECT_MEMBER_JOINED':
        return '🎉';
      case 'TASK_DUE_SOON':
        return '⏰';
      case 'TASK_OVERDUE':
        return '🚨';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-red-500 bg-red-50';
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50';
      case 'NORMAL':
        return 'border-l-blue-500 bg-blue-50';
      case 'LOW':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { icon: '🚨', text: '긴급', color: 'bg-red-100 text-red-700' };
      case 'HIGH':
        return { icon: '🔥', text: '높음', color: 'bg-orange-100 text-orange-700' };
      case 'NORMAL':
        return { icon: '📌', text: '보통', color: 'bg-blue-100 text-blue-700' };
      case 'LOW':
        return { icon: '📝', text: '낮음', color: 'bg-gray-100 text-gray-700' };
      default:
        return { icon: '📝', text: '보통', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await fetch(`/api/v1/notifications/${notification.id}/read`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate based on action
    if (notification.action?.type === 'navigate' && notification.action.url) {
      let url = notification.action.url;
      
      if (notification.action.params) {
        Object.entries(notification.action.params).forEach(([key, value]) => {
          url = url.replace(`:${key}`, String(value));
        });
      }
      
      router.push(url);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/v1/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-gray-700" />
                <h1 className="text-xl font-semibold text-gray-900">알림</h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <CheckCheck className="w-4 h-4" />
                  모두 읽음
                </button>
              )}
              <button className="p-2 hover:bg-gray-100 rounded-md">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="알림 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">모든 알림</option>
                <option value="unread">읽지 않음</option>
                <option value="read">읽음</option>
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">모든 유형</option>
                <option value="TASK_ASSIGNED">업무 할당</option>
                <option value="COMMENT_ADDED">댓글</option>
                <option value="TASK_DUE_SOON">마감 임박</option>
                <option value="PROJECT_INVITED">프로젝트 초대</option>
              </select>
              
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">모든 우선순위</option>
                <option value="URGENT">긴급</option>
                <option value="HIGH">높음</option>
                <option value="NORMAL">보통</option>
                <option value="LOW">낮음</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">알림을 불러오는 중...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">알림이 없습니다</h3>
              <p className="text-gray-500">
                {searchTerm || selectedFilter !== 'all' || selectedType !== 'all' || selectedPriority !== 'all'
                  ? '검색 조건에 맞는 알림이 없습니다.'
                  : '새로운 알림이 없습니다.'}
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const priorityBadge = getPriorityBadge(notification.priority);
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all ${
                    !notification.isRead ? `border-l-4 ${getPriorityColor(notification.priority)}` : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className={`mt-1 ${
                            !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {notification.message}
                          </p>
                          
                          {/* Metadata */}
                          {notification.metadata && (
                            <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                              {notification.metadata.projectName && (
                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                  📁 {notification.metadata.projectName}
                                </span>
                              )}
                              {notification.metadata.taskTitle && (
                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                  📋 {notification.metadata.taskTitle}
                                </span>
                              )}
                              {notification.metadata.userName && (
                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                  👤 {notification.metadata.userName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Priority and Time */}
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityBadge.color}`}>
                            <span>{priorityBadge.icon}</span>
                            {priorityBadge.text}
                          </span>
                          
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {notification.relativeTime}
                          </div>
                          
                          {!notification.isRead && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More */}
        {hasMore && notifications.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setPage(prev => prev + 1)}
              className="px-6 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              더 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
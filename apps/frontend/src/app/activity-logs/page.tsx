'use client';

import { useAuthStore } from '@/store/auth';
import {
  AlertCircle,
  Calendar,
  CheckSquare,
  Clock,
  Folder,
  MessageCircle,
  Search,
  User,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ActivityLog {
  id: string;
  userId: string;
  projectId: string;
  entityId: string;
  entityType: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

const getActionIcon = (action: string, entityType: string) => {
  switch (action) {
    case 'CREATE':
      if (entityType === 'Task') return <CheckSquare className='h-4 w-4 text-green-500' />;
      if (entityType === 'Project') return <Folder className='h-4 w-4 text-blue-500' />;
      if (entityType === 'Issue') return <AlertCircle className='h-4 w-4 text-red-500' />;
      return <User className='h-4 w-4 text-gray-500' />;
    case 'UPDATE':
      return <Clock className='h-4 w-4 text-yellow-500' />;
    case 'DELETE':
      return <UserMinus className='h-4 w-4 text-red-500' />;
    case 'COMMENT':
      return <MessageCircle className='h-4 w-4 text-purple-500' />;
    case 'ASSIGN':
      return <UserPlus className='h-4 w-4 text-blue-500' />;
    case 'JOIN':
      return <UserPlus className='h-4 w-4 text-green-500' />;
    case 'LEAVE':
      return <UserMinus className='h-4 w-4 text-red-500' />;
    default:
      return <Clock className='h-4 w-4 text-gray-500' />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'bg-green-100 border-green-200';
    case 'UPDATE':
      return 'bg-yellow-100 border-yellow-200';
    case 'DELETE':
      return 'bg-red-100 border-red-200';
    case 'COMMENT':
      return 'bg-purple-100 border-purple-200';
    case 'ASSIGN':
      return 'bg-blue-100 border-blue-200';
    case 'JOIN':
      return 'bg-green-100 border-green-200';
    case 'LEAVE':
      return 'bg-red-100 border-red-200';
    default:
      return 'bg-gray-100 border-gray-200';
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;

  return time.toLocaleDateString('ko-KR');
};

export default function ActivityLogsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchActivityLogs();
    }
  }, [isAuthenticated, filterType, selectedProject]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/v1/activity-logs/recent?limit=50';

      if (selectedProject !== 'all') {
        url += `&projectId=${selectedProject}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('활동 로그를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setActivityLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchActivityLogs();
      return;
    }

    try {
      setLoading(true);
      let url = `/api/v1/activity-logs/search?q=${encodeURIComponent(searchQuery)}&limit=50`;

      if (selectedProject !== 'all') {
        url += `&projectId=${selectedProject}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('검색에 실패했습니다.');
      }

      const data = await response.json();
      setActivityLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    if (filterType === 'all') return true;
    return log.action === filterType;
  });

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>로그인이 필요합니다</h2>
          <p className='text-gray-600'>활동 로그를 보려면 먼저 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>활동 로그</h1>
          <p className='text-gray-600'>프로젝트 내 모든 활동을 확인할 수 있습니다.</p>
        </div>

        {/* Search and Filter Bar */}
        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <div className='flex flex-col sm:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                <input
                  type='text'
                  placeholder='활동 내용 검색...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div>

            {/* Action Filter */}
            <div className='sm:w-48'>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='all'>모든 활동</option>
                <option value='CREATE'>생성</option>
                <option value='UPDATE'>수정</option>
                <option value='DELETE'>삭제</option>
                <option value='COMMENT'>댓글</option>
                <option value='ASSIGN'>할당</option>
                <option value='JOIN'>참여</option>
                <option value='LEAVE'>탈퇴</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              검색
            </button>
          </div>
        </div>

        {/* Activity Logs */}
        <div className='bg-white rounded-lg shadow'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-2 text-gray-600'>로딩 중...</span>
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>오류가 발생했습니다</h3>
              <p className='text-gray-600 mb-4'>{error}</p>
              <button
                onClick={fetchActivityLogs}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
              >
                다시 시도
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className='text-center py-12'>
              <Clock className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>활동 로그가 없습니다</h3>
              <p className='text-gray-600'>아직 기록된 활동이 없습니다.</p>
            </div>
          ) : (
            <div className='divide-y divide-gray-200'>
              {filteredLogs.map(log => (
                <div key={log.id} className='p-6 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-start space-x-4'>
                    {/* Icon */}
                    <div className={`p-2 rounded-full border ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action, log.entityType)}
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                          <span className='font-medium text-gray-900'>
                            {log.user?.name || '알 수 없는 사용자'}
                          </span>
                          {log.project && (
                            <>
                              <span className='text-gray-400'>in</span>
                              <span className='font-medium text-blue-600'>{log.project.name}</span>
                            </>
                          )}
                        </div>
                        <div className='flex items-center text-sm text-gray-500'>
                          <Calendar className='h-4 w-4 mr-1' />
                          {formatTimeAgo(log.timestamp)}
                        </div>
                      </div>

                      <p className='mt-1 text-gray-700'>{log.description}</p>

                      {/* Metadata */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className='mt-2 text-xs text-gray-500'>
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <span key={key} className='mr-4'>
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredLogs.length > 0 && filteredLogs.length >= 50 && (
          <div className='text-center mt-6'>
            <button
              onClick={() => {
                // TODO: Implement pagination
                console.log('Load more logs');
              }}
              className='px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors'
            >
              더 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

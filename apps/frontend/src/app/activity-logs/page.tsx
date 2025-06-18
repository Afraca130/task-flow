'use client';

import { ActivityLog, activityLogsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  Clock,
  Folder,
  MessageCircle,
  Search,
  User,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { projects } = useProjectsStore();
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

      // Use the activity logs API from api.ts
      const projectId = selectedProject !== 'all' ? selectedProject : undefined;
      const logs = await activityLogsApi.getActivityLogs(projectId);
      setActivityLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : '활동 로그를 불러오는데 실패했습니다.');
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

    // For now, filter locally since backend search endpoint might not exist
    const filtered = activityLogs.filter(
      log =>
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setActivityLogs(filtered);
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
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto py-8 px-4'>
        {/* Header with back button */}
        <div className='flex items-center gap-4 mb-8'>
          <button
            onClick={() => router.back()}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>활동 로그</h1>
            <p className='text-gray-600'>프로젝트 내 모든 활동을 확인할 수 있습니다.</p>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='text'
                placeholder='활동 검색...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
                className='pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* Action Filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>모든 프로젝트</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity Logs */}
        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>활동 로그를 불러오는 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className='text-center py-12'>
            <AlertCircle className='w-16 h-16 text-red-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>오류가 발생했습니다</h3>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={fetchActivityLogs}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              다시 시도
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className='text-center py-12'>
            <Clock className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>활동 로그가 없습니다</h3>
            <p className='text-gray-600'>아직 활동 내역이 없습니다.</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className={`bg-white rounded-lg border p-6 ${getActionColor(log.action)}`}
              >
                <div className='flex items-start space-x-4'>
                  <div className='flex-shrink-0 mt-1'>
                    {getActionIcon(log.action, log.entityType)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center space-x-2'>
                        <span className='font-medium text-gray-900'>
                          {log.user?.name || '알 수 없는 사용자'}
                        </span>
                        <span className='text-sm text-gray-500'>·</span>
                        <span className='text-sm text-gray-500'>
                          {log.project?.name || '알 수 없는 프로젝트'}
                        </span>
                      </div>
                      <time className='text-sm text-gray-500'>{formatTimeAgo(log.createdAt)}</time>
                    </div>
                    <p className='text-gray-700 mb-2'>{log.description}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className='text-xs text-gray-500 bg-gray-50 rounded-md p-2 mt-2'>
                        <pre className='whitespace-pre-wrap'>
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
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

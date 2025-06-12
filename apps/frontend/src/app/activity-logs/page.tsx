'use client';

import { activityLogsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import { Activity, ArrowLeft, Filter, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ActivityLogItem {
  id: string;
  userId: string;
  projectId: string;
  entityId: string;
  entityType: string;
  action: string;
  description: string;
  timestamp: string;
  user?: any;
  project?: any;
}

// 사용자별 색상 생성 함수
const getUserColor = (userId: string) => {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6366F1',
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
};

const getUserColorStyle = (user: any) => {
  if (user?.profileColor) {
    return { backgroundColor: user.profileColor };
  }
  return { backgroundColor: user?.id ? getUserColor(user.id) : '#3B82F6' };
};

const actionTypeLabels: Record<string, string> = {
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  ASSIGN: '할당',
  COMPLETE: '완료',
  COMMENT: '댓글',
  JOIN: '참여',
  LEAVE: '탈퇴',
};

const entityTypeLabels: Record<string, string> = {
  Task: '작업',
  Project: '프로젝트',
  User: '사용자',
  Comment: '댓글',
  ProjectMember: '프로젝트 멤버',
};

export default function ActivityLogsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { projects } = useProjectsStore();

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadActivityLogs();
  }, [isAuthenticated, selectedProject]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const logs = await activityLogsApi.getActivityLogs(
        selectedProject === 'all' ? undefined : selectedProject
      );
      setActivityLogs(logs);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 로그
  const filteredLogs = activityLogs.filter(log => {
    // 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (
        !log.description.toLowerCase().includes(searchLower) &&
        !log.user?.name?.toLowerCase().includes(searchLower) &&
        !log.project?.name?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // 엔터티 타입 필터
    if (selectedEntityType !== 'all' && log.entityType !== selectedEntityType) {
      return false;
    }

    // 액션 필터
    if (selectedAction !== 'all' && log.action !== selectedAction) {
      return false;
    }

    // 날짜 필터
    if (dateFilter !== 'all') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case 'today':
          if (diffDays > 0) return false;
          break;
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
      }
    }

    return true;
  });

  // 고유한 액션 타입들
  const uniqueActions = Array.from(new Set(activityLogs.map(log => log.action)));
  const uniqueEntityTypes = Array.from(new Set(activityLogs.map(log => log.entityType)));

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.push('/insights')}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>활동 로그</h1>
              <p className='text-gray-600'>프로젝트의 모든 활동 내역을 확인하세요</p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='relative'>
              <Search className='w-5 h-5 absolute left-3 top-3 text-gray-400' />
              <input
                type='text'
                placeholder='활동 검색...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-80 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Filter className='w-5 h-5 text-gray-500' />
            <h3 className='text-lg font-medium text-gray-900'>필터</h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* 프로젝트 필터 */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>프로젝트</label>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>모든 프로젝트</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 엔터티 타입 필터 */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>유형</label>
              <select
                value={selectedEntityType}
                onChange={e => setSelectedEntityType(e.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>모든 유형</option>
                {uniqueEntityTypes.map(type => (
                  <option key={type} value={type}>
                    {entityTypeLabels[type] || type}
                  </option>
                ))}
              </select>
            </div>

            {/* 액션 필터 */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>액션</label>
              <select
                value={selectedAction}
                onChange={e => setSelectedAction(e.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>모든 액션</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {actionTypeLabels[action] || action}
                  </option>
                ))}
              </select>
            </div>

            {/* 날짜 필터 */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>기간</label>
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>전체 기간</option>
                <option value='today'>오늘</option>
                <option value='week'>최근 7일</option>
                <option value='month'>최근 30일</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900'>활동 내역</h3>
              <span className='text-sm text-gray-500'>총 {filteredLogs.length}개의 활동</span>
            </div>
          </div>

          {loading ? (
            <div className='flex items-center justify-center h-64'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <p className='text-gray-500'>활동 로그를 불러오는 중...</p>
              </div>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className='divide-y divide-gray-200'>
              {filteredLogs.map(log => (
                <div key={log.id} className='p-6 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-start gap-4'>
                    <div
                      className='w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0'
                      style={getUserColorStyle(log.user)}
                    >
                      {log.user?.name?.charAt(0) || 'U'}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <p className='text-sm text-gray-900'>
                            <span className='font-medium'>
                              {log.user?.name || '알 수 없는 사용자'}
                            </span>{' '}
                            <span className='text-gray-600'>{log.description}</span>
                          </p>

                          <div className='flex items-center gap-4 mt-2'>
                            <div className='flex items-center gap-2'>
                              <span className='text-xs text-gray-500'>
                                {new Date(log.timestamp).toLocaleString('ko-KR')}
                              </span>
                            </div>

                            {log.project && (
                              <div className='flex items-center gap-2'>
                                <span className='text-xs text-gray-400'>•</span>
                                <span className='text-xs text-gray-500'>{log.project.name}</span>
                              </div>
                            )}

                            <div className='flex items-center gap-2'>
                              <span className='text-xs text-gray-400'>•</span>
                              <span className='text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full'>
                                {entityTypeLabels[log.entityType] || log.entityType}
                              </span>
                            </div>

                            <div className='flex items-center gap-2'>
                              <span className='text-xs text-gray-400'>•</span>
                              <span className='text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full'>
                                {actionTypeLabels[log.action] || log.action}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <Activity className='w-12 h-12 text-gray-300 mx-auto mb-3' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>활동 내역이 없습니다</h3>
              <p className='text-gray-500'>
                {searchTerm ||
                selectedProject !== 'all' ||
                selectedEntityType !== 'all' ||
                selectedAction !== 'all' ||
                dateFilter !== 'all'
                  ? '필터 조건에 맞는 활동이 없습니다.'
                  : '아직 활동 내역이 없습니다.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

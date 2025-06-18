'use client';

import {
  Activity,
  ArrowLeft,
  FolderOpen,
  List,
  Mail,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ActivityLog, activityLogsApi, projectsApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { useProjectsStore } from '../../store/projects';

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { projects, setProjects } = useProjectsStore();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Load projects
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadProjects = async () => {
      try {
        const result = await projectsApi.getProjects({ page: 1, limit: 100 });
        const projectList = Array.isArray(result) ? result : result.projects || [];
        setProjects(projectList);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      }
    };

    loadProjects();
  }, [isAuthenticated, setProjects]);

  // Load activity logs
  useEffect(() => {
    if (!isAuthenticated) return;
    loadActivityLogs();
  }, [isAuthenticated, currentPage, searchTerm]);

  const loadActivityLogs = async () => {
    setLoading(true);
    try {
      const logs = await activityLogsApi.getActivityLogs();
      setActivityLogs(logs);
      setTotalPages(Math.ceil(logs.length / itemsPerPage));
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getFilteredLogs = () => {
    let filtered = activityLogs || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        log =>
          log.description?.toLowerCase().includes(term) ||
          log.user?.name?.toLowerCase().includes(term) ||
          log.project?.name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const getPaginatedLogs = () => {
    const filtered = getFilteredLogs();
    if (!Array.isArray(filtered)) {
      return [];
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'Task':
        return <List className='w-4 h-4' />;
      case 'Project':
        return <FolderOpen className='w-4 h-4' />;
      case 'User':
        return <UserCheck className='w-4 h-4' />;
      case 'Comment':
        return <Mail className='w-4 h-4' />;
      case 'ProjectMember':
        return <Users className='w-4 h-4' />;
      default:
        return <Activity className='w-4 h-4' />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'text-green-600';
      case 'UPDATE':
        return 'text-blue-600';
      case 'DELETE':
        return 'text-red-600';
      case 'COMMENT':
        return 'text-purple-600';
      case 'ASSIGN':
        return 'text-yellow-600';
      case 'UNASSIGN':
        return 'text-orange-600';
      case 'STATUS_CHANGE':
        return 'text-indigo-600';
      case 'PRIORITY_CHANGE':
        return 'text-pink-600';
      case 'JOIN':
        return 'text-emerald-600';
      case 'LEAVE':
        return 'text-rose-600';
      case 'INVITE':
        return 'text-violet-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimestamp = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) {
      return `${diffInMins}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (!isAuthenticated) {
    return null;
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
            <h1 className='text-3xl font-bold text-gray-900'>활동 리포트</h1>
            <p className='text-gray-600'>프로젝트 활동을 자세히 분석하세요</p>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='text'
                placeholder='활동 검색...'
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                className='pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* Page Info */}
            <div className='flex items-center justify-center bg-gray-50 rounded-md px-4 py-2'>
              <span className='text-sm text-gray-600'>
                {currentPage} / {totalPages} 페이지
              </span>
            </div>
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
        ) : getPaginatedLogs().length === 0 ? (
          <div className='text-center py-12'>
            <Activity className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>활동 로그가 없습니다</h3>
            <p className='text-gray-600'>조건에 맞는 활동 내역이 없습니다.</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {getPaginatedLogs().map(log => (
              <div
                key={log.id}
                className='bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow'
              >
                <div className='flex items-start space-x-4'>
                  <div className='flex-shrink-0 mt-1'>{getEntityTypeIcon(log.entityType)}</div>
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
                        <span className='text-sm text-gray-500'>·</span>
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                      <time className='text-sm text-gray-500'>
                        {formatTimestamp(log.createdAt)}
                      </time>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex items-center justify-center space-x-2 mt-8'>
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  이전
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

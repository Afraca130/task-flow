'use client';

import { NotificationBell } from '@/components/notifications/notification-bell';
import { activityLogsApi, projectsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  List,
  Mail,
  Menu,
  Search,
  Settings,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
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

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { projects, setProjects } = useProjectsStore();
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const itemsPerPage = 20;

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
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
  }, [isAuthenticated, selectedProjectId, selectedEntityType, currentPage, searchTerm]);

  const loadActivityLogs = async () => {
    setLoading(true);
    try {
      const logs = await activityLogsApi.getActivityLogs(
        selectedProjectId !== 'all' ? selectedProjectId : undefined
      );
      setActivityLogs(logs);
      setTotalPages(Math.ceil(logs.length / itemsPerPage));
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage(1);
  };

  const handleEntityTypeChange = (entityType: string) => {
    setSelectedEntityType(entityType);
    setCurrentPage(1);
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

    if (selectedEntityType !== 'all') {
      filtered = filtered.filter(log => log.entityType === selectedEntityType);
    }

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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
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

  function NavItem({
    icon,
    label,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }) {
    return (
      <button
        onClick={onClick}
        className='flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex flex-col h-full'>
          <div className='flex items-center justify-between p-4 border-b border-gray-200'>
            <h1 className='text-lg font-semibold text-gray-900'>TaskFlow</h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className='p-2 text-gray-500 hover:text-gray-700 lg:hidden'
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          <nav className='flex-1 p-4 space-y-1'>
            <NavItem
              icon={<BarChart3 className='w-5 h-5' />}
              label='대시보드'
              onClick={() => router.push('/dashboard')}
            />
            <NavItem
              icon={<List className='w-5 h-5' />}
              label='작업'
              onClick={() => router.push('/tasks')}
            />
            <NavItem
              icon={<FolderOpen className='w-5 h-5' />}
              label='프로젝트'
              onClick={() => router.push('/projects')}
            />
            <NavItem
              icon={<Activity className='w-5 h-5' />}
              label='활동 로그'
              onClick={() => router.push('/reports')}
            />
            <NavItem
              icon={<Settings className='w-5 h-5' />}
              label='설정'
              onClick={() => router.push('/settings')}
            />
          </nav>
        </div>
      </div>

      {/* Main Layout */}
      <div className='flex h-screen'>
        {/* Desktop Sidebar */}
        <aside className='hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white'>
          <div className='flex flex-col flex-1'>
            <div className='flex items-center justify-between p-4 border-b border-gray-200'>
              <h1 className='text-lg font-semibold text-gray-900'>TaskFlow</h1>
            </div>

            <nav className='flex-1 p-4 space-y-1'>
              <NavItem
                icon={<BarChart3 className='w-5 h-5' />}
                label='대시보드'
                onClick={() => router.push('/dashboard')}
              />
              <NavItem
                icon={<List className='w-5 h-5' />}
                label='작업'
                onClick={() => router.push('/tasks')}
              />
              <NavItem
                icon={<FolderOpen className='w-5 h-5' />}
                label='프로젝트'
                onClick={() => router.push('/projects')}
              />
              <NavItem
                icon={<Activity className='w-5 h-5' />}
                label='활동 로그'
                onClick={() => router.push('/reports')}
              />
              <NavItem
                icon={<Settings className='w-5 h-5' />}
                label='설정'
                onClick={() => router.push('/settings')}
              />
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className='flex-1 lg:pl-64'>
          {/* Top Navigation */}
          <div className='sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200'>
            <div className='flex items-center'>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className='p-2 text-gray-500 hover:text-gray-700 lg:hidden'
              >
                <Menu className='w-5 h-5' />
              </button>
              <h1 className='ml-4 text-lg font-semibold text-gray-900'>활동 로그</h1>
            </div>

            <div className='flex items-center gap-4'>
              <NotificationBell />
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium'>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className='text-sm font-medium text-gray-700'>{user?.name || 'User'}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='p-6'>
            {/* Filters */}
            <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
                <select
                  value={selectedProjectId}
                  onChange={e => handleProjectChange(e.target.value)}
                  className='px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='all'>전체 프로젝트</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedEntityType}
                  onChange={e => handleEntityTypeChange(e.target.value)}
                  className='px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='all'>전체 활동</option>
                  <option value='Task'>작업</option>
                  <option value='Project'>프로젝트</option>
                  <option value='User'>사용자</option>
                  <option value='Comment'>댓글</option>
                  <option value='ProjectMember'>프로젝트 멤버</option>
                </select>
              </div>

              <div className='relative'>
                <input
                  type='text'
                  placeholder='활동 검색...'
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className='w-full sm:w-64 px-3 py-2 pl-10 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
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
            ) : (
              <div className='space-y-4'>
                {getPaginatedLogs().map(log => (
                  <div
                    key={log.id}
                    className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-start gap-4'>
                      <div className='flex-shrink-0'>
                        <div className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center'>
                          {getEntityTypeIcon(log.entityType)}
                        </div>
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium text-gray-900'>
                              {log.user?.name || 'Unknown User'}
                            </span>
                            <span className={`text-sm ${getActionColor(log.action)}`}>
                              {log.description}
                            </span>
                          </div>
                          <span className='text-xs text-gray-500'>
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>

                        {log.project && (
                          <div className='mt-1 flex items-center gap-1'>
                            <FolderOpen className='w-3 h-3 text-gray-400' />
                            <span className='text-xs text-gray-500'>{log.project.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='flex items-center justify-between mt-6'>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className='flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <ChevronLeft className='w-4 h-4' />
                      이전
                    </button>

                    <div className='flex items-center gap-2'>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 text-sm rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className='flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      다음
                      <ChevronRight className='w-4 h-4' />
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {getFilteredLogs().length === 0 && (
                  <div className='text-center py-12'>
                    <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center'>
                      <Activity className='w-8 h-8 text-gray-400' />
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>활동 로그가 없습니다</h3>
                    <p className='text-gray-500'>
                      {searchTerm
                        ? '검색 결과가 없습니다. 다른 검색어를 시도해보세요.'
                        : '아직 프로젝트 활동이 없습니다.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

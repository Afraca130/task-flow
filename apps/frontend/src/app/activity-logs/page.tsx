'use client';

import { NotificationBell } from '@/components/notifications/notification-bell';
import { activityLogsApi, projectsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  FolderOpen,
  HelpCircle,
  List,
  Mail,
  Menu,
  Play,
  Search,
  Settings,
  UserCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 사용자별 색상 생성 함수
const getUserColor = (userId: string) => {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#EC4899', // pink
    '#6366F1', // indigo
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

export default function ActivityLogsPage() {
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
    try {
      setLoading(true);

      const logs = await activityLogsApi.getActivityLogs(
        selectedProjectId === 'all' ? undefined : selectedProjectId
      );

      // 필터링
      let filteredLogs = logs;

      if (selectedEntityType !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.entityType === selectedEntityType);
      }

      if (searchTerm) {
        filteredLogs = filteredLogs.filter(
          log =>
            log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // 페이지네이션
      const totalItems = filteredLogs.length;
      const totalPagesCount = Math.ceil(totalItems / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      setActivityLogs(paginatedLogs);
      setTotalPages(totalPagesCount);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      setActivityLogs([]);
    } finally {
      setLoading(false);
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

  const handleNavigation = (path: string) => {
    if (path.startsWith('/')) {
      router.push(path);
    } else {
      alert('이 기능은 곧 출시될 예정입니다!');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <div className='w-2 h-2 bg-green-500 rounded-full' />;
      case 'UPDATE':
        return <div className='w-2 h-2 bg-blue-500 rounded-full' />;
      case 'DELETE':
        return <div className='w-2 h-2 bg-red-500 rounded-full' />;
      default:
        return <div className='w-2 h-2 bg-gray-500 rounded-full' />;
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Main Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-[240px_1fr] grid-rows-[56px_1fr] h-screen'>
        {/* Header */}
        <header className='lg:col-span-2 bg-white border-b border-gray-200 flex items-center justify-between px-6'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className='lg:hidden p-2 hover:bg-gray-100 rounded-md'
            >
              <Menu className='w-5 h-5' />
            </button>

            {/* TaskFlow 제목 - 클릭 시 대시보드로 이동 */}
            <button
              onClick={() => router.push('/dashboard')}
              className='text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors'
            >
              TaskFlow
            </button>
          </div>

          <div className='flex-1 max-w-md mx-4'>
            <div className='relative'>
              <Search className='w-5 h-5 absolute left-3 top-3 text-gray-400' />
              <input
                type='text'
                placeholder='활동 검색...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <NotificationBell />
            <button className='p-2 hover:bg-gray-100 rounded-lg'>
              <Settings className='w-5 h-5' />
            </button>
            <button className='p-2 hover:bg-gray-100 rounded-lg'>
              <HelpCircle className='w-5 h-5' />
            </button>

            <div className='flex items-center gap-3'>
              <button
                onClick={() => router.push('/profile')}
                className='flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors'
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${!user?.profileColor ? 'bg-blue-500' : ''}`}
                  style={getUserColorStyle(user)}
                >
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className='hidden sm:block text-left'>
                  <div className='text-sm font-medium text-gray-900'>{user?.name || '사용자'}</div>
                  <div className='text-xs text-gray-500'>{user?.email || 'user@example.com'}</div>
                </div>
                <ChevronDown className='w-4 h-4 text-gray-400' />
              </button>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <aside
          className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200 transition-transform lg:transition-none`}
        >
          <div className='flex flex-col h-full'>
            <nav className='flex-1 p-4 space-y-6'>
              <div>
                <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                  프로젝트
                </div>
                <div className='space-y-1'>
                  <NavItem
                    icon={<FolderOpen className='w-4 h-4 text-blue-500' />}
                    label='프로젝트 보기'
                    onClick={() => handleNavigation('/projects')}
                  />
                  <select
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                    className='w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
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

              <div>
                <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                  계획
                </div>
                <div className='space-y-1'>
                  <NavItem
                    icon={<Calendar className='w-4 h-4 text-blue-500' />}
                    label='로드맵'
                    onClick={() => handleNavigation('roadmap')}
                  />
                  <NavItem
                    icon={<List className='w-4 h-4 text-green-500' />}
                    label='이슈'
                    onClick={() => handleNavigation('/dashboard')}
                  />
                  <NavItem
                    icon={<Play className='w-4 h-4 text-purple-500' />}
                    label='백로그'
                    onClick={() => handleNavigation('backlog')}
                  />
                </div>
              </div>

              <div>
                <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                  팀
                </div>
                <div className='space-y-1'>
                  <NavItem
                    icon={<UserCheck className='w-4 h-4 text-green-500' />}
                    label='프로젝트 설정'
                    onClick={() => handleNavigation('/projects')}
                  />
                  <NavItem
                    icon={<Mail className='w-4 h-4 text-blue-500' />}
                    label='초대'
                    onClick={() => handleNavigation('invite')}
                  />
                </div>
              </div>

              <div>
                <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                  분석
                </div>
                <div className='space-y-1'>
                  <NavItem
                    icon={<BarChart3 className='w-4 h-4 text-indigo-500' />}
                    label='분석'
                    onClick={() => handleNavigation('/analytics')}
                  />
                  <NavItem
                    icon={<FileText className='w-4 h-4 text-violet-500' />}
                    label='리포트'
                    onClick={() => handleNavigation('reports')}
                  />
                </div>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className='overflow-auto p-6'>
          <div className='max-w-7xl mx-auto space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>활동 로그</h1>
                <p className='text-gray-600'>
                  {selectedProject ? selectedProject.name : '전체 프로젝트'}의 활동 내역
                </p>
              </div>

              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <Filter className='w-4 h-4 text-gray-500' />
                  <select
                    value={selectedEntityType}
                    onChange={e => setSelectedEntityType(e.target.value)}
                    className='px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='all'>모든 활동</option>
                    <option value='TASK'>작업</option>
                    <option value='PROJECT'>프로젝트</option>
                    <option value='COMMENT'>댓글</option>
                    <option value='USER'>사용자</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Activity Logs */}
            <div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
              {loading ? (
                <div className='flex items-center justify-center h-64'>
                  <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                    <p className='text-gray-500'>활동 로그를 불러오는 중...</p>
                  </div>
                </div>
              ) : activityLogs.length > 0 ? (
                <>
                  <div className='divide-y divide-gray-200'>
                    {activityLogs.map(log => (
                      <div key={log.id} className='p-6 hover:bg-gray-50 transition-colors'>
                        <div className='flex items-start gap-4'>
                          <div
                            className='w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0'
                            style={getUserColorStyle(log.user)}
                          >
                            {log.user?.name?.charAt(0) || 'U'}
                          </div>

                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                              {getActionIcon(log.action)}
                              <span className='text-sm font-medium text-gray-900'>
                                {log.user?.name || '알 수 없는 사용자'}
                              </span>
                              <span className='text-sm text-gray-600'>{log.description}</span>
                            </div>

                            <div className='flex items-center gap-4 text-xs text-gray-500'>
                              <span>{new Date(log.timestamp).toLocaleString('ko-KR')}</span>
                              {log.project && (
                                <>
                                  <span>•</span>
                                  <span>{log.project.name}</span>
                                </>
                              )}
                              <span>•</span>
                              <span className='px-2 py-1 bg-gray-100 rounded-full'>
                                {log.entityType}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
                      <div className='text-sm text-gray-500'>
                        페이지 {currentPage} / {totalPages}
                      </div>

                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className='p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <ChevronLeft className='w-4 h-4' />
                        </button>

                        <div className='flex items-center gap-1'>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 text-sm rounded ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className='p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <ChevronRight className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className='text-center py-12'>
                  <Activity className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>활동 로그가 없습니다</h3>
                  <p className='text-gray-500'>
                    {searchTerm || selectedEntityType !== 'all' || selectedProjectId !== 'all'
                      ? '검색 조건에 맞는 활동이 없습니다.'
                      : '아직 활동 내역이 없습니다.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

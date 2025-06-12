'use client';

import { NotificationBell } from '@/components/notifications/notification-bell';
import { activityLogsApi, projectsApi, Task, tasksApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calendar,
  ChevronDown,
  FolderOpen,
  HelpCircle,
  List,
  Menu,
  Search,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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

interface MemberPerformance {
  userId: string;
  userName: string;
  userColor: string;
  dailyTasks: { date: string; count: number }[];
  totalCompleted: number;
}

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

export default function InsightsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { projects, setProjects } = useProjectsStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState(30); // 기본 30일

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
        const projectList = Array.isArray(result) ? result : result.data || [];
        setProjects(projectList);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      }
    };

    loadProjects();
  }, [isAuthenticated, setProjects]);

  // Load data
  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated, selectedProjectId, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load tasks
      let allTasks: Task[] = [];
      if (selectedProjectId === 'all') {
        const result = await tasksApi.getTasks({ limit: 1000 });
        allTasks = result.data || [];
      } else {
        allTasks = await tasksApi.getTasksByProject(selectedProjectId);
      }

      // Filter tasks by date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dateRange);
      const filteredTasks = allTasks.filter(task => {
        const taskDate = new Date(task.updatedAt);
        return taskDate >= cutoffDate;
      });

      setTasks(filteredTasks);

      // Load activity logs
      const logs = await activityLogsApi.getActivityLogs(
        selectedProjectId === 'all' ? undefined : selectedProjectId
      );
      setActivityLogs(logs.slice(0, 10)); // 최근 10개만
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 멤버별 성과 데이터 계산
  const memberPerformanceData = useMemo(() => {
    const memberMap = new Map<string, MemberPerformance>();
    const dateMap = new Map<string, number>();

    // 날짜 범위 생성
    const dates: string[] = [];
    for (let i = dateRange - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // 완료된 작업만 필터링
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED');

    completedTasks.forEach(task => {
      if (!task.assignee) return;

      const userId = task.assignee.id;
      const userName = task.assignee.name;
      const userColor = task.assignee.profileColor || getUserColor(userId);
      const taskDate = new Date(task.updatedAt).toISOString().split('T')[0];

      if (!memberMap.has(userId)) {
        memberMap.set(userId, {
          userId,
          userName,
          userColor,
          dailyTasks: dates.map(date => ({ date, count: 0 })),
          totalCompleted: 0,
        });
      }

      const member = memberMap.get(userId)!;
      member.totalCompleted++;

      // 해당 날짜의 작업 수 증가
      const dayData = member.dailyTasks.find(d => d.date === taskDate);
      if (dayData) {
        dayData.count++;
      }
    });

    return Array.from(memberMap.values());
  }, [tasks, dateRange]);

  // 라인 차트 데이터 (날짜별 멤버 작업 수)
  const lineChartData = useMemo(() => {
    const dates: string[] = [];
    for (let i = dateRange - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates.map(date => {
      const dataPoint: any = {
        date: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      };

      memberPerformanceData.forEach(member => {
        const dayData = member.dailyTasks.find(d => d.date === date);
        dataPoint[member.userName] = dayData?.count || 0;
      });

      return dataPoint;
    });
  }, [memberPerformanceData, dateRange]);

  // 막대 차트 데이터 (총 누적 수)
  const barChartData = useMemo(() => {
    return memberPerformanceData.map(member => ({
      name: member.userName,
      total: member.totalCompleted,
      color: member.userColor,
    }));
  }, [memberPerformanceData]);

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

            {/* TaskFlow 제목 - 클릭 시 인사이트로 이동 */}
            <button
              onClick={() => router.push('/insights')}
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
                placeholder='프로젝트, 멤버 검색...'
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
                    onClick={() => handleNavigation('/insights')}
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
                    label='인사이트'
                    onClick={() => handleNavigation('/insights')}
                  />
                </div>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className='overflow-auto p-6'>
          <div className='max-w-7xl mx-auto space-y-8'>
            {/* Header */}
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>인사이트</h1>
                <p className='text-gray-600'>
                  {selectedProject ? selectedProject.name : '전체 프로젝트'} 성과 분석
                </p>
              </div>

              <div className='flex items-center gap-4'>
                <select
                  value={dateRange}
                  onChange={e => setDateRange(Number(e.target.value))}
                  className='px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value={7}>최근 7일</option>
                  <option value={30}>최근 30일</option>
                  <option value={90}>최근 90일</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className='flex items-center justify-center h-64'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                  <p className='text-gray-500'>데이터를 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <>
                {/* 멤버별 일일 작업 수행 라인 차트 */}
                <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>멤버별 일일 작업 완료</h3>
                      <p className='text-sm text-gray-600'>시간에 따른 각 멤버의 작업 완료 추이</p>
                    </div>
                    <TrendingUp className='w-5 h-5 text-blue-500' />
                  </div>

                  <div className='h-80'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <LineChart data={lineChartData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='date' />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {memberPerformanceData.map(member => (
                          <Line
                            key={member.userId}
                            type='monotone'
                            dataKey={member.userName}
                            stroke={member.userColor}
                            strokeWidth={2}
                            dot={{ fill: member.userColor, strokeWidth: 2, r: 4 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 멤버별 총 누적 작업 수 막대 차트 */}
                <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>멤버별 총 완료 작업</h3>
                      <p className='text-sm text-gray-600'>
                        선택된 기간 동안 각 멤버가 완료한 총 작업 수
                      </p>
                    </div>
                    <Users className='w-5 h-5 text-green-500' />
                  </div>

                  <div className='h-80'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='name' />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey='total' fill='#3B82F6' />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Activity Log */}
                <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>최근 활동</h3>
                      <p className='text-sm text-gray-600'>프로젝트의 최근 활동 내역</p>
                    </div>
                    <Activity className='w-5 h-5 text-purple-500' />
                  </div>

                  <div className='space-y-4'>
                    {activityLogs.length > 0 ? (
                      <>
                        {activityLogs.map(log => (
                          <div
                            key={log.id}
                            className='flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg'
                          >
                            <div
                              className='w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0'
                              style={getUserColorStyle(log.user)}
                            >
                              {log.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm text-gray-900'>
                                <span className='font-medium'>
                                  {log.user?.name || '알 수 없는 사용자'}
                                </span>{' '}
                                <span className='text-gray-600'>{log.description}</span>
                              </p>
                              <div className='flex items-center gap-2 mt-1'>
                                <span className='text-xs text-gray-500'>
                                  {new Date(log.timestamp).toLocaleString('ko-KR')}
                                </span>
                                {log.project && (
                                  <>
                                    <span className='text-xs text-gray-400'>•</span>
                                    <span className='text-xs text-gray-500'>
                                      {log.project.name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className='pt-4 border-t border-gray-200'>
                          <button
                            onClick={() => router.push('/activity-logs')}
                            className='flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium'
                          >
                            모든 활동 보기
                            <ArrowRight className='w-4 h-4' />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className='text-center py-8'>
                        <Activity className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                        <p className='text-gray-500'>최근 활동이 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import { NotificationBell } from '@/components/notifications/notification-bell';
import { activityLogsApi, projectsApi, tasksApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import {
  Activity,
  Calendar,
  ChevronDown,
  FolderOpen,
  HelpCircle,
  List,
  Mail,
  Menu,
  Search,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

interface UserTaskStats {
  userId: string;
  userName: string;
  userEmail: string;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
  totalTasks: number;
  completionRate: number;
}

interface MemberPerformance {
  userId: string;
  userName: string;
  userColor: string;
  dailyTasks: Array<{
    date: string;
    count: number;
  }>;
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

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { projects, setProjects } = useProjectsStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedProjectId') || 'all';
    }
    return 'all';
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<number>(7);
  const [memberPerformanceData, setMemberPerformanceData] = useState<MemberPerformance[]>([]);
  const [userTaskStats, setUserTaskStats] = useState<UserTaskStats[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        // Check if we need to refetch projects from cache
        const projectsStoreModule = await import('@/store/projects');
        const projectsStore = projectsStoreModule.default;

        if (!projectsStore.shouldRefetchProjects()) {
          console.log('Using cached projects');
          return; // Use cached data from store
        }

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

  // Load data when project selection changes
  useEffect(() => {
    if (projects.length > 0) {
      loadData();
    }
  }, [selectedProjectId, projects]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load activity logs and task data in parallel
      const [logs] = await Promise.all([
        activityLogsApi.getActivityLogs(
          selectedProjectId !== 'all' ? selectedProjectId : undefined
        ),
        loadTaskDataOnce(), // Load task data once and process for both stats and performance
      ]);

      setActivityLogs(logs);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Consolidated function to load tasks once and process for both analytics
  const loadTaskDataOnce = async () => {
    try {
      // Get tasks once - reuse for both user stats and performance data
      let allTasks: any[] = [];

      if (selectedProjectId === 'all') {
        // Limit to first 5 projects to reduce API calls
        const limitedProjects = projects.slice(0, 5);
        const taskPromises = limitedProjects.map(project => tasksApi.getTasksByProject(project.id));
        const results = await Promise.all(taskPromises);
        allTasks = results.flat();
      } else {
        // For single project, make one API call
        allTasks = await tasksApi.getTasksByProject(selectedProjectId);
      }

      // Process task data for user statistics
      const userTaskMap = new Map<string, { user: any; tasks: any[] }>();
      const userPerformanceMap = new Map<string, MemberPerformance>();

      for (const task of allTasks) {
        if (task.assigneeId && task.assignee) {
          // For user task statistics
          if (!userTaskMap.has(task.assigneeId)) {
            userTaskMap.set(task.assigneeId, {
              user: task.assignee,
              tasks: [],
            });
          }
          userTaskMap.get(task.assigneeId)!.tasks.push(task);

          // For member performance data (only completed tasks)
          if (task.status === 'COMPLETED') {
            const userId = task.assignee.id;
            const userName = task.assignee.name || task.assignee.email || '사용자';

            if (!userPerformanceMap.has(userId)) {
              userPerformanceMap.set(userId, {
                userId,
                userName,
                userColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                dailyTasks: [],
                totalCompleted: 0,
              });
            }

            const user = userPerformanceMap.get(userId)!;
            user.totalCompleted++;

            // Add to daily tasks
            const date = new Date(task.updatedAt).toLocaleDateString('ko-KR');
            const existingDay = user.dailyTasks.find(d => d.date === date);
            if (existingDay) {
              existingDay.count++;
            } else {
              user.dailyTasks.push({ date, count: 1 });
            }
          }
        }
      }

      // Set user task statistics
      const stats: UserTaskStats[] = Array.from(userTaskMap.entries()).map(
        ([userId, { user, tasks }]) => {
          const todoCount = tasks.filter(t => t.status === 'TODO').length;
          const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
          const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
          const totalTasks = tasks.length;
          const completionRate =
            totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

          return {
            userId,
            userName: user.name || 'Unknown User',
            userEmail: user.email || '',
            todoCount,
            inProgressCount,
            completedCount,
            totalTasks,
            completionRate,
          };
        }
      );

      setUserTaskStats(stats.sort((a, b) => b.totalTasks - a.totalTasks));

      // Set member performance data
      const performanceData = Array.from(userPerformanceMap.values());
      setMemberPerformanceData(performanceData);
    } catch (error) {
      console.error('Failed to load task data:', error);
    }
  };

  const getUserColorStyle = (user: any) => {
    if (!user?.profileColor) return { backgroundColor: '#3B82F6' };
    return { backgroundColor: user.profileColor };
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
      // Handle other navigation cases
      console.log('Navigation to:', path);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Prepare chart data
  const lineChartData = memberPerformanceData.reduce((acc, member) => {
    member.dailyTasks.forEach(({ date, count }) => {
      const existingDate = acc.find(d => d.date === date);
      if (existingDate) {
        existingDate[member.userName] = count;
      } else {
        acc.push({ date, [member.userName]: count });
      }
    });
    return acc;
  }, [] as any[]);

  const barChartData = memberPerformanceData.map(member => ({
    name: member.userName,
    total: member.totalCompleted,
  }));

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    setSelectedProjectId(projectId);
    // localStorage에 저장
    if (projectId !== 'all') {
      localStorage.setItem('selectedProjectId', projectId);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(Number(e.target.value));
  };

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
                    onChange={handleProjectChange}
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
                </div>
              </div>

              <div>
                <div className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                  팀
                </div>
                <div className='space-y-1'>
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
                    icon={<TrendingUp className='w-4 h-4 text-purple-500' />}
                    label='분석'
                    onClick={() => handleNavigation('/analytics')}
                  />
                  <NavItem
                    icon={<Activity className='w-4 h-4 text-indigo-500' />}
                    label='활동 로그'
                    onClick={() => handleNavigation('/reports')}
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
                <h1 className='text-2xl font-bold text-gray-900'>분석</h1>
                <p className='text-gray-600'>
                  {selectedProject ? selectedProject.name : '전체 프로젝트'} 성과 분석
                </p>
              </div>

              <div className='flex items-center gap-4'>
                <select
                  value={dateRange}
                  onChange={handleDateRangeChange}
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
                {/* 사용자별 작업현황 막대그래프 */}
                <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>사용자별 작업현황</h3>
                      <p className='text-sm text-gray-600'>
                        각 사용자의 할 일, 진행 중, 완료된 작업 현황
                      </p>
                    </div>
                    <Users className='w-5 h-5 text-blue-500' />
                  </div>

                  {userTaskStats.length > 0 ? (
                    <div className='h-80'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={userTaskStats}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis
                            dataKey='userName'
                            angle={-45}
                            textAnchor='end'
                            height={80}
                            interval={0}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value, name) => {
                              const labels = {
                                todoCount: '할 일',
                                inProgressCount: '진행 중',
                                completedCount: '완료',
                              };
                              return [value, labels[name as keyof typeof labels] || name];
                            }}
                            labelFormatter={label => `사용자: ${label}`}
                          />
                          <Legend
                            formatter={value => {
                              const labels = {
                                todoCount: '할 일',
                                inProgressCount: '진행 중',
                                completedCount: '완료',
                              };
                              return labels[value as keyof typeof labels] || value;
                            }}
                          />
                          <Bar dataKey='todoCount' stackId='a' fill='#FFB3BA' name='todoCount' />
                          <Bar
                            dataKey='inProgressCount'
                            stackId='a'
                            fill='#FFDFBA'
                            name='inProgressCount'
                          />
                          <Bar
                            dataKey='completedCount'
                            stackId='a'
                            fill='#BAFFC9'
                            name='completedCount'
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className='flex items-center justify-center h-40'>
                      <p className='text-gray-500'>작업이 할당된 사용자가 없습니다.</p>
                    </div>
                  )}

                  {/* 사용자별 완료율 테이블 */}
                  {userTaskStats.length > 0 && (
                    <div className='mt-6'>
                      <h4 className='text-md font-medium text-gray-900 mb-4'>사용자별 완료율</h4>
                      <div className='overflow-x-auto'>
                        <table className='min-w-full divide-y divide-gray-200'>
                          <thead className='bg-gray-50'>
                            <tr>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                사용자
                              </th>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                총 작업
                              </th>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                완료
                              </th>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                완료율
                              </th>
                            </tr>
                          </thead>
                          <tbody className='bg-white divide-y divide-gray-200'>
                            {userTaskStats.map(stat => (
                              <tr key={stat.userId}>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                  <div className='flex items-center'>
                                    <div className='text-sm font-medium text-gray-900'>
                                      {stat.userName}
                                    </div>
                                  </div>
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                  {stat.totalTasks}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                  {stat.completedCount}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                  <div className='flex items-center'>
                                    <div className='text-sm text-gray-900 mr-2'>
                                      {stat.completionRate}%
                                    </div>
                                    <div className='w-16 bg-gray-200 rounded-full h-2'>
                                      <div
                                        className='bg-green-500 h-2 rounded-full'
                                        style={{ width: `${stat.completionRate}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

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
                    <Users className='w-5 h-5 text-blue-500' />
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
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

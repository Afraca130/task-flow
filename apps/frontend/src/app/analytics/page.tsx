'use client';

import { ArrowLeft, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { projectsApi, tasksApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { useProjectsStore } from '../../store/projects';

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
  createdAt: string;
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

  // Load data when project selection changes
  useEffect(() => {
    if (projects.length > 0) {
      loadData();
    }
  }, [selectedProjectId, projects]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load task data
      await loadTaskDataOnce(); // Load task data once and process for both stats and performance
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
            <h1 className='text-3xl font-bold text-gray-900'>분석 대시보드</h1>
            <p className='text-gray-600'>프로젝트 성과와 팀 활동을 분석하세요</p>
          </div>
        </div>

        {/* Controls */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>프로젝트</label>
              <select
                value={selectedProjectId}
                onChange={handleProjectChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='all'>모든 프로젝트</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>기간</label>
              <select
                value={dateRange}
                onChange={handleDateRangeChange}
                className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value={7}>최근 7일</option>
                <option value={30}>최근 30일</option>
                <option value={90}>최근 90일</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>분석 데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* 사용자별 업무 통계 */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <div className='flex items-center mb-4'>
                <Users className='w-5 h-5 text-blue-600 mr-2' />
                <h2 className='text-lg font-semibold text-gray-900'>팀원별 업무 현황</h2>
              </div>
              {userTaskStats.length === 0 ? (
                <p className='text-gray-500 text-center py-8'>데이터가 없습니다</p>
              ) : (
                <div className='space-y-4'>
                  {userTaskStats.map(stat => (
                    <div key={stat.userId} className='border-l-4 border-blue-500 pl-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <h3 className='font-medium text-gray-900'>{stat.userName}</h3>
                        <span className='text-sm font-medium text-blue-600'>
                          완료율 {stat.completionRate}%
                        </span>
                      </div>
                      <div className='flex gap-4 text-sm text-gray-600'>
                        <span>할 일: {stat.todoCount}</span>
                        <span>진행중: {stat.inProgressCount}</span>
                        <span>완료: {stat.completedCount}</span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                        <div
                          className='bg-blue-600 h-2 rounded-full'
                          style={{ width: `${stat.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 팀원 성과 차트 */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <div className='flex items-center mb-4'>
                <TrendingUp className='w-5 h-5 text-green-600 mr-2' />
                <h2 className='text-lg font-semibold text-gray-900'>완료 업무 추이</h2>
              </div>
              {memberPerformanceData.length === 0 ? (
                <p className='text-gray-500 text-center py-8'>데이터가 없습니다</p>
              ) : (
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={memberPerformanceData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='userName' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='totalCompleted' fill='#3B82F6' />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

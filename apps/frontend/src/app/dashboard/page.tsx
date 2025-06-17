'use client';

import { NotificationBell } from '@/components/notifications/notification-bell';
import { TaskModal } from '@/components/task-modal';
import { Button } from '@/components/ui/button';
import { projectsApi, Task, tasksApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  ChevronDown,
  FolderOpen,
  HelpCircle,
  List,
  Mail,
  Menu,
  Plus,
  Search,
  Settings,
  TrendingUp,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const statusColumns = {
  TODO: {
    title: '할 일',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  IN_PROGRESS: {
    title: '진행 중',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
  },
  COMPLETED: {
    title: '완료',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
} as const;

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

interface DraggableTaskCardProps {
  task: Task;
  onClick: () => void;
}

function DraggableTaskCard({ task, onClick }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const getAssigneeAvatarStyle = (assignee: any) => {
    if (assignee?.profileColor) {
      return { backgroundColor: assignee.profileColor };
    }
    return { backgroundColor: assignee?.id ? getUserColor(assignee.id) : '#3B82F6' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onClick}
    >
      <div className='space-y-3'>
        <div className='flex items-start justify-between'>
          <h4 className='text-sm font-medium text-gray-900 line-clamp-2 flex-1'>{task.title}</h4>
          {task.priority && (
            <span
              className={`ml-2 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                task.priority === 'HIGH'
                  ? 'bg-red-100 text-red-800'
                  : task.priority === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              }`}
            >
              {task.priority === 'HIGH' ? '높음' : task.priority === 'MEDIUM' ? '보통' : '낮음'}
            </span>
          )}
        </div>

        {task.description && (
          <p className='text-xs text-gray-600 line-clamp-2'>{task.description}</p>
        )}

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {task.assignee && (
              <div className='flex items-center gap-2'>
                <div
                  className='w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium'
                  style={getAssigneeAvatarStyle(task.assignee)}
                >
                  {task.assignee.name?.charAt(0) || 'U'}
                </div>
                <span className='text-xs text-gray-600'>{task.assignee.name}</span>
              </div>
            )}
          </div>

          {task.dueDate && (
            <span className='text-xs text-gray-500'>마감: {formatDate(task.dueDate)}</span>
          )}
        </div>

        {/* 생성 날짜와 완료 날짜 */}
        <div className='flex items-center justify-between text-xs text-gray-400'>
          <span>생성: {formatDate(task.createdAt)}</span>
          {task.status === 'COMPLETED' && task.updatedAt && (
            <span>완료: {formatDate(task.updatedAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  id: string;
  title: string;
  config: { title: string; color: string; bgColor: string };
  tasks: Task[];
  totalTasks: number;
  onTaskClick: (task: Task) => void;
  onViewMore: (status: keyof typeof statusColumns) => void;
  selectedProjectId: string;
}

function DroppableColumn({
  id,
  title,
  config,
  tasks,
  totalTasks,
  onTaskClick,
  onViewMore,
  selectedProjectId,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const displayCount = totalTasks > 10 ? '10+' : totalTasks.toString();
  const showViewMore = totalTasks > 10;

  return (
    <div className='min-w-80 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full'>
      <div className={`p-4 border-b border-gray-200 ${config.bgColor}`}>
        <div className='flex items-center justify-between'>
          <h3 className={`font-medium ${config.color}`}>{config.title}</h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}
          >
            {displayCount}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-4 space-y-3 min-h-[500px] transition-colors ${
          isOver ? 'bg-blue-50 border-blue-200' : ''
        }`}
      >
        {tasks.slice(0, 10).map(task => (
          <DraggableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}

        {/* 빈 공간을 채우는 드롭 영역 */}
        {tasks.length === 0 && (
          <div
            className={`flex-1 min-h-[200px] border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center transition-colors ${
              isOver ? 'border-blue-400 bg-blue-50' : 'hover:border-gray-300'
            }`}
          >
            <p className='text-gray-400 text-sm'>여기에 작업을 드래그하세요</p>
          </div>
        )}

        {/* 추가 드롭 영역 - 작업이 있을 때도 하단에 여유 공간 제공 */}
        {tasks.length > 0 && (
          <div
            className={`min-h-[100px] border-2 border-dashed border-transparent rounded-lg transition-colors ${
              isOver ? 'border-blue-400 bg-blue-50' : ''
            }`}
          >
            {/* 빈 공간 */}
          </div>
        )}

        {/* 더보기 버튼 */}
        {showViewMore && (
          <button
            onClick={() => onViewMore(id as keyof typeof statusColumns)}
            className='w-full py-3 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors'
          >
            더보기 (총 {totalTasks}개 중 10개 표시)
          </button>
        )}

        {/* 새 작업 추가 버튼 */}
        {selectedProjectId !== 'all' && (
          <button
            onClick={() => onTaskClick({ status: id } as Task)}
            className='w-full py-3 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-center gap-2'
          >
            <Plus className='w-4 h-4' />새 태스크
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { projects, setProjects } = useProjectsStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTaskCounts, setAllTaskCounts] = useState<Record<string, number>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      // 인증되지 않은 경우 즉시 로그인 페이지로 리디렉션
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Load projects and set initial selection
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

        setLoading(true);
        console.log('Loading projects...');
        const result = await projectsApi.getProjects({ page: 1, limit: 100 });
        console.log('Projects API response:', result);

        // 새로운 응답 형식에 맞게 프로젝트 배열 추출
        const projectList = result.projects || [];
        console.log('Extracted projects:', projectList);
        setProjects(projectList);

        // URL 파라미터에서 projectId 확인
        const urlParams = new URLSearchParams(window.location.search);
        const projectIdFromUrl = urlParams.get('projectId');

        // localStorage에서 마지막으로 선택한 프로젝트 ID 확인
        const savedProjectId = localStorage.getItem('selectedProjectId');

        let selectedId = '';

        if (projectIdFromUrl && projectList.length > 0) {
          // URL에서 지정된 프로젝트가 있으면 선택
          const targetProject = projectList.find(p => p.id === projectIdFromUrl);
          if (targetProject) {
            selectedId = projectIdFromUrl;
          }
        } else if (savedProjectId && projectList.length > 0) {
          // localStorage에 저장된 프로젝트가 있으면 선택
          const savedProject = projectList.find(p => p.id === savedProjectId);
          if (savedProject) {
            selectedId = savedProjectId;
          }
        }

        if (!selectedId && projectList.length > 0) {
          // 둘 다 없으면 첫 번째 프로젝트 선택
          selectedId = projectList[0].id;
        }

        if (selectedId) {
          setSelectedProjectId(selectedId);
          // localStorage에 저장
          localStorage.setItem('selectedProjectId', selectedId);
          // URL 파라미터 업데이트
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('projectId', selectedId);
          window.history.replaceState({}, '', newUrl.toString());
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [isAuthenticated, setProjects]);

  // 프로젝트 변경 시 URL 파라미터 업데이트
  useEffect(() => {
    if (selectedProjectId && typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('projectId', selectedProjectId);
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [selectedProjectId]);

  // Load tasks function
  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log('Loading tasks...', { selectedProjectId, searchTerm });

      if (!selectedProjectId) return;

      // Load tasks for specific project
      const projectTasks = await tasksApi.getTasksByProject(selectedProjectId);
      const filteredTasks = projectTasks.filter(
        task => !searchTerm || task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Count tasks by status
      const counts = {
        TODO: filteredTasks.filter(t => t.status === 'TODO').length,
        IN_PROGRESS: filteredTasks.filter(t => t.status === 'IN_PROGRESS').length,
        COMPLETED: filteredTasks.filter(t => t.status === 'COMPLETED').length,
      };

      setAllTaskCounts(counts);
      setTasks(filteredTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
      setAllTaskCounts({});
    } finally {
      setLoading(false);
    }
  };

  // Load tasks when dependencies change
  useEffect(() => {
    if (!isAuthenticated) return;
    loadTasks();
  }, [isAuthenticated, selectedProjectId, searchTerm]);

  // 프로젝트 통계 데이터
  const projectStats = useMemo(() => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject) return null;

    const todoCount = allTaskCounts.TODO || 0;
    const inProgressCount = allTaskCounts.IN_PROGRESS || 0;
    const completedCount = allTaskCounts.COMPLETED || 0;
    const totalCount = todoCount + inProgressCount + completedCount;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return [
      { name: '할 일', count: todoCount, color: '#3B82F6' },
      { name: '진행 중', count: inProgressCount, color: '#F59E0B' },
      { name: '완료', count: completedCount, color: '#10B981' },
    ];
  }, [allTaskCounts, projects, selectedProjectId]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (showActiveOnly) {
      filtered = filtered.filter(task => task.status !== 'COMPLETED');
    }

    if (searchTerm) {
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.assignee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [tasks, showActiveOnly, searchTerm]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 같은 컬럼 내에서의 이동도 허용
    const task = tasks.find(t => t.id === activeId);
    if (!task) return;

    const newStatus = overId as keyof typeof statusColumns;
    if (!statusColumns[newStatus]) return;

    try {
      // 같은 상태 내에서의 순서 변경
      if (task.status === newStatus) {
        const tasksInStatus = getTasksByStatus(newStatus);
        const oldIndex = tasksInStatus.findIndex(t => t.id === activeId);
        const newIndex = tasksInStatus.findIndex(t => t.id === overId);

        // 낙관적 업데이트
        const optimisticUpdate = (prevTasks: Task[]) => {
          const tasksInStatus = prevTasks.filter(t => t.status === newStatus);
          const [movedTask] = tasksInStatus.splice(oldIndex, 1);
          tasksInStatus.splice(newIndex, 0, movedTask);
          return prevTasks.map(t =>
            t.status === newStatus ? tasksInStatus.find(ts => ts.id === t.id) || t : t
          );
        };

        setTasks(optimisticUpdate);

        // 서버 업데이트 (LexoRank 기반)
        const targetTasks = getTasksByStatus(newStatus);
        const targetTask = targetTasks[newIndex];
        if (targetTask) {
          await tasksApi.reorderTask(activeId, targetTask.lexoRank);
        }

        // 성공 후 전체 데이터 다시 로드
        await loadTasks();
        return;
      }

      // 상태가 변경되는 경우
      const optimisticUpdate = (prevTasks: Task[]) =>
        prevTasks.map(task => (task.id === activeId ? { ...task, status: newStatus } : task));

      setTasks(optimisticUpdate);

      // 서버 업데이트
      await tasksApi.updateTask(activeId, { status: newStatus });

      // 성공 후 전체 데이터 다시 로드
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
      // 에러 발생 시 원래 상태로 되돌리기
      await loadTasks();
    }
  };

  const getTasksByStatus = (status: keyof typeof statusColumns) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCreateTask = (status?: keyof typeof statusColumns) => {
    setSelectedTask({ status: status || 'TODO' } as Task);
    setIsModalOpen(true);
  };

  const handleViewMore = (status: keyof typeof statusColumns) => {
    // 더보기 버튼 클릭 시 tasks 페이지로 이동
    router.push(`/tasks?status=${status}`);
  };

  const openModal = (task?: Task) => {
    setSelectedTask(task || null);
    setIsModalOpen(true);
  };

  const openNewTaskModal = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
  };

  const handleNavigation = (path: string) => {
    if (path.startsWith('/')) {
      router.push(path);
    } else {
      alert('이 기능은 곧 출시될 예정입니다!');
    }
  };

  const handleTaskSave = async (taskData: Partial<Task>) => {
    try {
      setLoading(true);
      let savedTask: Task;

      if (selectedTask?.id) {
        // Update existing task
        savedTask = await tasksApi.updateTask(selectedTask.id, taskData);
        setTasks(prevTasks => prevTasks.map(task => (task.id === savedTask.id ? savedTask : task)));
      } else {
        // Create new task
        savedTask = await tasksApi.createTask(taskData as any);
        setTasks(prevTasks => [...prevTasks, savedTask]);
      }

      closeModal();
      // 데이터 다시 로드
      await loadTasks();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    try {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
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

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen) {
        const target = event.target as Element;
        if (!target.closest('.user-menu-container')) {
          setIsUserMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <div className='min-h-screen bg-gray-50'>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                  placeholder='이슈, 보드, 프로젝트 검색...'
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

              <div className='relative user-menu-container'>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className='flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors'
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${!user?.profileColor ? 'bg-blue-500' : ''}`}
                    style={getUserColorStyle(user)}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className='hidden sm:block text-left'>
                    <div className='text-sm font-medium text-gray-900'>
                      {user?.name || '사용자'}
                    </div>
                    <div className='text-xs text-gray-500'>{user?.email || 'user@example.com'}</div>
                  </div>
                  <ChevronDown className='w-4 h-4 text-gray-400' />
                </button>

                {/* 사용자 드롭다운 메뉴 */}
                {isUserMenuOpen && (
                  <div className='absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50'>
                    {/* 사용자 정보 */}
                    <div className='px-4 py-3 border-b border-gray-100'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${!user?.profileColor ? 'bg-blue-500' : ''}`}
                          style={getUserColorStyle(user)}
                        >
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className='text-sm font-medium text-gray-900'>
                            {user?.name || '사용자'}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {user?.email || 'user@example.com'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 메뉴 항목들 */}
                    <div className='py-1'>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          router.push('/profile');
                        }}
                        className='flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                      >
                        <User className='w-4 h-4' />내 정보
                      </button>

                      <div className='border-t border-gray-100 my-1'></div>

                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          // 로그아웃 처리
                          const authStore = (await import('@/store/auth')).default;
                          await authStore.logout();
                        }}
                        className='flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50'
                      >
                        <ArrowLeft className='w-4 h-4' />
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Sidebar */}
          <aside
            className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200 transition-transform lg:transition-none`}
          >
            <div className='flex flex-col h-full'>
              <nav className='flex-1 p-4 space-y-2'>
                <NavItem
                  icon={<BarChart3 className='w-4 h-4 text-blue-500' />}
                  label='대시보드'
                  onClick={() => handleNavigation('/dashboard')}
                />
                <NavItem
                  icon={<FolderOpen className='w-4 h-4 text-green-500' />}
                  label='프로젝트'
                  onClick={() => handleNavigation('/projects')}
                />
                <NavItem
                  icon={<List className='w-4 h-4 text-purple-500' />}
                  label='이슈'
                  onClick={() => handleNavigation('/issues')}
                />
                <NavItem
                  icon={<Mail className='w-4 h-4 text-orange-500' />}
                  label='초대'
                  onClick={() => handleNavigation('/invite')}
                />
                <NavItem
                  icon={<TrendingUp className='w-4 h-4 text-pink-500' />}
                  label='분석'
                  onClick={() => handleNavigation('/analytics')}
                />
                <NavItem
                  icon={<Activity className='w-4 h-4 text-indigo-500' />}
                  label='활동 로그'
                  onClick={() => handleNavigation('/reports')}
                />
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className='p-6 overflow-auto'>
            <div className='mb-6'>
              <div className='flex items-center justify-between mb-4'>
                <h1 className='text-2xl font-bold text-gray-900 mb-4'>
                  {selectedProject?.name || ''} 이슈
                </h1>
                <div className='flex items-center space-x-4'>
                  <Button onClick={() => handleCreateTask()}>
                    <Plus className='mr-2 h-4 w-4' />새 태스크
                  </Button>
                </div>
              </div>
            </div>

            {projectStats && projectStats.length > 0 && (
              <div className='mb-4 max-w-6xl'>
                <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <h3 className='text-base font-semibold text-gray-900'>프로젝트 현황</h3>
                      <p className='text-xs text-gray-600'>
                        {selectedProject ? selectedProject.name : '전체 프로젝트'} 작업 현황
                      </p>
                    </div>
                    <TrendingUp className='w-4 h-4 text-blue-500' />
                  </div>

                  {(() => {
                    // 데이터 유효성 검사 및 전처리
                    const validStats = projectStats.filter(
                      stat =>
                        stat &&
                        typeof stat.count === 'number' &&
                        !isNaN(stat.count) &&
                        stat.count >= 0 &&
                        stat.name
                    );

                    const total = validStats.reduce((sum, stat) => sum + stat.count, 0);

                    // 총합이 0이면 차트 대신 메시지 표시
                    if (total === 0) {
                      return (
                        <div className='text-center py-4 text-gray-500'>
                          <div className='text-2xl mb-1'>📊</div>
                          <p className='text-xs'>아직 작업이 없습니다.</p>
                        </div>
                      );
                    }

                    // 상태별 색상 정의 (타입 안전하게)
                    const statusColors: Record<string, string> = {
                      '할 일': '#60A5FA', // 파랑
                      '진행 중': '#FBBF24', // 노랑
                      완료: '#34D399', // 초록
                    };

                    // 안전한 색상 가져오기 함수
                    const getStatusColor = (statusName: string): string => {
                      return statusColors[statusName] || '#6B7280'; // 기본 회색
                    };

                    return (
                      <>
                        {/* CSS 기반 누적 가로 막대 차트 (컴팩트) */}
                        <div className='flex justify-center mb-3'>
                          <div className='w-full'>
                            <div className='flex rounded-md overflow-hidden h-6 bg-gray-200 shadow-inner'>
                              {validStats.map((stat, index) => {
                                const percentage = (stat.count / total) * 100;

                                return (
                                  <div
                                    key={index}
                                    className='flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-80 cursor-pointer relative group'
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: getStatusColor(stat.name),
                                    }}
                                    title={`${stat.name}: ${Math.round(percentage)}% (${stat.count}개)`}
                                  >
                                    {/* 20% 이상일 때만 퍼센트 표시 */}
                                    {percentage > 20 && `${Math.round(percentage)}%`}

                                    {/* 호버 시 툴팁 */}
                                    <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10'>
                                      {stat.name}: {stat.count}개 ({Math.round(percentage)}%)
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* 범례 */}
                            <div className='flex justify-center mt-2 space-x-3'>
                              {validStats.map((stat, index) => {
                                const percentage = Math.round((stat.count / total) * 100);

                                return (
                                  <div key={index} className='flex items-center space-x-1'>
                                    <div
                                      className='w-2 h-2 rounded-sm'
                                      style={{ backgroundColor: getStatusColor(stat.name) }}
                                    />
                                    <span className='text-xs text-gray-700 font-medium'>
                                      {stat.name}
                                    </span>
                                    <span className='text-xs text-gray-500'>{percentage}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 상세 통계 */}
                        <div className='grid grid-cols-3 gap-2'>
                          {validStats.map((stat, index) => {
                            const percentage = Math.round((stat.count / total) * 100);

                            return (
                              <div
                                key={index}
                                className='text-center p-2 bg-gray-50 rounded-md border border-gray-100 hover:border-gray-200 transition-colors'
                              >
                                <div
                                  className='text-lg font-bold mb-1'
                                  style={{ color: getStatusColor(stat.name) }}
                                >
                                  {percentage}%
                                </div>
                                <div className='text-xs font-medium text-gray-900 mb-1'>
                                  {stat.name}
                                </div>
                                <div className='text-xs text-gray-500'>{stat.count}개</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 총 작업 수 */}
                        <div className='mt-3 text-center py-1 bg-blue-50 rounded-md border border-blue-100'>
                          <div className='text-xs text-blue-700'>
                            <span className='font-semibold'>총 {total}개</span> 작업
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Kanban Board */}
            {loading ? (
              <div className='flex items-center justify-center h-64'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-8 w-10 border-b-2 border-blue-600 mx-auto mb-4'></div>
                  <p className='text-gray-500'>작업을 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <div className='flex gap-6 overflow-x-auto pb-6'>
                {Object.entries(statusColumns).map(([status, config]) => (
                  <DroppableColumn
                    key={status}
                    id={status}
                    title={config.title}
                    config={config}
                    tasks={getTasksByStatus(status as keyof typeof statusColumns)}
                    totalTasks={allTaskCounts[status] || 0}
                    onTaskClick={handleTaskClick}
                    onViewMore={handleViewMore}
                    selectedProjectId={selectedProjectId}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredTasks.length === 0 && (
              <div className='text-center py-12'>
                <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center'>
                  <List className='w-8 h-8 text-gray-400' />
                </div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>아직 작업이 없습니다</h3>
                <p className='text-gray-500 mb-4'>첫 번째 작업을 생성하여 프로젝트를 시작하세요.</p>
                <button
                  onClick={() => handleCreateTask()}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  <Plus className='w-4 h-4' />첫 작업 만들기
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTaskId && (
            <div className='bg-white border border-gray-200 rounded-lg p-4 shadow-lg opacity-90'>
              {tasks.find(task => task.id === activeTaskId)?.title}
            </div>
          )}
        </DragOverlay>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className='fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden'
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Task Modal */}
        {isModalOpen && (
          <TaskModal
            task={selectedTask}
            projects={projects}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTask(null);
            }}
            onSave={handleTaskSave}
            onDelete={handleTaskDelete}
            currentProjectId={selectedProjectId}
          />
        )}
      </DndContext>
    </div>
  );
}

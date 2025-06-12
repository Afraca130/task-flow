'use client';

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
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BarChart3,
  Calendar,
  ChevronDown,
  FileText,
  FolderOpen,
  HelpCircle,
  List,
  Mail,
  Menu,
  Play,
  Plus,
  Search,
  Settings,
  UserCheck,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { NotificationBell } from '../../components/notifications/notification-bell';

const statusColumns = {
  TODO: { title: '할 일', color: 'text-blue-600 bg-blue-50', bgColor: 'bg-blue-50' },
  IN_PROGRESS: { title: '진행 중', color: 'text-yellow-600 bg-yellow-50', bgColor: 'bg-yellow-50' },
  COMPLETED: { title: '완료', color: 'text-green-600 bg-green-50', bgColor: 'bg-green-50' },
};

const priorityColors = {
  LOW: 'text-gray-600 bg-gray-100',
  MEDIUM: 'text-blue-600 bg-blue-100',
  HIGH: 'text-orange-600 bg-orange-100',
  URGENT: 'text-red-600 bg-red-100',
};

const priorityLabels = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

// 사용자 색상 관련 유틸리티 함수들
const getUserColor = (userId: string) => {
  // 사용자별 고유 색상 생성 (사용자가 색상을 선택하지 않은 경우)
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-gray-500',
  ];

  // 사용자 ID를 기반으로 색상 선택
  const colorIndex =
    userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[colorIndex];
};

const getUserColorStyle = (user: any) => {
  if (user?.profileColor) {
    return { backgroundColor: user.profileColor };
  }
  return {};
};

interface DraggableTaskCardProps {
  task: Task;
  onClick: () => void;
}

function DraggableTaskCard({ task, onClick }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const getAssigneeAvatarStyle = (assignee: any) => {
    if (assignee?.profileColor) {
      return {
        backgroundColor: assignee.profileColor,
        color: '#ffffff',
      };
    }
    // Fallback to default color if no profileColor
    return {
      backgroundColor: '#3B82F6',
      color: '#ffffff',
    };
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onClick}
    >
      <div className='flex items-start justify-between mb-2'>
        <h3 className='font-medium text-gray-900 text-sm line-clamp-2'>{task.title}</h3>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}
        >
          {priorityLabels[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className='text-gray-600 text-sm mb-3 line-clamp-2'>{task.description}</p>
      )}

      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {task.assignee && (
            <div className='flex items-center gap-2'>
              <div
                className='w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium'
                style={getAssigneeAvatarStyle(task.assignee)}
              >
                {task.assignee.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className='text-sm text-gray-600'>{task.assignee.name}</span>
            </div>
          )}
        </div>

        {task.dueDate && (
          <div className='flex items-center gap-1 text-xs text-gray-500'>
            <Calendar className='w-3 h-3' />
            {new Date(task.dueDate).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )}
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className='flex flex-wrap gap-1 mt-2'>
          {task.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className='px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className='px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface DroppableColumnProps {
  id: string;
  title: string;
  config: { title: string; color: string; bgColor: string };
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onViewMore: (status: keyof typeof statusColumns) => void;
  selectedProjectId: string;
}

function DroppableColumn({
  id,
  title,
  config,
  tasks,
  onTaskClick,
  onViewMore,
  selectedProjectId,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className='min-w-80 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full'>
      <div className={`p-4 border-b border-gray-200 ${config.bgColor}`}>
        <div className='flex items-center justify-between'>
          <h3 className={`font-medium ${config.color}`}>{config.title}</h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.color}`}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-4 space-y-3 min-h-[500px] transition-colors ${
          isOver ? 'bg-blue-50 border-blue-200' : ''
        }`}
      >
        {tasks.map(task => (
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
        {tasks.length === 10 && (
          <button
            onClick={() => onViewMore(id as keyof typeof statusColumns)}
            className='w-full py-3 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors'
          >
            더보기 ({tasks.length}개 중 10개 표시)
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
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

  // Load tasks function
  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log('Loading tasks...', { selectedProjectId, searchTerm });

      if (selectedProjectId === 'all') {
        // Load all tasks by status separately with limit of 10 each
        try {
          const [todoResult, inProgressResult, completedResult] = await Promise.all([
            tasksApi.getTasks({ status: 'TODO', search: searchTerm, limit: 10 }),
            tasksApi.getTasks({ status: 'IN_PROGRESS', search: searchTerm, limit: 10 }),
            tasksApi.getTasks({ status: 'COMPLETED', search: searchTerm, limit: 10 }),
          ]);

          const allTasks = [
            ...(todoResult.data || []),
            ...(inProgressResult.data || []),
            ...(completedResult.data || []),
          ];

          console.log('All tasks loaded by status:', {
            todo: todoResult.data?.length || 0,
            inProgress: inProgressResult.data?.length || 0,
            completed: completedResult.data?.length || 0,
            total: allTasks.length,
          });

          setTasks(allTasks);
        } catch (error) {
          console.warn('Failed to load tasks by status, falling back to regular load:', error);
          // Fallback to regular task loading
          const result = await tasksApi.getTasks({ search: searchTerm, limit: 30 });
          console.log('All tasks loaded (fallback):', result);
          setTasks(result.data || []);
        }
      } else {
        // Load tasks for specific project with proper ordering and limit of 10 per status
        try {
          const orderedTasks = await tasksApi.getTasksByProjectOrdered(
            selectedProjectId,
            undefined,
            10
          );
          console.log('Ordered project tasks loaded:', orderedTasks);

          // Flatten the grouped tasks to a single array
          const allTasks = [
            ...(orderedTasks.TODO || []),
            ...(orderedTasks.IN_PROGRESS || []),
            ...(orderedTasks.COMPLETED || []),
          ];

          setTasks(allTasks);
        } catch (orderedError) {
          console.warn(
            'Failed to load ordered tasks, falling back to regular tasks:',
            orderedError
          );
          // Fallback to regular task loading
          const projectTasks = await tasksApi.getTasksByProject(selectedProjectId);
          console.log('Project tasks loaded (fallback):', projectTasks);
          setTasks(projectTasks || []);
        }
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // 에러 발생 시 빈 배열로 설정
      setTasks([]);

      // 401 오류인 경우 로그아웃 처리
      if ((error as any)?.response?.status === 401) {
        console.warn('Authentication failed while loading tasks');
        // 인증 실패는 API 인터셉터에서 처리하므로 여기서는 로그만
      }
    } finally {
      setLoading(false);
    }
  };

  // Load tasks
  useEffect(() => {
    if (!isAuthenticated) return;

    // 프로젝트가 로드되었거나 'all'을 선택한 경우에만 태스크 로드
    if (projects.length > 0 || selectedProjectId === 'all') {
      loadTasks();
    }
  }, [selectedProjectId, searchTerm, projects.length, isAuthenticated]);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 활성 태스크만 보기 필터
    if (showActiveOnly) {
      filtered = filtered.filter(task => task.status === 'TODO' || task.status === 'IN_PROGRESS');
    }

    return filtered;
  }, [tasks, searchTerm, showActiveOnly]);

  // Organize tasks by status
  const tasksByStatus = useMemo(() => {
    const organized: Record<'TODO' | 'IN_PROGRESS' | 'COMPLETED', Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    };

    filteredTasks.forEach(task => {
      if (task.status in organized) {
        organized[task.status as keyof typeof organized].push(task);
      }
    });

    return organized;
  }, [filteredTasks]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTaskId(active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over || !active.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(task => task.id === activeId);
    if (!activeTask) return;

    // 같은 위치로 드롭한 경우 무시
    if (activeTask.status === overId && over.data?.current?.sortable?.index === undefined) {
      return;
    }

    try {
      // 새로운 상태 결정
      const newStatus = overId as 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
      const statusChanged = activeTask.status !== newStatus;

      // 대상 상태의 태스크들 가져오기
      const targetTasks = getTasksByStatus(newStatus);

      // 새로운 위치 계산
      let newPosition = targetTasks.length;
      if (over.data?.current?.sortable?.index !== undefined) {
        newPosition = over.data.current.sortable.index;
      }

      console.log('Reordering task:', {
        taskId: activeId,
        projectId: activeTask.projectId,
        newStatus,
        newPosition,
        statusChanged,
      });

      // 낙관적 업데이트
      if (statusChanged) {
        const optimisticUpdate = (prevTasks: Task[]) =>
          prevTasks.map(task => (task.id === activeId ? { ...task, status: newStatus } : task));
        setTasks(optimisticUpdate);
      }

      // 서버에 순서 변경 요청
      const result = await tasksApi.reorderTask({
        taskId: activeId,
        projectId: activeTask.projectId,
        newPosition,
        newStatus: statusChanged ? newStatus : undefined,
      });

      console.log('Reorder result:', result);

      // 성공 시 실제 데이터로 업데이트
      if (result.task) {
        setTasks(prevTasks =>
          prevTasks.map(task => (task.id === result.task.id ? result.task : task))
        );
      }

      // 영향받은 다른 태스크들도 업데이트
      if (result.affectedTasks && result.affectedTasks.length > 0) {
        setTasks(prevTasks => {
          const updatedTasks = [...prevTasks];
          result.affectedTasks.forEach(affectedTask => {
            const index = updatedTasks.findIndex(task => task.id === affectedTask.id);
            if (index !== -1) {
              updatedTasks[index] = affectedTask;
            }
          });
          return updatedTasks;
        });
      }

      // 데이터 일관성을 위해 다시 로드
      setTimeout(() => {
        loadTasks();
      }, 500);
    } catch (error) {
      console.error('Failed to reorder task:', error);

      // 에러 시 원래 상태로 되돌리기
      setTasks(prevTasks => prevTasks.map(task => (task.id === activeId ? activeTask : task)));
    }
  };

  const getTasksByStatus = (status: keyof typeof statusColumns) => {
    return tasksByStatus[status] || [];
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCreateTask = (status?: keyof typeof statusColumns) => {
    // 현재 선택된 프로젝트 ID를 고정
    const fixedProjectId = selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || '';

    const newTask = {
      status: status || ('TODO' as const),
      projectId: fixedProjectId,
    };
    setSelectedTask(newTask as Task);
    setIsModalOpen(true);
  };

  const handleViewMore = (status: keyof typeof statusColumns) => {
    if (selectedProjectId && selectedProjectId !== 'all') {
      router.push(`/projects/${selectedProjectId}/tasks?status=${status}`);
    }
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

  return (
    <div className='min-h-screen bg-gray-50'>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Main Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-[240px_1fr] grid-rows-[56px_1fr] h-screen'>
          {/* Header */}
          <header className='lg:col-span-2 bg-white border-b border-gray-200 flex items-center justify-between px-6'>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className='lg:hidden p-2 hover:bg-gray-100 rounded-md'
            >
              <Menu className='w-5 h-5' />
            </button>

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
                    <div className='text-sm font-medium text-gray-900'>
                      {user?.name || '사용자'}
                    </div>
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
              <div className='p-6 border-b border-gray-200'>
                <h1 className='text-xl font-bold text-gray-900'>TaskFlow</h1>
              </div>

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
                      icon={<Users className='w-4 h-4 text-indigo-500' />}
                      label='사람'
                      onClick={() => handleNavigation('people')}
                    />
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
                      icon={<BarChart3 className='w-4 h-4 text-cyan-500' />}
                      label='대시보드'
                      onClick={() => handleNavigation('/dashboard')}
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
          <main className='p-6 overflow-auto'>
            <div className='mb-6'>
              <div className='flex items-center justify-between mb-4'>
                <h1 className='text-2xl font-bold text-gray-900'>이슈</h1>
                <div className='flex items-center space-x-4'>
                  <NotificationBell />
                  <Button onClick={() => handleCreateTask()}>
                    <Plus className='mr-2 h-4 w-4' />새 태스크
                  </Button>

                  <Button
                    variant={showActiveOnly ? 'default' : 'outline'}
                    onClick={() => setShowActiveOnly(!showActiveOnly)}
                    size='sm'
                  >
                    {showActiveOnly ? '모든 태스크' : '활성 태스크만'}
                  </Button>
                </div>
              </div>

              {/* Project Search */}
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <label className='text-sm font-medium text-gray-700'>프로젝트:</label>
                  <select
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                    className='px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
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
            </div>

            {/* Kanban Board */}
            {loading ? (
              <div className='flex items-center justify-center h-64'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
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
            onClose={closeModal}
            onSave={handleTaskSave}
            onDelete={handleTaskDelete}
          />
        )}
      </DndContext>
    </div>
  );
}

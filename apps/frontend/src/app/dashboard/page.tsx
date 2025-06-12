'use client';

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
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
  X,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <h3 className='font-medium text-gray-900 mb-2 line-clamp-2'>{task.title}</h3>
      {task.description && (
        <div className='text-xs text-gray-600 mb-3 line-clamp-2'>{task.description}</div>
      )}

      <div className='flex items-center justify-between'>
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
        {task.assignee && (
          <div className='flex items-center gap-2'>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${!task.assignee.profileColor ? getUserColor(task.assignee.id) : ''}`}
              style={getUserColorStyle(task.assignee)}
              title={task.assignee.name}
            >
              {task.assignee.name.charAt(0)}
            </div>
            <span className='text-xs text-gray-600 font-medium'>{task.assignee.name}</span>
          </div>
        )}
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className='flex flex-wrap gap-1 mt-2'>
          {task.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className='px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded'>
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className='px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded'>
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
  onCreateTask: (status: keyof typeof statusColumns) => void;
}

function DroppableColumn({
  id,
  title,
  config,
  tasks,
  onTaskClick,
  onCreateTask,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-80 bg-white rounded-lg shadow-sm border border-gray-200 ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
    >
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
              {config.title}
            </span>
          </div>
          <span className='bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs'>
            {tasks.length}
          </span>
        </div>
      </div>

      <SortableContext
        items={tasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
        id={id}
      >
        <div
          className={`p-4 space-y-3 min-h-48 flex-1 ${config.bgColor} ${isOver ? 'bg-opacity-80' : ''}`}
          data-status={id}
          style={{ minHeight: '300px' }}
        >
          {tasks.map(task => (
            <DraggableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}

          {/* Add Task Button for each column */}
          <button
            onClick={() => onCreateTask(id as keyof typeof statusColumns)}
            className='w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm'
          >
            + 새 작업 추가
          </button>
        </div>
      </SortableContext>
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
        // Load all tasks
        const result = await tasksApi.getTasks({ search: searchTerm });
        console.log('All tasks loaded:', result);
        setTasks(result.data || []);
      } else {
        // Load tasks for specific project with proper ordering
        try {
          const orderedTasks = await tasksApi.getTasksByProjectOrdered(selectedProjectId);
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
    const organized: Record<string, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    };

    filteredTasks.forEach(task => {
      organized[task.status].push(task);
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

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const taskToUpdate = tasks.find(task => task.id === activeId);

    if (!taskToUpdate) return;

    const currentProjectId =
      selectedProjectId !== 'all' ? selectedProjectId : taskToUpdate.projectId;

    // Check if dropped on a column (status change)
    if (Object.keys(statusColumns).includes(overId)) {
      const newStatus = overId as keyof typeof statusColumns;
      const targetTasks = getTasksByStatus(newStatus);
      const newPosition = targetTasks.length; // Add to end of list

      if (
        taskToUpdate.status !== newStatus ||
        newPosition !== getTasksByStatus(taskToUpdate.status).findIndex(t => t.id === activeId)
      ) {
        try {
          // Optimistic update
          const optimisticUpdate = (prevTasks: Task[]) =>
            prevTasks.map(task => (task.id === activeId ? { ...task, status: newStatus } : task));

          setTasks(optimisticUpdate);

          // Update on backend with new reorderTask API
          await tasksApi.reorderTask({
            taskId: activeId,
            projectId: currentProjectId,
            newPosition,
            newStatus: newStatus !== taskToUpdate.status ? newStatus : undefined,
          });

          // Reload tasks to get updated lexoRanks
          await loadTasks();
        } catch (error) {
          console.error('Failed to reorder task:', error);
          // Revert local changes on error
          setTasks(prevTasks =>
            prevTasks.map(task => (task.id === activeId ? taskToUpdate : task))
          );
          alert('태스크 이동에 실패했습니다. 다시 시도해주세요.');
        }
      }
    }
    // Handle reordering within the same status column
    else if (overId !== activeId) {
      const overTask = tasks.find(task => task.id === overId);
      if (overTask && overTask.status === taskToUpdate.status) {
        const statusTasks = getTasksByStatus(taskToUpdate.status);
        const draggedIndex = statusTasks.findIndex(t => t.id === activeId);
        const targetIndex = statusTasks.findIndex(t => t.id === overId);

        if (draggedIndex !== targetIndex && draggedIndex !== -1 && targetIndex !== -1) {
          try {
            // Optimistic reorder
            const reorderedTasks = [...statusTasks];
            const [draggedTask] = reorderedTasks.splice(draggedIndex, 1);
            reorderedTasks.splice(targetIndex, 0, draggedTask);

            setTasks(prevTasks =>
              prevTasks.map(task => {
                const reorderedTask = reorderedTasks.find(rt => rt.id === task.id);
                return reorderedTask || task;
              })
            );

            // Update on backend
            await tasksApi.reorderTask({
              taskId: activeId,
              projectId: currentProjectId,
              newPosition: targetIndex,
            });

            // Reload tasks to get updated lexoRanks
            await loadTasks();
          } catch (error) {
            console.error('Failed to reorder task:', error);
            // Revert on error
            await loadTasks();
            alert('태스크 순서 변경에 실패했습니다. 다시 시도해주세요.');
          }
        }
      }
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
      console.log('Saving task:', taskData);

      if (selectedTask?.id) {
        // Update existing task
        const updatedTask = await tasksApi.updateTask(selectedTask.id, taskData);
        console.log('Task updated:', updatedTask);
        setTasks(prevTasks =>
          prevTasks.map(task => (task.id === selectedTask.id ? updatedTask : task))
        );
      } else {
        // Create new task
        const newTask = await tasksApi.createTask({
          title: taskData.title!,
          description: taskData.description,
          projectId: taskData.projectId!,
          priority: taskData.priority,
          assigneeId: taskData.assigneeId,
          dueDate: taskData.dueDate,
          estimatedHours: taskData.estimatedHours,
          tags: taskData.tags,
        });
        console.log('New task created:', newTask);
        setTasks(prevTasks => [newTask, ...prevTasks]);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save task:', error);
      // 사용자에게 에러 표시
      alert('태스크 저장에 실패했습니다. 다시 시도해주세요.');
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
            <div className='flex items-center justify-between mb-6'>
              <h1 className='text-xl font-semibold text-gray-900'>활성 스프린트</h1>
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
                    onCreateTask={handleCreateTask}
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
          />
        )}
      </DndContext>
    </div>
  );
}

function TaskModal({
  task,
  projects,
  onClose,
  onSave,
}: {
  task: Task | null;
  projects: any[];
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
}) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: (task?.status || 'TODO') as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
    priority: (task?.priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    projectId: task?.projectId || projects[0]?.id || '',
    assigneeId: task?.assigneeId || user?.id || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    estimatedHours: task?.estimatedHours?.toString() || '',
    tags: task?.tags?.join(', ') || '',
  });

  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'OWNER' | 'MANAGER' | 'MEMBER'>('MEMBER');
  const [loading, setLoading] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Load project members when project changes
  useEffect(() => {
    const loadProjectMembers = async () => {
      if (!formData.projectId) return;

      try {
        setLoading(true);
        const members = await projectsApi.getProjectMembers(formData.projectId);
        setProjectMembers(members);

        // Find current user's role in the project
        const currentMember = members.find(member => member.userId === user?.id);
        setCurrentUserRole(currentMember?.role || 'MEMBER');

        // If user is a member (not owner/manager), set assignee to themselves
        if (currentMember?.role === 'MEMBER' && !task?.id) {
          setFormData(prev => ({ ...prev, assigneeId: user?.id || '' }));
        }
      } catch (error) {
        console.error('Failed to load project members:', error);
        setProjectMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjectMembers();
  }, [formData.projectId, user?.id, task?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      ...formData,
      assigneeId: formData.assigneeId || undefined,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      tags: formData.tags
        ? formData.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
        : undefined,
      dueDate: formData.dueDate || undefined,
    };
    onSave(taskData);
  };

  const canSelectAssignee = currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';
  const isEditMode = !!task?.id; // 수정 모드인지 확인

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-lg font-semibold'>{task?.id ? '이슈 수정' : '새 이슈 생성'}</h2>
          <button onClick={onClose} className='p-2 hover:bg-gray-100 rounded-lg'>
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>제목 *</label>
            <input
              type='text'
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='이슈 제목을 입력하세요'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>프로젝트 *</label>
            <select
              required
              value={formData.projectId}
              onChange={e => setFormData({ ...formData, projectId: e.target.value })}
              disabled={isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditMode ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
              }`}
            >
              <option value=''>프로젝트를 선택하세요</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {isEditMode && (
              <p className='text-xs text-gray-500 mt-1'>
                수정 시에는 프로젝트를 변경할 수 없습니다.
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>담당자 *</label>
            {canSelectAssignee ? (
              <select
                required
                value={formData.assigneeId}
                onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
                disabled={loading}
              >
                <option value=''>담당자를 선택하세요</option>
                {projectMembers.map(member => (
                  <option key={member.id} value={member.userId}>
                    {member.user?.name || member.userId} (
                    {member.role === 'OWNER'
                      ? '소유자'
                      : member.role === 'MANAGER'
                        ? '관리자'
                        : '멤버'}
                    )
                  </option>
                ))}
              </select>
            ) : (
              <div className='relative'>
                <input
                  type='text'
                  value={user?.name || '나'}
                  disabled
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed'
                />
                <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                  <span className='text-xs text-gray-400'>멤버는 본인만 할당 가능</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>설명</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='이슈에 대한 상세 설명을 입력하세요...'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>상태</label>
              <select
                value={formData.status}
                onChange={e =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='TODO'>할 일</option>
                <option value='IN_PROGRESS'>진행 중</option>
                <option value='COMPLETED'>완료</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>우선순위</label>
              <select
                value={formData.priority}
                onChange={e =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='LOW'>낮음</option>
                <option value='MEDIUM'>보통</option>
                <option value='HIGH'>높음</option>
                <option value='URGENT'>긴급</option>
              </select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>마감일</label>
              <input
                type='date'
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                예상 시간 (시간)
              </label>
              <input
                type='number'
                step='0.5'
                value={formData.estimatedHours}
                onChange={e => setFormData({ ...formData, estimatedHours: e.target.value })}
                placeholder='8'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>태그</label>
            <input
              type='text'
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder='태그를 쉼표로 구분하여 입력하세요 (예: 백엔드, 인증, 보안)'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50'
            >
              취소
            </button>
            <button
              type='submit'
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
              disabled={loading}
            >
              {loading ? '처리 중...' : task?.id ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

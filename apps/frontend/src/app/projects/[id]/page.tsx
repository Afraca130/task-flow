'use client';

import { TaskModal } from '@/components/task-modal';
import { Button } from '@/components/ui/button';
import { Project, projectsApi, Task, tasksApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Load project and tasks
  useEffect(() => {
    if (!isAuthenticated || !projectId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [projectData, tasksData] = await Promise.all([
          projectsApi.getProject(projectId),
          tasksApi.getTasksByProject(projectId),
        ]);

        setProject(projectData);
        setTasks(tasksData);
      } catch (error) {
        console.error('Failed to load project data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, projectId]);

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
  };

  const handleTaskSave = async (taskData: Partial<Task>) => {
    try {
      let savedTask: Task;
      if (selectedTask?.id) {
        savedTask = await tasksApi.updateTask(selectedTask.id, taskData);
        setTasks(prevTasks => prevTasks.map(task => (task.id === savedTask.id ? savedTask : task)));
      } else {
        savedTask = await tasksApi.createTask(taskData as any);
        setTasks(prevTasks => [...prevTasks, savedTask]);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-500'>프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>프로젝트를 찾을 수 없습니다</h1>
          <Button onClick={() => router.push('/projects')}>프로젝트 목록으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              onClick={() => router.push('/projects')}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              프로젝트 목록
            </Button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>{project.name}</h1>
              {project.description && <p className='text-gray-600'>{project.description}</p>}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => router.push(`/projects/${projectId}/settings`)}
              className='flex items-center gap-2'
            >
              <Settings className='w-4 h-4' />
              설정
            </Button>

            <Button onClick={handleCreateTask} className='flex items-center gap-2'>
              <Plus className='w-4 h-4' />새 태스크
            </Button>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer'
            >
              <div className='space-y-4'>
                <div className='flex items-start justify-between'>
                  <h3 className='font-medium text-gray-900 line-clamp-2'>{task.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'TODO'
                        ? 'bg-blue-100 text-blue-800'
                        : task.status === 'IN_PROGRESS'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {task.status === 'TODO'
                      ? '할 일'
                      : task.status === 'IN_PROGRESS'
                        ? '진행 중'
                        : '완료'}
                  </span>
                </div>

                {task.description && (
                  <p className='text-sm text-gray-600 line-clamp-3'>{task.description}</p>
                )}

                <div className='flex items-center justify-between text-sm text-gray-500'>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'URGENT'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : task.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {task.priority === 'URGENT'
                      ? '긴급'
                      : task.priority === 'HIGH'
                        ? '높음'
                        : task.priority === 'MEDIUM'
                          ? '보통'
                          : '낮음'}
                  </span>

                  {task.assignee && (
                    <div className='flex items-center gap-2'>
                      <div className='w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs'>
                        {task.assignee.name?.charAt(0) || 'U'}
                      </div>
                      <span>{task.assignee.name}</span>
                    </div>
                  )}
                </div>

                {task.dueDate && (
                  <div className='text-xs text-gray-500'>
                    마감: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className='text-center py-12'>
            <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center'>
              <Plus className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>아직 태스크가 없습니다</h3>
            <p className='text-gray-500 mb-4'>첫 번째 태스크를 생성해보세요.</p>
            <Button onClick={handleCreateTask}>
              <Plus className='w-4 h-4 mr-2' />새 태스크 생성
            </Button>
          </div>
        )}
      </div>

      {/* Task Modal with Fixed Project */}
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          onClose={closeModal}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
          projects={project ? [project] : []}
          fixedProjectId={projectId}
        />
      )}
    </div>
  );
}

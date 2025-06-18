'use client';

import { ArrowLeft, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TaskModal } from '../../components/task-modal';
import { Task, tasksApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { useProjectsStore } from '../../store/projects';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

const statusLabels: Record<TaskStatus, string> = {
  TODO: '할 일',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
};

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { projects } = useProjectsStore();

  const status = searchParams.get('status') as TaskStatus;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!status || !isAuthenticated) return;

    const loadTasks = async () => {
      try {
        setLoading(true);
        const result = await tasksApi.getTasks({
          status,
          search: searchTerm,
          limit: 100,
        });
        setTasks(result.data || []);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [status, searchTerm, isAuthenticated]);

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

  if (!status) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>잘못된 접근입니다</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          >
            대시보드로 돌아가기
          </button>
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
            <button
              onClick={() => router.push('/dashboard')}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                전체 프로젝트 - {statusLabels[status]}
              </h1>
              <p className='text-gray-600'>모든 프로젝트의 {statusLabels[status]} 작업 목록</p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='relative'>
              <Search className='w-5 h-5 absolute left-3 top-3 text-gray-400' />
              <input
                type='text'
                placeholder='작업 검색...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-80 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>작업을 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer'
              >
                <div className='space-y-4'>
                  <div className='flex items-start justify-between'>
                    <h3 className='font-medium text-gray-900 line-clamp-2'>{task.title}</h3>
                    {task.priority && (
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
                    )}
                  </div>

                  {task.description && (
                    <p className='text-sm text-gray-600 line-clamp-3'>{task.description}</p>
                  )}

                  <div className='flex items-center justify-between text-sm text-gray-500'>
                    <span>{task.project?.name || '프로젝트 없음'}</span>
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
        )}

        {/* Empty State */}
        {!loading && tasks.length === 0 && (
          <div className='text-center py-12'>
            <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center'>
              <Search className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {searchTerm ? '검색 결과가 없습니다' : `${statusLabels[status]} 작업이 없습니다`}
            </h3>
            <p className='text-gray-500'>
              {searchTerm ? '다른 검색어를 시도해보세요.' : '아직 해당 상태의 작업이 없습니다.'}
            </p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          onClose={closeModal}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
          projects={projects}
        />
      )}
    </div>
  );
}

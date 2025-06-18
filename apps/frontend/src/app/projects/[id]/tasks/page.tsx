'use client';

import { AlertCircle, ArrowLeft, Calendar, Tag } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Task, tasksApi } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/auth';

const statusLabels = {
  TODO: '할 일',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
};

const statusColors = {
  TODO: 'text-blue-600 bg-blue-50 border-blue-200',
  IN_PROGRESS: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  COMPLETED: 'text-green-600 bg-green-50 border-green-200',
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

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

function TaskCard({ task, onClick }: TaskCardProps) {
  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  };

  const priorityLabels = {
    LOW: '낮음',
    MEDIUM: '보통',
    HIGH: '높음',
    URGENT: '긴급',
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
      className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer'
      onClick={onClick}
    >
      <div className='flex items-start justify-between mb-3'>
        <h3 className='font-medium text-gray-900 line-clamp-2 flex-1 mr-2'>{task.title}</h3>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}
        >
          {priorityLabels[task.priority]}
        </span>
      </div>

      {task.description && (
        <p className='text-gray-600 text-sm mb-3 line-clamp-2'>{task.description}</p>
      )}

      <div className='flex items-center justify-between text-xs text-gray-500 mb-3'>
        <div className='flex items-center gap-3'>
          {task.assignee && (
            <div className='flex items-center gap-2'>
              <div
                className='w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium'
                style={getAssigneeAvatarStyle(task.assignee)}
              >
                {task.assignee.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span>{task.assignee.name}</span>
            </div>
          )}

          {task.dueDate && (
            <div className='flex items-center gap-1'>
              <Calendar className='w-3 h-3' />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className='text-xs text-gray-400'>{new Date(task.createdAt).toLocaleDateString()}</div>
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className='flex flex-wrap gap-1 mt-3'>
          <Tag className='w-3 h-3 text-gray-400' />
          {task.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded'>
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded'>
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectTasksPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const projectId = params.id as string;
  const status = searchParams.get('status') as keyof typeof statusLabels;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const limit = 20;

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Load tasks
  useEffect(() => {
    if (!isAuthenticated || !projectId || !status) return;

    const loadTasks = async () => {
      try {
        setLoading(true);
        const result = await tasksApi.getAllTasksByProjectAndStatus(projectId, status, page, limit);

        if (page === 1) {
          setTasks(result.data || []);
        } else {
          setTasks(prev => [...prev, ...(result.data || [])]);
        }

        setTotal(result.meta?.total || 0);
        setHasMore((result.data?.length || 0) === limit);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [isAuthenticated, projectId, status, page]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleTaskClick = (task: Task) => {
    // 태스크 상세 모달을 열거나 상세 페이지로 이동
    console.log('Task clicked:', task);
  };

  const handleBack = () => {
    router.back();
  };

  if (!status || !statusLabels[status]) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h1 className='text-xl font-semibold text-gray-900 mb-2'>잘못된 상태</h1>
          <p className='text-gray-600 mb-4'>유효하지 않은 작업 상태입니다.</p>
          <Button onClick={handleBack}>돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-6xl mx-auto px-4 py-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' onClick={handleBack} className='flex items-center gap-2'>
              <ArrowLeft className='w-4 h-4' />
              돌아가기
            </Button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>{statusLabels[status]} 작업</h1>
              <p className='text-gray-600'>총 {total}개의 작업</p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full border ${statusColors[status]}`}>
            {statusLabels[status]}
          </div>
        </div>

        {/* Tasks Grid */}
        {loading && page === 1 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className='bg-white border border-gray-200 rounded-lg p-4 animate-pulse'
              >
                <div className='h-4 bg-gray-200 rounded mb-2'></div>
                <div className='h-3 bg-gray-200 rounded mb-3 w-3/4'></div>
                <div className='flex justify-between'>
                  <div className='h-3 bg-gray-200 rounded w-1/4'></div>
                  <div className='h-3 bg-gray-200 rounded w-1/4'></div>
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length > 0 ? (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className='text-center'>
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant='outline'
                  className='px-6 py-2'
                >
                  {loading ? '로딩 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className='text-center py-12'>
            <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center'>
              <AlertCircle className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {statusLabels[status]} 작업이 없습니다
            </h3>
            <p className='text-gray-500'>이 상태의 작업이 아직 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

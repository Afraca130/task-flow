'use client';

import { Button } from '@/components/ui/button';
import { Issue, issuesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import { AlertCircle, ArrowLeft, Bug, Clock, Plus, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function IssuesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { projects } = useProjectsStore();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    projectId: '',
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Load issues
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadIssues = async () => {
      try {
        setLoading(true);
        const result = await issuesApi.getIssues({ page: 1, limit: 100 });
        setIssues(result.data || []);
      } catch (error) {
        console.error('Failed to load issues:', error);
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, [isAuthenticated]);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.projectId) return;

    try {
      const newIssue = await issuesApi.createIssue({
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        priority: createForm.priority,
        projectId: createForm.projectId,
      });

      setIssues(prev => [newIssue, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        projectId: '',
      });
    } catch (error) {
      console.error('Failed to create issue:', error);
      alert('이슈 생성에 실패했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto py-8 px-4'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.back()}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>이슈 게시판</h1>
              <p className='text-gray-600'>프로젝트 이슈를 관리하세요</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className='mr-2 h-4 w-4' />새 이슈 작성
          </Button>
        </div>

        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>이슈를 불러오는 중...</p>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className='text-center py-12'>
            <Bug className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>등록된 이슈가 없습니다</h3>
            <p className='text-gray-600 mb-6'>새 이슈를 생성하여 시작해보세요.</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {issues.map(issue => (
              <div
                key={issue.id}
                className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>{issue.title}</h3>
                    {issue.description && (
                      <p className='text-gray-600 mb-3 line-clamp-2'>{issue.description}</p>
                    )}
                  </div>
                  <div className='flex items-center gap-2 ml-4'>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}
                    >
                      {issue.status === 'OPEN'
                        ? '열림'
                        : issue.status === 'IN_PROGRESS'
                          ? '진행중'
                          : issue.status === 'RESOLVED'
                            ? '해결됨'
                            : '닫힘'}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}
                    >
                      {issue.priority === 'URGENT'
                        ? '긴급'
                        : issue.priority === 'HIGH'
                          ? '높음'
                          : issue.priority === 'MEDIUM'
                            ? '보통'
                            : '낮음'}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between text-sm text-gray-500'>
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-1'>
                      <User className='w-4 h-4' />
                      <span>{issue.author?.name || '작성자'}</span>
                    </div>
                    {issue.assignee && (
                      <div className='flex items-center gap-1'>
                        <AlertCircle className='w-4 h-4' />
                        <span>담당: {issue.assignee.name}</span>
                      </div>
                    )}
                    <div className='flex items-center gap-1'>
                      <Clock className='w-4 h-4' />
                      <span>{formatDate(issue.createdAt)}</span>
                    </div>
                  </div>
                  <div className='text-xs text-gray-400'>{issue.project?.name || '프로젝트'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg max-w-2xl w-full p-6'>
              <h3 className='text-lg font-semibold mb-4'>새 이슈 작성</h3>
              <form onSubmit={handleCreateIssue} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>제목</label>
                  <input
                    type='text'
                    value={createForm.title}
                    onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder='이슈 제목을 입력하세요'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>설명</label>
                  <textarea
                    rows={4}
                    value={createForm.description}
                    onChange={e =>
                      setCreateForm(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder='이슈 내용을 입력하세요'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>우선순위</label>
                    <select
                      value={createForm.priority}
                      onChange={e =>
                        setCreateForm(prev => ({ ...prev, priority: e.target.value as any }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='LOW'>낮음</option>
                      <option value='MEDIUM'>보통</option>
                      <option value='HIGH'>높음</option>
                      <option value='URGENT'>긴급</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>프로젝트</label>
                    <select
                      value={createForm.projectId}
                      onChange={e =>
                        setCreateForm(prev => ({ ...prev, projectId: e.target.value }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                      required
                    >
                      <option value=''>프로젝트 선택</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='flex justify-end gap-3 pt-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateForm({
                        title: '',
                        description: '',
                        priority: 'MEDIUM',
                        projectId: '',
                      });
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    type='submit'
                    disabled={!createForm.title.trim() || !createForm.projectId}
                  >
                    등록
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

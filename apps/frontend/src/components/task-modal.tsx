'use client';

import { Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Comment, commentsApi, projectsApi, Task, tasksApi } from '../lib/api';
import { useAuthStore } from '../store/auth';

interface TaskModalProps {
  task: Task | null;
  projects: any[];
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  currentProjectId?: string;
  fixedProjectId?: string;
}

export function TaskModal({
  task,
  projects,
  onClose,
  onSave,
  onDelete,
  currentProjectId,
}: TaskModalProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    projectId: currentProjectId || projects[0]?.id || '',
    assigneeId: user?.id || '',
    dueDate: '',
    tags: '',
    // rank 필드 제거 - 백엔드에서 자동으로 맨 위로 설정됨
  });

  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'OWNER' | 'MANAGER' | 'MEMBER'>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

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

  // Load comments when task changes
  useEffect(() => {
    const loadComments = async () => {
      if (!task?.id) return;

      try {
        const taskComments = await commentsApi.getTaskComments(task.id);
        setComments(taskComments);
      } catch (error) {
        console.error('Failed to load comments:', error);
        setComments([]);
      }
    };

    loadComments();
  }, [task?.id]);

  // Fix initialization to show existing content when editing
  useEffect(() => {
    if (task?.id) {
      // Editing existing task
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || ('TODO' as 'TODO' | 'IN_PROGRESS' | 'COMPLETED'),
        priority: task.priority || ('MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'),
        projectId: task.projectId || currentProjectId || projects[0]?.id || '',
        assigneeId: task.assigneeId || user?.id || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        tags: task.tags?.join(', ') || '',
      });
    } else if (task && task.status && !task.id) {
      // Creating new task with specific status
      setFormData(prev => ({
        ...prev,
        status: task.status as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
        projectId: currentProjectId || projects[0]?.id || '',
      }));
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        projectId: currentProjectId || projects[0]?.id || '',
        assigneeId: user?.id || '',
        dueDate: '',
        tags: '',
      });
    }
  }, [task?.id, task?.status, user?.id, currentProjectId, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      ...formData,
      assignerId: user?.id,
      assigneeId: formData.assigneeId || undefined,
      dueDate: formData.dueDate || undefined,
      tags: formData.tags
        ? formData.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
        : undefined,
    };
    onSave(taskData);
  };

  const handleDelete = async () => {
    if (!task?.id) return;

    if (!confirm('이 이슈를 삭제하시겠습니까? 모든 댓글도 함께 삭제됩니다.')) return;

    try {
      await tasksApi.deleteTask(task.id);
      if (onDelete) {
        onDelete(task.id);
      }
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('이슈 삭제에 실패했습니다.');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task?.id) return;

    try {
      const comment = await commentsApi.createComment({
        taskId: task.id,
        content: newComment.trim(),
      });
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleAddReply = async (parentId: string) => {
    // Nested comments not supported - remove this functionality
    setReplyContent('');
    setReplyingTo(null);
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const updatedComment = await commentsApi.updateComment(commentId, editContent.trim());
      setComments(prev =>
        prev.map(comment => (comment.id === commentId ? updatedComment : comment))
      );
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

    try {
      await commentsApi.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const canSelectAssignee = currentUserRole === 'OWNER' || currentUserRole === 'MANAGER';
  const canDeleteTask =
    currentUserRole === 'OWNER' || currentUserRole === 'MANAGER' || task?.assignerId === user?.id;
  const isEditMode = !!task?.id;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-lg font-semibold'>{task?.id ? '이슈 수정' : '새 이슈 생성'}</h2>
          <div className='flex items-center gap-2'>
            {task?.id && canDeleteTask && (
              <button
                onClick={handleDelete}
                className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                title='이슈 삭제'
              >
                <Trash2 className='w-5 h-5' />
              </button>
            )}
            <button onClick={onClose} className='p-2 hover:bg-gray-100 rounded-lg'>
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        <div className='flex'>
          {/* Left side - Form */}
          <div className='flex-1 p-6'>
            <form onSubmit={handleSubmit} className='space-y-4'>
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
                {currentProjectId ? (
                  <input
                    type='text'
                    value={projects.find(p => p.id === formData.projectId)?.name || ''}
                    disabled
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed'
                  />
                ) : (
                  <select
                    required
                    value={formData.projectId}
                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>프로젝트를 선택하세요</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
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
                        {member.user?.name || member.user?.email} (
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

          {/* Right side - Comments */}
          {task?.id && (
            <div className='w-96 border-l border-gray-200 p-6'>
              <h3 className='text-lg font-semibold mb-4'>댓글 ({comments.length})</h3>

              {/* Add new comment */}
              <div className='mb-6'>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder='댓글을 입력하세요...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className='mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                >
                  댓글 작성
                </button>
              </div>

              {/* Comments list */}
              <div className='space-y-4 max-h-96 overflow-y-auto'>
                {comments.map(comment => (
                  <div key={comment.id} className='border border-gray-200 rounded-lg p-3'>
                    <div className='flex items-start justify-between mb-2'>
                      <div className='flex items-center gap-2'>
                        <div
                          className='w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white'
                          style={{ backgroundColor: comment.user?.profileColor || '#3B82F6' }}
                        >
                          {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className='text-sm font-medium'>{comment.user?.name}</span>
                        <span className='text-xs text-gray-500'>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {comment.user?.id === user?.id && (
                        <div className='flex gap-1'>
                          <button
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditContent(comment.content);
                            }}
                            className='text-xs text-blue-600 hover:text-blue-700'
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className='text-xs text-red-600 hover:text-red-700'
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>

                    {editingComment === comment.id ? (
                      <div>
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          className='w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none'
                          rows={2}
                        />
                        <div className='flex gap-2 mt-2'>
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            className='px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700'
                          >
                            저장
                          </button>
                          <button
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent('');
                            }}
                            className='px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400'
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className='text-sm text-gray-700 mb-2'>{comment.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { Issue, issuesApi, projectsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface IssueModalProps {
  issue: Issue | null;
  onClose: () => void;
  onSave: (issue: Issue) => void;
  fixedProjectId?: string;
}

export function IssueModal({ issue, onClose, onSave, fixedProjectId }: IssueModalProps) {
  const { user } = useAuthStore();
  const { projects } = useProjectsStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'BUG' as 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'QUESTION' | 'DISCUSSION',
    projectId: fixedProjectId || projects[0]?.id || '',
    mentionedUserIds: [] as string[],
  });

  const [projectMembers, setProjectMembers] = useState<any[]>([]);
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
      } catch (error) {
        console.error('Failed to load project members:', error);
        setProjectMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjectMembers();
  }, [formData.projectId]);

  // Initialize form data when issue changes
  useEffect(() => {
    if (issue?.id) {
      // Editing existing issue
      setFormData({
        title: issue.title || '',
        description: issue.description || '',
        type: issue.type || 'BUG',
        projectId: issue.projectId || fixedProjectId || projects[0]?.id || '',
        mentionedUserIds: [],
      });
    } else {
      // Creating new issue
      setFormData({
        title: '',
        description: '',
        type: 'BUG',
        projectId: fixedProjectId || projects[0]?.id || '',
        mentionedUserIds: [],
      });
    }
  }, [issue?.id, fixedProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setLoading(true);

      let savedIssue: Issue;
      if (issue?.id) {
        // Update existing issue
        savedIssue = await issuesApi.updateIssue(issue.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
        });
      } else {
        // Create new issue
        if (formData.mentionedUserIds.length > 0) {
          savedIssue = await issuesApi.createIssueWithMentions({
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            type: formData.type,
            projectId: formData.projectId,
            mentionedUserIds: formData.mentionedUserIds,
          });
        } else {
          savedIssue = await issuesApi.createIssue({
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            type: formData.type,
            projectId: formData.projectId,
          });
        }
      }

      onSave(savedIssue);
      onClose();
    } catch (error) {
      console.error('Failed to save issue:', error);
      alert('이슈 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMentionToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      mentionedUserIds: prev.mentionedUserIds.includes(userId)
        ? prev.mentionedUserIds.filter(id => id !== userId)
        : [...prev.mentionedUserIds, userId],
    }));
  };

  const getSelectedProjectName = () => {
    return projects.find(p => p.id === formData.projectId)?.name || '프로젝트 선택';
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            {issue?.id ? '이슈 수정' : '새 이슈 생성'}
          </h2>
          <button onClick={onClose} className='p-2 hover:bg-gray-100 rounded-lg transition-colors'>
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>제목 *</label>
            <input
              type='text'
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder='이슈 제목을 입력하세요'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>설명</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder='이슈에 대한 상세 설명을 입력하세요...'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>이슈 유형</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='BUG'>🐛 버그</option>
              <option value='FEATURE'>✨ 기능 요청</option>
              <option value='IMPROVEMENT'>⚡ 개선사항</option>
              <option value='QUESTION'>❓ 질문</option>
              <option value='DISCUSSION'>💬 토론</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>프로젝트</label>
            <div className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed'>
              {getSelectedProjectName()}
            </div>
            <p className='text-xs text-gray-500 mt-1'>프로젝트는 변경할 수 없습니다.</p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              멤버 언급 (알림 전송)
            </label>
            <div className='space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3'>
              {projectMembers.length === 0 ? (
                <p className='text-gray-500 text-sm'>프로젝트 멤버를 불러오는 중...</p>
              ) : (
                projectMembers.map(member => (
                  <label key={member.id} className='flex items-center gap-3 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={formData.mentionedUserIds.includes(member.userId)}
                      onChange={() => handleMentionToggle(member.userId)}
                      className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    />
                    <div className='flex items-center gap-2'>
                      <div
                        className='w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white'
                        style={{ backgroundColor: member.user?.profileColor || '#3B82F6' }}
                      >
                        {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className='text-sm'>
                        {member.user?.name || member.user?.email}
                        <span className='text-gray-500 ml-1'>
                          (
                          {member.role === 'OWNER'
                            ? '소유자'
                            : member.role === 'MANAGER'
                              ? '관리자'
                              : '멤버'}
                          )
                        </span>
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
            {formData.mentionedUserIds.length > 0 && (
              <p className='text-sm text-blue-600 mt-2'>
                {formData.mentionedUserIds.length}명의 멤버에게 알림이 전송됩니다.
              </p>
            )}
          </div>

          <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50'
              disabled={loading}
            >
              취소
            </button>
            <button
              type='submit'
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400'
              disabled={loading || !formData.title.trim()}
            >
              {loading ? '처리 중...' : issue?.id ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

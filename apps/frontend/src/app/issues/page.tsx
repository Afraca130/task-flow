'use client';

import { ArrowLeft, Bug, Clock, Plus, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IssueModal } from '../../components/issue-modal';
import { Button } from '../../components/ui/button';
import { Issue, issuesApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { useProjectsStore } from '../../store/projects';

export default function IssuesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const { projects } = useProjectsStore();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get fixed project from URL parameter
  const fixedProjectId = searchParams.get('projectId') || undefined;
  const selectedProject = fixedProjectId ? projects.find(p => p.id === fixedProjectId) : undefined;

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
        let loadedIssues = result.data || [];

        // Filter by project if specified
        if (fixedProjectId) {
          loadedIssues = loadedIssues.filter(issue => issue.projectId === fixedProjectId);
        }

        setIssues(loadedIssues);
      } catch (error) {
        console.error('Failed to load issues:', error);
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, [isAuthenticated, fixedProjectId]);

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  const handleCreateIssue = () => {
    setSelectedIssue(null);
    setIsModalOpen(true);
  };

  const handleModalSave = (savedIssue: Issue) => {
    if (selectedIssue?.id) {
      // Update existing issue
      setIssues(prev => prev.map(issue => (issue.id === savedIssue.id ? savedIssue : issue)));
    } else {
      // Add new issue
      setIssues(prev => [savedIssue, ...prev]);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedIssue(null);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BUG':
        return 'bg-red-100 text-red-800';
      case 'FEATURE':
        return 'bg-blue-100 text-blue-800';
      case 'IMPROVEMENT':
        return 'bg-green-100 text-green-800';
      case 'QUESTION':
        return 'bg-yellow-100 text-yellow-800';
      case 'DISCUSSION':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUG':
        return '🐛';
      case 'FEATURE':
        return '✨';
      case 'IMPROVEMENT':
        return '⚡';
      case 'QUESTION':
        return '❓';
      case 'DISCUSSION':
        return '💬';
      default:
        return '📝';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'BUG':
        return '버그';
      case 'FEATURE':
        return '기능 요청';
      case 'IMPROVEMENT':
        return '개선사항';
      case 'QUESTION':
        return '질문';
      case 'DISCUSSION':
        return '토론';
      default:
        return type;
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
              <h1 className='text-2xl font-bold text-gray-900'>
                {selectedProject ? `${selectedProject.name} ` : ''}이슈 게시판
              </h1>
              <p className='text-gray-600'>
                {selectedProject
                  ? `${selectedProject.name} 프로젝트의 이슈를 관리하세요`
                  : '프로젝트 이슈를 관리하세요'}
              </p>
            </div>
          </div>
          <Button onClick={handleCreateIssue}>
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
                onClick={() => handleIssueClick(issue)}
                className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer'
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
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(issue.type)}`}
                    >
                      {getTypeLabel(issue.type)}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between text-sm text-gray-500'>
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-1'>
                      <User className='w-4 h-4' />
                      <span>{issue.author?.name || '작성자'}</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Clock className='w-4 h-4' />
                      <span>{formatDate(issue.createdAt)}</span>
                    </div>
                  </div>
                  {!selectedProject && (
                    <div className='text-xs text-gray-400'>{issue.project?.name || '프로젝트'}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issue Modal */}
      {isModalOpen && (
        <IssueModal
          issue={selectedIssue}
          onClose={handleModalClose}
          onSave={handleModalSave}
          fixedProjectId={fixedProjectId}
        />
      )}
    </div>
  );
}

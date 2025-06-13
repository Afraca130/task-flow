'use client';

import { Button } from '@/components/ui/button';
import { Project, projectsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import { Activity, ArrowLeft, Calendar, FolderOpen, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { projects, setProjects } = useProjectsStore();
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Load projects
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadProjects = async () => {
      try {
        setLoading(true);
        const result = await projectsApi.getProjects({ page: 1, limit: 100 });
        const projectList = Array.isArray(result) ? result : result.data || [];
        setProjects(projectList);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [isAuthenticated, setProjects]);

  const handleProjectClick = (project: Project) => {
    // 프로젝트 클릭 시 해당 프로젝트의 대시보드로 이동
    router.push(`/dashboard?projectId=${project.id}`);
  };

  const handleCreateProject = () => {
    // 새 프로젝트 생성 (추후 구현)
    alert('새 프로젝트 생성 기능은 곧 출시될 예정입니다!');
  };

  const getProjectColor = (project: Project) => {
    return project.color || '#3B82F6';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto py-8 px-4'>
        {/* 헤더 */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.back()}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>프로젝트</h1>
              <p className='text-gray-600'>참여 중인 프로젝트를 확인하고 관리하세요</p>
            </div>
          </div>

          <Button onClick={handleCreateProject}>
            <Plus className='mr-2 h-4 w-4' />새 프로젝트
          </Button>
        </div>

        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>프로젝트를 불러오는 중...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className='text-center py-12'>
            <FolderOpen className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>프로젝트가 없습니다</h3>
            <p className='text-gray-600 mb-6'>새 프로젝트를 생성하여 시작해보세요.</p>
            <Button onClick={handleCreateProject}>
              <Plus className='mr-2 h-4 w-4' />첫 번째 프로젝트 만들기
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative'
              >
                {/* 프로젝트 헤더 */}
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div
                      className='w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium'
                      style={{ backgroundColor: getProjectColor(project) }}
                    >
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className='font-semibold text-gray-900 group-hover:text-blue-600 transition-colors'>
                        {project.name}
                      </h3>
                      <p className='text-sm text-gray-500'>{project.memberCount || 0}명 참여</p>
                    </div>
                  </div>

                  <div className='flex items-center gap-1'>
                    <div
                      className='w-2 h-2 rounded-full'
                      style={{ backgroundColor: getProjectColor(project) }}
                    ></div>
                    <span className='text-xs text-gray-500 capitalize'>
                      {project.priority?.toLowerCase() || 'medium'}
                    </span>
                  </div>
                </div>

                {/* 프로젝트 설명 */}
                {project.description && (
                  <p className='text-sm text-gray-600 mb-4 line-clamp-2'>{project.description}</p>
                )}

                {/* 프로젝트 통계 */}
                <div className='flex items-center justify-between text-sm text-gray-500 mb-4'>
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-1'>
                      <Activity className='w-4 h-4' />
                      <span>{project.taskCount || 0}개 태스크</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Users className='w-4 h-4' />
                      <span>{project.memberCount || 0}명</span>
                    </div>
                  </div>
                </div>

                {/* 프로젝트 날짜 */}
                <div className='flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100'>
                  <div className='flex items-center gap-1'>
                    <Calendar className='w-3 h-3' />
                    <span>생성일: {formatDate(project.createdAt)}</span>
                  </div>
                  {project.dueDate && (
                    <div className='flex items-center gap-1'>
                      <span>마감: {formatDate(project.dueDate)}</span>
                    </div>
                  )}
                </div>

                {/* 호버 효과 */}
                <div className='absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity pointer-events-none'></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

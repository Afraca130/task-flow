'use client';

import { Project, projectsApi } from '@/lib/api';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  FolderOpen,
  Grid3X3,
  List,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CreateProjectModal } from './create-project-modal';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const result = await projectsApi.getProjects({ page: 1, limit: 100 });
        console.log(result);
        const projectList = Array.isArray(result) ? result : result.data || [];
        setProjects(projectList);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = projects.filter(
    project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '긴급';
      case 'HIGH':
        return '높음';
      case 'MEDIUM':
        return '보통';
      case 'LOW':
        return '낮음';
      default:
        return '보통';
    }
  };

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.isActive).length,
    completed: projects.filter(p => !p.isActive).length,
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => router.push('/dashboard')}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <ArrowLeft className='w-5 h-5' />
              </button>
              <h1 className='text-xl font-semibold text-gray-900'>프로젝트</h1>
            </div>

            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Search className='w-5 h-5 absolute left-3 top-3 text-gray-400' />
                <input
                  type='text'
                  placeholder='프로젝트 검색...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='flex border border-gray-300 rounded-lg'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid3X3 className='w-4 h-4' />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className='w-4 h-4' />
                </button>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
              >
                <Plus className='w-4 h-4' />새 프로젝트
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white p-6 rounded-lg border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>전체 프로젝트</p>
                <p className='text-2xl font-bold text-gray-900'>{stats.total}</p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <FolderOpen className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>진행 중</p>
                <p className='text-2xl font-bold text-blue-600'>{stats.active}</p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <Clock className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>완료됨</p>
                <p className='text-2xl font-bold text-green-600'>{stats.completed}</p>
              </div>
              <div className='p-3 bg-green-100 rounded-full'>
                <CheckCircle className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        {isLoading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>프로젝트를 불러오는 중...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className='text-center py-12'>
            <div className='w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center'>
              <FolderOpen className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {searchTerm ? '검색 결과가 없습니다' : '아직 프로젝트가 없습니다'}
            </h3>
            <p className='text-gray-500 mb-4'>
              {searchTerm
                ? '다른 검색어로 다시 시도해보세요.'
                : '첫 번째 프로젝트를 생성하여 시작하세요.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <Plus className='w-4 h-4' />첫 프로젝트 만들기
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className='bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer'
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <div className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div
                        className='w-4 h-4 rounded-full'
                        style={{ backgroundColor: project.color }}
                      ></div>
                      <h3 className='font-semibold text-gray-900 truncate'>{project.name}</h3>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(project.priority)}`}
                    >
                      {getPriorityLabel(project.priority)}
                    </span>
                  </div>

                  {project.description && (
                    <p className='text-gray-600 text-sm mb-4 line-clamp-2'>{project.description}</p>
                  )}

                  <div className='flex items-center justify-between text-sm text-gray-500'>
                    <div className='flex items-center gap-4'>
                      <span className='flex items-center gap-1'>
                        <Users className='w-4 h-4' />
                        {project.memberCount || 1}
                      </span>
                      <span className='flex items-center gap-1'>
                        <BarChart3 className='w-4 h-4' />
                        {project.taskCount || 0}
                      </span>
                    </div>
                    {project.dueDate && (
                      <span className='flex items-center gap-1'>
                        <Calendar className='w-4 h-4' />
                        {new Date(project.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}

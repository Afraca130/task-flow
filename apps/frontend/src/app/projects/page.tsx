'use client';

import { Activity, ArrowLeft, Calendar, FolderOpen, Plus, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Project, projectsApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { useProjectsStore } from '../../store/projects';

export default function ProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { projects, setProjects } = useProjectsStore();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [otherProjects, setOtherProjects] = useState<Project[]>([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    dueDate: '',
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Load projects
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const loadProjects = async () => {
      try {
        setLoading(true);
        console.log('Loading all projects...');

        // Get all projects (public projects or projects user has access to)
        const allProjectsResult = await projectsApi.getAllPublicProjects({ page: 1, limit: 100 });
        console.log('All projects API response:', allProjectsResult);

        // Get user's projects (projects where user is a member)
        const userProjectsResult = await projectsApi.getProjects({ page: 1, limit: 100 });
        console.log('User projects API response:', userProjectsResult);

        const allProjectsList = allProjectsResult.data || [];
        const userProjectsList = userProjectsResult.data || [];

        console.log('All projects:', allProjectsList);
        console.log('User projects:', userProjectsList);

        // Separate projects into "my projects" and "other projects"
        const userProjectIds = new Set(userProjectsList.map((p: Project) => p.id));
        const myProjectsList = allProjectsList.filter((p: Project) => userProjectIds.has(p.id));
        const otherProjectsList = allProjectsList.filter((p: Project) => !userProjectIds.has(p.id));

        setAllProjects(allProjectsList);
        setMyProjects(myProjectsList);
        setOtherProjects(otherProjectsList);
        setProjects(userProjectsList); // Keep existing behavior for other components

        console.log('My projects:', myProjectsList);
        console.log('Other projects:', otherProjectsList);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setAllProjects([]);
        setMyProjects([]);
        setOtherProjects([]);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [isAuthenticated, user?.id, setProjects]);

  const handleProjectClick = (project: Project) => {
    // Check if user is a member of this project
    const isMyProject = myProjects.some(p => p.id === project.id);

    if (isMyProject) {
      // 사용자가 속한 프로젝트 - 대시보드로 이동
      router.push(`/dashboard?projectId=${project.id}`);
    } else {
      // 사용자가 속하지 않은 프로젝트 - 접근 불가 메시지
      alert('이 프로젝트에 접근할 권한이 없습니다. 프로젝트 관리자에게 초대를 요청하세요.');
    }
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCreateForm({
      name: '',
      description: '',
      color: '#3B82F6',
      priority: 'MEDIUM',
      dueDate: '',
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      setCreating(true);
      const newProject = await projectsApi.createProject({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        color: createForm.color,
        priority: createForm.priority,
        dueDate: createForm.dueDate || undefined,
      });

      // Update projects list
      setProjects([...projects, newProject]);
      handleCloseModal();

      // Navigate to the new project
      router.push(`/dashboard?projectId=${newProject.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('프로젝트 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
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

  const priorityOptions = [
    { value: 'LOW', label: '낮음', color: '#6B7280' },
    { value: 'MEDIUM', label: '보통', color: '#3B82F6' },
    { value: 'HIGH', label: '높음', color: '#F59E0B' },
    { value: 'URGENT', label: '긴급', color: '#EF4444' },
  ];

  const colorOptions = [
    '#3B82F6', // 파랑
    '#10B981', // 초록
    '#F59E0B', // 노랑
    '#EF4444', // 빨강
    '#8B5CF6', // 보라
    '#06B6D4', // 청록
    '#F97316', // 주황
    '#EC4899', // 핑크
  ];

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
        ) : allProjects.length === 0 ? (
          <div className='text-center py-12'>
            <FolderOpen className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>프로젝트가 없습니다</h3>
            <p className='text-gray-600 mb-6'>새 프로젝트를 생성하여 시작해보세요.</p>
            <Button onClick={handleCreateProject}>
              <Plus className='mr-2 h-4 w-4' />첫 번째 프로젝트 만들기
            </Button>
          </div>
        ) : (
          <div className='space-y-8'>
            {/* 내 프로젝트 섹션 */}
            {myProjects.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-4'>
                  <h2 className='text-lg font-semibold text-gray-900'>내 프로젝트</h2>
                  <span className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                    {myProjects.length}개
                  </span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {myProjects.map(project => (
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
                            <p className='text-sm text-gray-500'>
                              {project.memberCount || 0}명 참여
                            </p>
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
                        <p className='text-sm text-gray-600 mb-4 line-clamp-2'>
                          {project.description}
                        </p>
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
              </div>
            )}

            {/* 다른 프로젝트 섹션 */}
            {otherProjects.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-4'>
                  <h2 className='text-lg font-semibold text-gray-900'>다른 프로젝트</h2>
                  <span className='bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full'>
                    {otherProjects.length}개
                  </span>
                  <span className='text-sm text-gray-500'>• 접근 권한 없음</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {otherProjects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      className='bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative opacity-75'
                    >
                      {/* 접근 불가 오버레이 */}
                      <div className='absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full'>
                        읽기 전용
                      </div>

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
                            <p className='text-sm text-gray-500'>
                              {project.memberCount || 0}명 참여
                            </p>
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
                        <p className='text-sm text-gray-600 mb-4 line-clamp-2'>
                          {project.description}
                        </p>
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
              </div>
            )}

            {/* 프로젝트가 없는 경우 */}
            {myProjects.length === 0 && otherProjects.length === 0 && (
              <div className='text-center py-12'>
                <FolderOpen className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>프로젝트가 없습니다</h3>
                <p className='text-gray-600 mb-6'>새 프로젝트를 생성하여 시작해보세요.</p>
                <Button onClick={handleCreateProject}>
                  <Plus className='mr-2 h-4 w-4' />첫 번째 프로젝트 만들기
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 새 프로젝트 생성 모달 */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-md w-full p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-gray-900'>새 프로젝트 만들기</h3>
              <button
                onClick={handleCloseModal}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  프로젝트 이름 *
                </label>
                <input
                  type='text'
                  required
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='프로젝트 이름을 입력하세요'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  프로젝트 설명
                </label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='프로젝트에 대한 설명을 입력하세요'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  프로젝트 색상
                </label>
                <div className='flex gap-2'>
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type='button'
                      onClick={() => setCreateForm({ ...createForm, color })}
                      className={`w-8 h-8 rounded-lg border-2 ${
                        createForm.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>우선순위</label>
                <select
                  value={createForm.priority}
                  onChange={e =>
                    setCreateForm({
                      ...createForm,
                      priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>마감일</label>
                <input
                  type='date'
                  value={createForm.dueDate}
                  onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>

              <div className='flex justify-end gap-3 pt-4'>
                <Button type='button' variant='outline' onClick={handleCloseModal}>
                  취소
                </Button>
                <Button type='submit' disabled={creating || !createForm.name.trim()}>
                  {creating ? '생성 중...' : '프로젝트 만들기'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

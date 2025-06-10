'use client';

import { useState, useEffect } from 'react';
import { useProjectsStore } from '@/store/projects';
import { useAuthStore } from '@/store/auth';
import { Project } from '@/lib/api';
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Archive,
  BarChart3,
  Settings,
  Star,
  Trash2,
  ExternalLink,
  Globe,
  Lock
} from 'lucide-react';

// Mock projects data
const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: '업무 관리 시스템',
    description: 'JIRA 스타일의 현대적인 업무 관리 플랫폼',
    status: 'ACTIVE',
    isPublic: true,
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    inviteCode: 'ABC123',
    approvalType: 'MANUAL',
    ownerId: 'user1',
    createdBy: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    owner: {
      id: 'user1',
      name: '김민수',
      email: 'kim@example.com',
      profileImage: '',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    members: []
  },
  {
    id: 'project-2',
    name: 'E-커머스 플랫폼',
    description: '온라인 쇼핑몰 개발 프로젝트',
    status: 'ACTIVE',
    isPublic: false,
    startDate: '2024-02-01',
    endDate: '2024-08-31',
    inviteCode: 'DEF456',
    approvalType: 'AUTO',
    ownerId: 'user2',
    createdBy: 'user2',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
    owner: {
      id: 'user2',
      name: '박영희',
      email: 'park@example.com',
      profileImage: '',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    members: []
  },
  {
    id: 'project-3',
    name: '모바일 앱 개발',
    description: 'React Native 기반 모바일 애플리케이션',
    status: 'COMPLETED',
    isPublic: true,
    startDate: '2023-09-01',
    endDate: '2024-01-31',
    inviteCode: 'GHI789',
    approvalType: 'MANUAL',
    ownerId: 'user3',
    createdBy: 'user3',
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-01-31T00:00:00Z',
    owner: {
      id: 'user3',
      name: '이철수',
      email: 'lee@example.com',
      profileImage: '',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    members: []
  }
];

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const { projects, isLoading, setProjects, addProject } = useProjectsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'>('ALL');
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    isPublic: false,
    approvalType: 'MANUAL' as 'AUTO' | 'MANUAL',
    startDate: '',
    endDate: ''
  });

  // Initialize with mock data
  useEffect(() => {
    if (projects.length === 0) {
      setProjects(mockProjects);
    }
  }, [projects.length, setProjects]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProjectData: Project = {
        id: `project-${Date.now()}`,
        ...newProject,
        status: 'ACTIVE',
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        ownerId: user?.id || 'current-user',
        createdBy: user?.id || 'current-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: user || {
          id: 'current-user',
          name: '현재 사용자',
          email: 'user@example.com',
          profileImage: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        members: []
      };
      
      addProject(newProjectData);
      setShowCreateModal(false);
      setNewProject({
        name: '',
        description: '',
        isPublic: false,
        approvalType: 'MANUAL',
        startDate: '',
        endDate: ''
      });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const getProjectStats = () => {
    const active = projects.filter(p => p.status === 'ACTIVE').length;
    const completed = projects.filter(p => p.status === 'COMPLETED').length;
    const archived = projects.filter(p => p.status === 'ARCHIVED').length;
    
    return { active, completed, archived, total: projects.length };
  };

  const stats = getProjectStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-700';
      case 'MANAGER': return 'bg-blue-100 text-blue-700';
      case 'MEMBER': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">프로젝트</h1>
            <p className="text-gray-600 mt-1">프로젝트를 생성하고 팀원들과 협업하세요</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            새 프로젝트
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">전체 프로젝트</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">진행 중</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">완료됨</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">보관됨</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Archive className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">모든 상태</option>
            <option value="ACTIVE">진행 중</option>
            <option value="COMPLETED">완료됨</option>
            <option value="ARCHIVED">보관됨</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h3>
          <p className="text-gray-500 mb-6">첫 번째 프로젝트를 생성해보세요</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            프로젝트 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} user={user!} />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">새 프로젝트 만들기</h2>
            <form onSubmit={handleCreateProject}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    프로젝트 이름 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="프로젝트 이름을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    프로젝트 설명
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      시작일
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      종료일
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    프로젝트 설정
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProject.isPublic}
                        onChange={(e) => setNewProject({ ...newProject, isPublic: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">공개 프로젝트</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    가입 승인 방식
                  </label>
                  <select
                    value={newProject.approvalType}
                    onChange={(e) => setNewProject({ ...newProject, approvalType: e.target.value as 'AUTO' | 'MANUAL' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="AUTO">자동 승인</option>
                    <option value="MANUAL">수동 승인</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  user: any;
}

function ProjectCard({ project, user }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '진행 중';
      case 'COMPLETED': return '완료됨';
      case 'ARCHIVED': return '보관됨';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
            {project.isPublic ? (
              <Globe className="w-4 h-4 text-gray-400" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <p className="text-gray-600 text-sm mb-3">{project.description}</p>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
            {getStatusLabel(project.status)}
          </span>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{project.members?.length || 0}명</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {project.owner?.name?.charAt(0) || 'U'}
          </div>
          <span className="text-xs">{project.owner?.name || '알 수 없음'}</span>
        </div>
      </div>
    </div>
  );
} 
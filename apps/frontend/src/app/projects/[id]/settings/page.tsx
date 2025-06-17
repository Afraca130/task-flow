'use client';

import { Button } from '@/components/ui/button';
import { invitationsApi, Project, ProjectMember, projectsApi, User, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import {
  ArrowLeft,
  Check,
  Crown,
  Globe,
  Lock,
  Mail,
  Plus,
  Save,
  Settings,
  Shield,
  Users,
  UserX,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProjectSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { isAuthenticated, user } = useAuthStore();
  const { projects, setProjects } = useProjectsStore();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Project settings state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'permissions'>('general');

  // Member invitation state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const projectData = await projectsApi.getProject(projectId);
        setProject(projectData);
        setProjectName(projectData.name);
        setProjectDescription(projectData.description || '');
        setIsPublic(projectData.isPublic || false);

        // Load project members
        const projectMembers = await projectsApi.getProjectMembers(projectId);
        setMembers(projectMembers);
      } catch (error) {
        console.error('Failed to load project:', error);
        router.push('/projects');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId, router]);

  // Search users for invitation
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        setIsSearching(true);
        const results = await usersApi.searchUsers(userSearchQuery, 10);

        // Filter out users who are already members
        const memberUserIds = members.map(m => m.userId);
        const filteredResults = results.filter(user => !memberUserIds.includes(user.id));

        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery, members]);

  const isOwner = project?.ownerId === user?.id;
  const currentMember = members.find(m => m.userId === user?.id);
  const canManageProject = isOwner || currentMember?.role === 'MANAGER';

  const handleSaveProject = async () => {
    if (!project || !canManageProject) return;

    try {
      setSaving(true);
      const updatedProject = await projectsApi.updateProject(project.id, {
        name: projectName,
        description: projectDescription,
        isPublic,
      });

      setProject(updatedProject);

      // Update project in store
      const updatedProjects = projects.map((p: Project) =>
        p.id === updatedProject.id ? updatedProject : p
      );
      setProjects(updatedProjects);

      alert('프로젝트 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('프로젝트 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!project || !selectedUser) return;

    try {
      await invitationsApi.createInvitation({
        projectId: project.id,
        inviteeId: selectedUser.id,
        message: '프로젝트에 참여하도록 초대합니다.',
      });

      setSelectedUser(null);
      setUserSearchQuery('');
      setSearchResults([]);
      setShowInviteModal(false);

      alert('초대를 성공적으로 보냈습니다!');
    } catch (error) {
      console.error('Failed to invite member:', error);
      alert('멤버 초대에 실패했습니다.');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'OWNER' | 'MANAGER' | 'MEMBER') => {
    if (!project || !isOwner) return;

    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      await projectsApi.updateMemberRole(project.id, member.userId, newRole);

      // Update local state
      setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m)));
    } catch (error) {
      console.error('Failed to update member role:', error);
      alert('멤버 역할 변경에 실패했습니다.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!project || !canManageProject) return;
    if (!confirm('정말로 이 멤버를 제거하시겠습니까?')) return;

    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      await projectsApi.removeProjectMember(project.id, member.userId);

      // Update local state
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('멤버 제거에 실패했습니다.');
    }
  };

  const getUserColor = (userId: string) => {
    const colors = [
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#06B6D4',
      '#84CC16',
      '#F97316',
      '#EC4899',
      '#6366F1',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getUserColorStyleForUser = (user: User) => {
    if (user.profileColor) {
      return { backgroundColor: user.profileColor };
    }
    return { backgroundColor: getUserColor(user.id) };
  };

  const getUserColorStyle = (member: ProjectMember) => {
    if (member.user?.profileColor) {
      return { backgroundColor: member.user.profileColor };
    }
    return { backgroundColor: getUserColor(member.userId) };
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'MEMBER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'OWNER':
        return '소유자';
      case 'MANAGER':
        return '관리자';
      case 'MEMBER':
        return '멤버';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-500'>프로젝트 설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>프로젝트를 찾을 수 없습니다</h1>
          <Button onClick={() => router.push('/projects')}>프로젝트 목록으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  if (!canManageProject) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Shield className='w-16 h-16 text-gray-300 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>접근 권한이 없습니다</h1>
          <p className='text-gray-600 mb-6'>프로젝트 설정을 관리할 권한이 없습니다.</p>
          <Button onClick={() => router.push(`/projects/${projectId}`)}>프로젝트로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-6xl mx-auto py-8 px-4'>
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
              <h1 className='text-2xl font-bold text-gray-900'>프로젝트 설정</h1>
              <p className='text-gray-600'>{project.name} 프로젝트 관리</p>
            </div>
          </div>

          <Button onClick={handleSaveProject} disabled={saving}>
            <Save className='mr-2 h-4 w-4' />
            {saving ? '저장 중...' : '설정 저장'}
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className='border-b border-gray-200 mb-6'>
          <nav className='-mb-px flex space-x-8'>
            <button
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className='w-4 h-4 inline-block mr-2' />
              일반 설정
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className='w-4 h-4 inline-block mr-2' />
              멤버 관리
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className='w-4 h-4 inline-block mr-2' />
              권한 설정
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-6'>일반 설정</h2>

            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  프로젝트 이름
                </label>
                <input
                  type='text'
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='프로젝트 이름을 입력하세요'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  프로젝트 설명
                </label>
                <textarea
                  rows={4}
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='프로젝트에 대한 설명을 입력하세요'
                />
              </div>

              <div>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                    className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
                  />
                  <span className='ml-3 text-sm font-medium text-gray-700'>
                    {isPublic ? (
                      <>
                        <Globe className='w-4 h-4 inline-block mr-1' />
                        공개 프로젝트
                      </>
                    ) : (
                      <>
                        <Lock className='w-4 h-4 inline-block mr-1' />
                        비공개 프로젝트
                      </>
                    )}
                  </span>
                </label>
                <p className='mt-1 text-sm text-gray-500'>
                  {isPublic
                    ? '모든 사용자가 이 프로젝트를 볼 수 있습니다.'
                    : '프로젝트 멤버만 이 프로젝트를 볼 수 있습니다.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold text-gray-900'>멤버 관리</h2>
              <Button onClick={() => setShowInviteModal(true)}>
                <Plus className='mr-2 h-4 w-4' />
                멤버 초대
              </Button>
            </div>

            <div className='space-y-4'>
              {members.map(member => (
                <div
                  key={member.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                >
                  <div className='flex items-center gap-4'>
                    <div
                      className='w-10 h-10 rounded-full flex items-center justify-center text-white font-medium'
                      style={getUserColorStyle(member)}
                    >
                      {member.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className='font-medium text-gray-900'>
                        {member.user?.name || '알 수 없음'}
                        {member.role === 'OWNER' && (
                          <Crown className='inline-block ml-2 w-4 h-4 text-yellow-500' />
                        )}
                      </h3>
                      <p className='text-sm text-gray-500'>{member.user?.email}</p>
                      <p className='text-xs text-gray-400'>
                        참여일:{' '}
                        {member.joinedAt
                          ? new Date(member.joinedAt).toLocaleDateString('ko-KR')
                          : '알 수 없음'}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}
                    >
                      {getRoleText(member.role)}
                    </span>

                    {isOwner && member.userId !== user?.id && (
                      <div className='flex items-center gap-2'>
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(member.id, e.target.value as any)}
                          className='text-sm border border-gray-300 rounded px-2 py-1'
                        >
                          <option value='MEMBER'>멤버</option>
                          <option value='MANAGER'>관리자</option>
                          <option value='OWNER'>소유자</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className='p-1 text-red-600 hover:bg-red-50 rounded'
                          title='멤버 제거'
                        >
                          <UserX className='w-4 h-4' />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-6'>권한 설정</h2>

            <div className='space-y-6'>
              <div>
                <h3 className='text-md font-medium text-gray-900 mb-3'>역할별 권한</h3>
                <div className='space-y-4'>
                  <div className='p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Crown className='w-4 h-4 text-yellow-500' />
                      <span className='font-medium text-gray-900'>소유자</span>
                    </div>
                    <ul className='text-sm text-gray-600 space-y-1'>
                      <li>• 프로젝트 설정 변경</li>
                      <li>• 멤버 추가/제거</li>
                      <li>• 역할 변경</li>
                      <li>• 프로젝트 삭제</li>
                      <li>• 모든 태스크 관리</li>
                    </ul>
                  </div>

                  <div className='p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Shield className='w-4 h-4 text-blue-500' />
                      <span className='font-medium text-gray-900'>관리자</span>
                    </div>
                    <ul className='text-sm text-gray-600 space-y-1'>
                      <li>• 멤버 추가/제거</li>
                      <li>• 태스크 할당</li>
                      <li>• 프로젝트 설정 일부 변경</li>
                      <li>• 모든 태스크 관리</li>
                    </ul>
                  </div>

                  <div className='p-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Users className='w-4 h-4 text-gray-500' />
                      <span className='font-medium text-gray-900'>멤버</span>
                    </div>
                    <ul className='text-sm text-gray-600 space-y-1'>
                      <li>• 자신에게 할당된 태스크 관리</li>
                      <li>• 태스크 생성</li>
                      <li>• 댓글 작성</li>
                      <li>• 프로젝트 보기</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 초대 모달 */}
        {showInviteModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg max-w-md w-full p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>멤버 초대</h3>

              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>사용자 검색</label>
                <input
                  type='text'
                  placeholder='사용자 이름 또는 이메일로 검색...'
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />

                {/* 검색 결과 */}
                {userSearchQuery && (
                  <div className='mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg'>
                    {isSearching ? (
                      <div className='p-4 text-center text-sm text-gray-500'>검색 중...</div>
                    ) : searchResults.length > 0 ? (
                      <div className='divide-y divide-gray-100'>
                        {searchResults.map(user => (
                          <div
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 ${
                              selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div
                              className='w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium'
                              style={getUserColorStyleForUser(user)}
                            >
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div className='flex-1'>
                              <p className='text-sm font-medium text-gray-900'>{user.name}</p>
                              <p className='text-xs text-gray-500'>{user.email}</p>
                            </div>
                            {selectedUser?.id === user.id && (
                              <Check className='w-4 h-4 text-blue-600' />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='p-4 text-center text-sm text-gray-500'>
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                )}

                {/* 선택된 사용자 */}
                {selectedUser && (
                  <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                    <div className='flex items-center gap-3'>
                      <div
                        className='w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium'
                        style={getUserColorStyleForUser(selectedUser)}
                      >
                        {selectedUser.name?.charAt(0) || 'U'}
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-gray-900'>{selectedUser.name}</p>
                        <p className='text-xs text-gray-500'>{selectedUser.email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className='text-gray-400 hover:text-gray-600'
                      >
                        <UserX className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className='flex justify-end gap-3'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowInviteModal(false);
                    setUserSearchQuery('');
                    setSelectedUser(null);
                    setSearchResults([]);
                  }}
                >
                  취소
                </Button>
                <Button onClick={handleInviteMember} disabled={!selectedUser}>
                  <Mail className='mr-2 h-4 w-4' />
                  초대 보내기
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

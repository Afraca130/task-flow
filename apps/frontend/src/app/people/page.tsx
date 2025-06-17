'use client';

import { Button } from '@/components/ui/button';
import { invitationsApi, Project, ProjectMember, projectsApi, User, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProjectsStore } from '@/store/projects';
import { ArrowLeft, Check, Crown, Mail, Plus, Search, Users, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PeoplePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { projects } = useProjectsStore();
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Load first project by default
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  // Load project members
  useEffect(() => {
    if (!selectedProject) return;

    const loadMembers = async () => {
      try {
        setLoading(true);
        const projectMembers = await projectsApi.getProjectMembers(selectedProject.id);
        setMembers(projectMembers);
      } catch (error) {
        console.error('Failed to load project members:', error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [selectedProject]);

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

  const getUserColorStyle = (member: ProjectMember) => {
    if (member.user?.profileColor) {
      return { backgroundColor: member.user.profileColor };
    }
    return { backgroundColor: getUserColor(member.userId) };
  };

  const getUserColorStyleForUser = (user: User) => {
    if (user.profileColor) {
      return { backgroundColor: user.profileColor };
    }
    return { backgroundColor: getUserColor(user.id) };
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

  const handleInviteMember = async () => {
    if (!selectedProject || !selectedUser) return;

    try {
      await invitationsApi.createInvitation({
        projectId: selectedProject.id,
        inviteeId: selectedUser.id,
        message: '프로젝트에 참여하도록 초대합니다.',
      });

      setSelectedUser(null);
      setUserSearchQuery('');
      setSearchResults([]);
      setShowInviteModal(false);

      alert('초대를 성공적으로 보냈습니다!');

      // Reload members
      const projectMembers = await projectsApi.getProjectMembers(selectedProject.id);
      setMembers(projectMembers);
    } catch (error) {
      console.error('Failed to invite member:', error);
      alert('멤버 초대에 실패했습니다.');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'OWNER' | 'MANAGER' | 'MEMBER') => {
    if (!selectedProject) return;

    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      await projectsApi.updateMemberRole(selectedProject.id, member.userId, newRole);

      // Update local state
      setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m)));
    } catch (error) {
      console.error('Failed to update member role:', error);
      alert('멤버 역할 변경에 실패했습니다.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedProject) return;
    if (!confirm('정말로 이 멤버를 제거하시겠습니까?')) return;

    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      await projectsApi.removeProjectMember(selectedProject.id, member.userId);

      // Update local state
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('멤버 제거에 실패했습니다.');
    }
  };

  const filteredMembers = members.filter(
    member =>
      member.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className='text-2xl font-bold text-gray-900'>팀 멤버</h1>
              <p className='text-gray-600'>프로젝트 멤버를 관리하고 초대하세요</p>
            </div>
          </div>

          <Button onClick={() => setShowInviteModal(true)}>
            <Plus className='mr-2 h-4 w-4' />
            멤버 초대
          </Button>
        </div>

        {/* 프로젝트 선택 */}
        <div className='mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>프로젝트 선택</label>
          <select
            value={selectedProject?.id || ''}
            onChange={e => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project || null);
            }}
            className='block w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value=''>프로젝트를 선택하세요</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <>
            {/* 검색 */}
            <div className='mb-6'>
              <div className='relative max-w-md'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='멤버 검색...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* 멤버 목록 */}
            {loading ? (
              <div className='flex items-center justify-center h-64'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                  <p className='text-gray-500'>멤버를 불러오는 중...</p>
                </div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className='text-center py-12'>
                <Users className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  {searchTerm ? '검색 결과가 없습니다' : '멤버가 없습니다'}
                </h3>
                <p className='text-gray-600 mb-6'>
                  {searchTerm ? '다른 검색어로 시도해보세요.' : '새 멤버를 초대하여 시작해보세요.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowInviteModal(true)}>
                    <Plus className='mr-2 h-4 w-4' />첫 번째 멤버 초대
                  </Button>
                )}
              </div>
            ) : (
              <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
                <div className='px-6 py-4 border-b border-gray-200'>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    팀 멤버 ({filteredMembers.length}명)
                  </h2>
                </div>
                <div className='divide-y divide-gray-200'>
                  {filteredMembers.map(member => (
                    <div key={member.id} className='px-6 py-4 flex items-center justify-between'>
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

                        {user?.id === selectedProject.ownerId && member.userId !== user.id && (
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
          </>
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

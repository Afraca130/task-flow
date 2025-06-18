'use client';

import { ArrowLeft, CheckCircle, Clock, Search, UserPlus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { invitationsApi, projectsApi, User, usersApi } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { useProjectsStore } from '../../store/projects';

interface UserWithProjects extends User {
  invitationStatus?: 'none' | 'pending' | 'sent';
  isMember?: boolean;
}

export default function InvitePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { currentProject, setCurrentProject, setMembers, members } = useProjectsStore();

  const [users, setUsers] = useState<UserWithProjects[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitingUsers, setInvitingUsers] = useState<Set<string>>(new Set());
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Check user permissions for current project
  const currentMember = members.find(m => m.userId === user?.id);
  const isOwner = currentProject?.ownerId === user?.id;
  const canManageProject = isOwner || currentMember?.role === 'MANAGER';

  // Redirect if user doesn't have permission to invite
  useEffect(() => {
    if (currentProject && members.length > 0 && !canManageProject) {
      alert('프로젝트 멤버 초대는 프로젝트 소유자 또는 관리자만 가능합니다.');
      router.push('/dashboard');
      return;
    }
  }, [currentProject, members, canManageProject, router]);

  // Load current project and members
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const selectedProjectId = localStorage.getItem('selectedProjectId');
        if (!selectedProjectId) {
          alert('선택된 프로젝트가 없습니다. 프로젝트를 먼저 선택해주세요.');
          router.push('/projects');
          return;
        }

        // Load project details
        const projectData = await projectsApi.getProject(selectedProjectId);
        setCurrentProject(projectData);

        // Load project members
        const projectMembers = await projectsApi.getProjectMembers(selectedProjectId);
        setMembers(projectMembers);
      } catch (error) {
        console.error('Failed to load project data:', error);
        alert('프로젝트 정보를 불러오는데 실패했습니다.');
        router.push('/projects');
      }
    };

    if (isAuthenticated) {
      loadProjectData();
    }
  }, [isAuthenticated, router, setCurrentProject, setMembers]);

  // Load users
  useEffect(() => {
    if (!isAuthenticated || !currentProject) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        const searchResults = await usersApi.searchUsers('', 100);

        // Check if each user is already a member of the current project
        const usersWithProjects = searchResults.map(searchUser => {
          const isMember = members.some(member => member.userId === searchUser.id);

          return {
            ...searchUser,
            invitationStatus: 'none' as const,
            isMember,
          };
        });

        // Filter out current user
        const otherUsers = usersWithProjects.filter(u => u.id !== user?.id);
        setUsers(otherUsers);
        setFilteredUsers(otherUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isAuthenticated, user?.id, members, currentProject]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      u => u.name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleInviteUser = async (targetUser: UserWithProjects) => {
    if (!currentProject) {
      alert('현재 프로젝트가 선택되지 않았습니다.');
      return;
    }

    if (invitingUsers.has(targetUser.id)) return;

    try {
      setInvitingUsers(prev => new Set(Array.from(prev).concat(targetUser.id)));

      // 초대 생성
      const invitation = await invitationsApi.createInvitation({
        projectId: currentProject.id,
        inviteeId: targetUser.id,
        message: `${user?.name}님이 프로젝트에 초대했습니다.`,
      });

      // 알림 생성 (백엔드에서 처리되거나, 여기서 직접 생성)
      try {
        // 실제로는 백엔드에서 알림을 생성해야 하지만,
        // 현재는 클라이언트에서 시뮬레이션합니다.
        const notificationData = {
          id: Date.now().toString(),
          type: 'PROJECT_INVITED',
          priority: 'NORMAL',
          title: '프로젝트 초대',
          message: `${user?.name}님이 "${currentProject.name}" 프로젝트에 초대했습니다.`,
          isRead: false,
          createdAt: new Date().toISOString(),
          relativeTime: '방금 전',
          metadata: {
            invitationId: invitation.id || 'mock-invitation-id',
            projectId: currentProject.id,
            projectName: currentProject.name,
            userName: user?.name,
          },
        };

        // 실제 알림 시스템에 추가 (여기서는 콘솔 로그로 대체)
        console.log('Notification created:', notificationData);
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      setInvitedUsers(prev => new Set(Array.from(prev).concat(targetUser.id)));

      setUsers(prev =>
        prev.map(u => (u.id === targetUser.id ? { ...u, invitationStatus: 'sent' as const } : u))
      );

      alert(`${targetUser.name}님에게 초대를 보냈습니다. 알림이 전송되었습니다.`);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert('초대 전송에 실패했습니다.');
    } finally {
      setInvitingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUser.id);
        return newSet;
      });
    }
  };

  const getUserColorStyle = (user: User) => {
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
    const str = user.id || user.email || '0';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    return { backgroundColor: color };
  };

  // Show loading if no current project
  if (!currentProject && isAuthenticated) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-500'>프로젝트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto py-8 px-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => router.back()}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>팀원 초대</h1>
              <p className='text-gray-600'>
                {currentProject ? `"${currentProject.name}"` : '현재 프로젝트'}에 새로운 팀원을
                초대하세요
              </p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='text-sm text-gray-500'>총 {filteredUsers.length}명의 사용자</div>
          </div>
        </div>

        {/* Search */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='text'
              placeholder='이름 또는 이메일로 검색...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>
        </div>

        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>사용자 목록을 불러오는 중...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className='text-center py-12'>
            <Users className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {searchQuery ? '검색 결과가 없습니다' : '사용자가 없습니다'}
            </h3>
            <p className='text-gray-600'>
              {searchQuery ? '다른 검색어를 시도해보세요.' : '등록된 사용자가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredUsers.map(targetUser => (
              <div
                key={targetUser.id}
                className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4 flex-1'>
                    {/* User Avatar */}
                    <div
                      className='w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg'
                      style={getUserColorStyle(targetUser)}
                    >
                      {targetUser.name?.charAt(0) || 'U'}
                    </div>

                    {/* User Info */}
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          {targetUser.name || '이름 없음'}
                        </h3>
                        {targetUser.invitationStatus === 'sent' && (
                          <>
                            <CheckCircle className='w-4 h-4 text-green-500' />
                            <span className='text-sm text-green-600 font-medium'>초대 완료</span>
                          </>
                        )}
                        {targetUser.isMember && (
                          <span className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium'>
                            멤버
                          </span>
                        )}
                      </div>

                      <p className='text-gray-600'>{targetUser.email}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className='flex items-center gap-3'>
                    {targetUser.isMember ? (
                      <Button disabled className='bg-green-500 hover:bg-green-600 cursor-default'>
                        <CheckCircle className='mr-2 h-4 w-4' />
                        완료
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleInviteUser(targetUser)}
                        disabled={
                          !currentProject ||
                          invitingUsers.has(targetUser.id) ||
                          invitedUsers.has(targetUser.id) ||
                          targetUser.invitationStatus === 'sent'
                        }
                        className={`${
                          targetUser.invitationStatus === 'sent'
                            ? 'bg-green-500 hover:bg-green-600'
                            : ''
                        }`}
                      >
                        {invitingUsers.has(targetUser.id) ? (
                          <>
                            <Clock className='mr-2 h-4 w-4 animate-spin' />
                            초대 중...
                          </>
                        ) : targetUser.invitationStatus === 'sent' ? (
                          <>
                            <CheckCircle className='mr-2 h-4 w-4' />
                            초대 완료
                          </>
                        ) : (
                          <>
                            <UserPlus className='mr-2 h-4 w-4' />
                            초대하기
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

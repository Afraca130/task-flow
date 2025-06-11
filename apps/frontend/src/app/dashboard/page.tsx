'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectsStore } from '@/store/projects';
import { useAuthStore } from '@/store/auth';
import { Task, Project } from '@/lib/api';
import { 
  Search, 
  Settings, 
  HelpCircle, 
  Plus, 
  Filter, 
  UserPlus, 
  ChevronDown, 
  Menu,
  Upload,
  X,
  Calendar,
  Clock,
  MapPin,
  List,
  Play,
  Users,
  UserCheck,
  Mail,
  BarChart3,
  FileText
} from 'lucide-react';
import { NotificationBell } from '../../components/notifications/notification-bell';

// Mock user data
const mockUser = {
  id: 'user1',
  name: '김민수',
  email: 'kim@example.com',
  profileImage: '',
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
};

// Mock task data for demonstration
const mockTasks = [
  {
    id: 'TM-101',
    title: '사용자 인증 시스템 구현',
    description: 'JWT 토큰 기반 인증 시스템을 구현합니다.',
    status: 'PENDING' as const,
    priority: 'HIGH' as const,
    assigneeId: 'user1',
    assignerId: 'user1',
    projectId: 'project1',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    assignee: { id: 'user1', name: '김민수', email: 'kim@example.com', profileImage: '', isActive: true, createdAt: '', updatedAt: '' }
  },
  {
    id: 'TM-102',
    title: '데이터베이스 스키마 설계',
    description: 'PostgreSQL 데이터베이스 스키마를 설계합니다.',
    status: 'PENDING' as const,
    priority: 'MEDIUM' as const,
    assigneeId: 'user2',
    assignerId: 'user1',
    projectId: 'project1',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    assignee: { id: 'user2', name: '박영희', email: 'park@example.com', profileImage: '', isActive: true, createdAt: '', updatedAt: '' }
  },
  {
    id: 'TM-103',
    title: 'API 문서 작성',
    description: 'Swagger를 사용한 API 문서를 작성합니다.',
    status: 'PENDING' as const,
    priority: 'LOW' as const,
    assigneeId: 'user3',
    assignerId: 'user1',
    projectId: 'project1',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    assignee: { id: 'user3', name: '이철수', email: 'lee@example.com', profileImage: '', isActive: true, createdAt: '', updatedAt: '' }
  },
  {
    id: 'TM-104',
    title: 'Redis 캐시 시스템 구현',
    description: 'Redis를 사용한 캐시 시스템을 구현합니다.',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    assigneeId: 'user4',
    assignerId: 'user1',
    projectId: 'project1',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    assignee: { id: 'user4', name: '최지영', email: 'choi@example.com', profileImage: '', isActive: true, createdAt: '', updatedAt: '' }
  },
  {
    id: 'TM-105',
    title: 'WebSocket 실시간 알림',
    description: 'WebSocket을 사용한 실시간 알림을 구현합니다.',
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    assigneeId: 'user5',
    assignerId: 'user1',
    projectId: 'project1',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    assignee: { id: 'user5', name: '정다은', email: 'jung@example.com', profileImage: '', isActive: true, createdAt: '', updatedAt: '' }
  },
  {
    id: 'TM-106',
    title: '프로젝트 초기 설정',
    description: 'Next.js와 NestJS 프로젝트 초기 설정을 완료합니다.',
    status: 'COMPLETED' as const,
    priority: 'LOW' as const,
    assigneeId: 'user1',
    assignerId: 'user1',
    projectId: 'project1',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    assignee: { id: 'user1', name: '김민수', email: 'kim@example.com', profileImage: '', isActive: true, createdAt: '', updatedAt: '' }
  }
];

const statusColumns = {
  PENDING: { title: '할 일', color: 'bg-purple-100 text-purple-700', bgColor: 'bg-purple-50' },
  IN_PROGRESS: { title: '진행 중', color: 'bg-yellow-100 text-yellow-700', bgColor: 'bg-yellow-50' },
  COMPLETED: { title: '완료', color: 'bg-green-100 text-green-700', bgColor: 'bg-green-50' }
};

const priorityColors = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  LOW: 'bg-green-100 text-green-700'
};

const priorityLabels = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음'
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUserAndToken } = useAuthStore();
  const [tasks, setTasks] = useState(mockTasks);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize mock user if not logged in
  useEffect(() => {
    if (!user) {
      setUserAndToken(mockUser, 'mock-token');
    }
  }, [user, setUserAndToken]);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const getUserInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getUserColor = (userId: string) => {
    const colors = {
      'user1': 'bg-blue-500',
      'user2': 'bg-green-500', 
      'user3': 'bg-purple-500',
      'user4': 'bg-red-500',
      'user5': 'bg-indigo-500'
    };
    return colors[userId as keyof typeof colors] || 'bg-gray-500';
  };

  const handleNavigation = (path: string) => {
    if (path.startsWith('/')) {
      router.push(path);
    } else {
      // Show coming soon message for features not yet implemented
      alert('이 기능은 곧 출시될 예정입니다!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] grid-rows-[56px_1fr] h-screen">
        
        {/* Header */}
        <header className="lg:col-span-2 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="이슈, 보드, 프로젝트 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button 
              onClick={() => handleNavigation('/settings')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button>
            <div 
              onClick={() => handleNavigation('/profile')}
              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors"
            >
              {getUserInitials(user?.name || '')}
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static top-14 left-0 h-full w-60 lg:w-auto z-30`}>
          <div className="p-4 border-b border-gray-200">
            <div 
              onClick={() => handleNavigation('/projects')}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <div className="w-6 h-6 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-semibold">
                TM
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">업무 관리 시스템</div>
                <div className="text-xs text-gray-500">소프트웨어 프로젝트</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <nav className="p-4 space-y-6">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">계획</div>
              <div className="space-y-1">
                <NavItem 
                  icon={<MapPin className="w-4 h-4 text-pink-500" />} 
                  label="로드맵" 
                  onClick={() => handleNavigation('roadmap')} 
                />
                <NavItem 
                  icon={<List className="w-4 h-4 text-blue-500" />} 
                  label="백로그" 
                  onClick={() => handleNavigation('backlog')} 
                />
                <NavItem 
                  icon={<Play className="w-4 h-4 text-green-500" />} 
                  label="활성 스프린트" 
                  active 
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">프로젝트 관리</div>
              <div className="space-y-1">
                <NavItem 
                  icon={<Users className="w-4 h-4 text-orange-500" />} 
                  label="프로젝트 멤버" 
                  onClick={() => handleNavigation('/projects/members')} 
                />
                <NavItem 
                  icon={<UserCheck className="w-4 h-4 text-purple-500" />} 
                  label="역할 관리" 
                  onClick={() => handleNavigation('roles')} 
                />
                <NavItem 
                  icon={<Mail className="w-4 h-4 text-yellow-500" />} 
                  label="멤버 초대" 
                  onClick={() => handleNavigation('invite')} 
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">분석</div>
              <div className="space-y-1">
                <NavItem 
                  icon={<BarChart3 className="w-4 h-4 text-cyan-500" />} 
                  label="대시보드" 
                  onClick={() => handleNavigation('/dashboard')} 
                />
                <NavItem 
                  icon={<FileText className="w-4 h-4 text-violet-500" />} 
                  label="리포트" 
                  onClick={() => handleNavigation('reports')} 
                />
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-900">활성 스프린트</h1>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                필터
              </button>
              <button 
                onClick={() => handleNavigation('invite')}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                사용자 추가
              </button>
              <button
                onClick={() => handleTaskClick(null)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                이슈 생성
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="flex gap-6 overflow-x-auto pb-4">
            {Object.entries(statusColumns).map(([status, config]) => (
              <div key={status} className="min-w-80 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                        {config.title}
                      </span>
                    </div>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {getTasksByStatus(status).length}
                    </span>
                  </div>
                </div>
                
                <div className={`p-4 space-y-3 min-h-48 ${config.bgColor}`}>
                  {getTasksByStatus(status).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => handleTaskClick(task)}
                    />
                  ))}
                  
                  {/* Add Task Button for each column */}
                  <button
                    onClick={() => handleTaskClick({ status })}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm"
                  >
                    + 새 작업 추가
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <List className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">아직 작업이 없습니다</h3>
              <p className="text-gray-500 mb-4">첫 번째 작업을 생성하여 프로젝트를 시작하세요.</p>
              <button
                onClick={() => handleTaskClick(null)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                첫 작업 만들기
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          onClose={closeModal}
          onSave={(updatedTask) => {
            // Handle task save
            console.log('Save task:', updatedTask);
            closeModal();
          }}
        />
      )}
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active = false, 
  onClick 
}: { 
  icon: any; 
  label: string; 
  active?: boolean; 
  onClick?: () => void; 
}) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        active ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}

function TaskCard({ task, onClick }: { task: any; onClick: () => void }) {
  const getUserInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getUserColor = (userId: string) => {
    const colors = {
      'user1': 'bg-blue-500',
      'user2': 'bg-green-500', 
      'user3': 'bg-purple-500',
      'user4': 'bg-red-500',
      'user5': 'bg-indigo-500'
    };
    return colors[userId as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="font-medium text-sm text-gray-900 mb-2">{task.title}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">{task.id}</span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
          {priorityLabels[task.priority as keyof typeof priorityLabels]}
        </span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getUserColor(task.assigneeId)}`}>
          {getUserInitials(task.assignee?.name || '')}
        </div>
      </div>
    </div>
  );
}

function TaskModal({ task, onClose, onSave }: { task: any; onClose: () => void; onSave: (task: any) => void }) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'PENDING',
    priority: task?.priority || 'MEDIUM',
    dueDate: '',
    estimatedHours: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">이슈 상세</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이슈 제목을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                  <textarea
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이슈에 대한 상세 설명을 입력하세요..."
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">댓글</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        김
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3 mb-2">
                          <div className="font-medium text-sm text-gray-900 mb-1">김민수</div>
                          <div className="text-sm text-gray-700">JWT 토큰 기반 인증으로 구현하겠습니다. Redis를 사용해서 세션 관리도 함께 진행할 예정입니다.</div>
                        </div>
                        <div className="text-xs text-gray-500">2시간 전</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        현
                      </div>
                      <textarea
                        rows={3}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="댓글을 입력하세요..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">할 일</option>
                    <option value="IN_PROGRESS">진행 중</option>
                    <option value="COMPLETED">완료</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
                  <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      김
                    </div>
                    <span className="text-sm">김민수</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">낮음</option>
                    <option value="MEDIUM">보통</option>
                    <option value="HIGH">높음</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">마감일</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">예상 시간</label>
                  <input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    placeholder="시간"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">라벨</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">백엔드</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">인증</span>
                  </div>
                  <input
                    type="text"
                    placeholder="라벨 추가..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">첨부파일</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-500">파일을 드래그하거나 클릭하여 업로드</div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">활동 기록</label>
                  <div className="text-xs text-gray-500 space-y-2">
                    <div><strong>김민수</strong>가 이슈를 생성했습니다 - 3시간 전</div>
                    <div><strong>박영희</strong>가 우선순위를 높음으로 변경했습니다 - 2시간 전</div>
                    <div><strong>김민수</strong>가 댓글을 추가했습니다 - 2시간 전</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
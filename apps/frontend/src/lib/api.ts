import axios from 'axios';

// API 기본 설정
const getBaseURL = () => {
  // Production environment - use TaskFlow backend on Vercel
  if (process.env.NODE_ENV === 'production') {
    const productionUrl = 'https://task-flow-backend-pearl.vercel.app/v1';
    console.log('🚀 Production API Base URL:', productionUrl);
    return productionUrl;
  }

  // Development environment
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const fullUrl = `${apiUrl}/api/v1`;
  console.log('🔗 Development API Base URL:', fullUrl);

  return fullUrl;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CORS 이슈 방지
});

console.log('API instance created with baseURL:', api.defaults.baseURL);

// 통합 에러 처리 클래스
class ApiErrorHandler {
  private static instance: ApiErrorHandler;

  static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler();
    }
    return ApiErrorHandler.instance;
  }

  handleError(error: any): Promise<never> {
    console.error('API Error:', error);

    // 네트워크 에러
    if (!error.response) {
      this.showError('네트워크 연결을 확인해주세요.');
      return Promise.reject(new Error('네트워크 오류'));
    }

    const { status, data } = error.response;

    switch (status) {
      case 400:
        this.showError(data?.message || '잘못된 요청입니다.');
        break;
      case 401:
        this.handleUnauthorized();
        break;
      case 403:
        this.showError('접근 권한이 없습니다.');
        break;
      case 404:
        this.showError('요청한 리소스를 찾을 수 없습니다.');
        break;
      case 409:
        this.showError(data?.message || '데이터 충돌이 발생했습니다.');
        break;
      case 422:
        this.showValidationError(data?.details || [data?.message]);
        break;
      case 500:
        this.showError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        break;
      default:
        this.showError(data?.message || '알 수 없는 오류가 발생했습니다.');
    }

    return Promise.reject(error);
  }

  private handleUnauthorized(): void {
    // 토큰 관련 데이터 정리
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');

    // 로그인 페이지로 리다이렉트 (현재 페이지가 이미 로그인 페이지가 아닌 경우에만)
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      console.warn('Authentication failed, redirecting to login...');
      this.showError('로그인이 만료되었습니다. 다시 로그인해주세요.');
      setTimeout(() => {
        window.location.href = '/login?message=session-expired';
      }, 1500);
    }
  }

  private showError(message: string): void {
    // 토스트 알림이나 모달로 에러 표시
    if (typeof window !== 'undefined') {
      // 간단한 alert 대신 더 나은 UI 컴포넌트 사용 가능
      console.error('Error:', message);
      // TODO: 토스트 알림 시스템 구현
    }
  }

  private showValidationError(details: string[]): void {
    const message =
      details.length > 0
        ? `입력 데이터 검증 실패:\n${details.join('\n')}`
        : '입력 데이터를 확인해주세요.';
    this.showError(message);
  }
}

const errorHandler = ApiErrorHandler.getInstance();

// Add token refresh functionality
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth-token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh-token');

      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        localStorage.removeItem('refresh-token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await api.post('/auth/refresh', {
          refreshToken: refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('auth-token', accessToken);
        localStorage.setItem('refresh-token', newRefreshToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        localStorage.removeItem('refresh-token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  profileColor?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  isActive: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  taskCount?: number;
  isPublic?: boolean;
  owner?: User;
  members?: ProjectMember[];
  tasks?: Task[];
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER';
  joinedAt?: string;
  isActive: boolean;
  user?: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  assignerId: string;
  projectId: string;
  dueDate?: string;
  tags?: string[];
  lexoRank: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  assigner?: User;
  project?: Project;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  projectId: string;
  entityId: string;
  entityType: 'Task' | 'Project' | 'User' | 'Comment' | 'ProjectMember';
  action: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string; // timestamp is now createdAt from BaseEntity
  user?: User;
  project?: Project;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  inviterId: string;
  inviteeId?: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  message?: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  inviter?: User;
  invitee?: User;
}

export interface Issue {
  id: string;
  title: string;
  description?: string;
  type: 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'QUESTION' | 'DISCUSSION';
  authorId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
  project?: Project;
}

export interface MetaResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Standard API Response Interface
export interface StandardApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: MetaResponse;
}

// Helper function to extract data from standard response
function extractData<T>(response: { data: StandardApiResponse<T> }): T {
  if (response.data && response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data?.message || 'API response error');
}

// Auth API - Auth는 버전이 없음
export const authApi = {
  login: async (email: string, password: string): Promise<{ accessToken: string; user: User }> => {
    const response = await api.post<StandardApiResponse<{ accessToken: string; user: User }>>(
      '/auth/login',
      { email, password }
    );
    const result = extractData(response);

    // 토큰과 사용자 정보 저장
    if (result.accessToken) {
      localStorage.setItem('auth-token', result.accessToken);
      localStorage.setItem('auth-user', JSON.stringify(result.user));
    }

    return result;
  },

  register: async (
    email: string,
    password: string,
    name: string
  ): Promise<{ user: User; message: string }> => {
    const response = await api.post<StandardApiResponse<{ user: User; message: string }>>(
      '/auth/register',
      { email, password, name }
    );
    return extractData(response);
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<StandardApiResponse<User>>('/auth/profile');
    return extractData(response);
  },

  updateProfile: async (name: string, profileColor: string): Promise<User> => {
    const response = await api.patch<StandardApiResponse<User>>('/auth/profile', {
      name,
      profileColor,
    });
    return extractData(response);
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const response = await api.patch<StandardApiResponse<{ message: string }>>(
      '/auth/change-password',
      {
        currentPassword,
        newPassword,
      }
    );
    return extractData(response);
  },

  logout: () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    window.location.href = '/login';
  },
};

// Projects API
export const projectsApi = {
  getProjects: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    data: Project[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get<StandardApiResponse<Project[]>>('/projects', { params });
    const projects = extractData(response);
    const meta = response.data.meta || {
      total: projects.length,
      page: 1,
      limit: 100,
      totalPages: 1,
    };

    return {
      data: projects,
      meta,
    };
  },

  getAllPublicProjects: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: Project[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get<StandardApiResponse<Project[]>>('/projects?isPublic=true', {
      params,
    });
    const projects = extractData(response);
    const meta = response.data.meta || {
      total: projects.length,
      page: 1,
      limit: 100,
      totalPages: 1,
    };

    return {
      data: projects,
      meta,
    };
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await api.get<StandardApiResponse<Project>>(`/projects/${id}`);
    return extractData(response);
  },

  createProject: async (data: {
    name: string;
    description?: string;
    color?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
  }): Promise<Project> => {
    const response = await api.post<StandardApiResponse<Project>>('/projects', data);
    return extractData(response);
  },

  updateProject: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      isPublic?: boolean;
      color?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      dueDate?: string;
      isActive?: boolean;
    }
  ): Promise<Project> => {
    const response = await api.put<StandardApiResponse<Project>>(`/projects/${id}`, data);
    return extractData(response);
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Project member management
  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await api.get<StandardApiResponse<ProjectMember[]>>(
      `/projects/${projectId}/members`
    );
    return extractData(response);
  },

  updateMemberRole: async (
    projectId: string,
    userId: string,
    role: 'OWNER' | 'MANAGER' | 'MEMBER'
  ): Promise<void> => {
    await api.patch(`/projects/${projectId}/members/${userId}/role`, { role });
  },

  removeProjectMember: async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },

  inviteToProject: async (
    projectId: string,
    data: {
      inviteeId?: string;
      message?: string;
    }
  ): Promise<ProjectInvitation> => {
    const response = await api.post<StandardApiResponse<ProjectInvitation>>('/invitations', {
      projectId,
      ...data,
    });
    return extractData(response);
  },

  getProjectInvitations: async (projectId: string): Promise<ProjectInvitation[]> => {
    const response = await api.get<StandardApiResponse<ProjectInvitation[]>>(
      `/invitations/project/${projectId}`
    );
    return extractData(response);
  },
};

// Tasks API
export const tasksApi = {
  getTasks: async (params?: {
    projectId?: string;
    assigneeId?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
    search?: string;
    page?: number;
    limit?: number;
    lexoRank?: string;
  }): Promise<{ data: Task[]; total: number; page: number; limit: number; totalPages: number }> => {
    const response = await api.get<
      StandardApiResponse<{
        data: Task[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >('/tasks', { params });
    return extractData(response);
  },

  getTasksByProject: async (projectId: string): Promise<Task[]> => {
    const response = await api.get<StandardApiResponse<Task[]>>(`/tasks/project/${projectId}`);
    return extractData(response);
  },

  getTask: async (taskId: string): Promise<Task> => {
    const response = await api.get<StandardApiResponse<Task>>(`/tasks/${taskId}`);
    return extractData(response);
  },

  createTask: async (data: {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
    assigneeId?: string;
    projectId: string;
    dueDate?: string;
    tags?: string[];
  }): Promise<Task> => {
    const response = await api.post<StandardApiResponse<Task>>('/tasks', data);
    return extractData(response);
  },

  updateTask: async (
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      assigneeId?: string;
      dueDate?: string;
      tags?: string[];
      projectId?: string;
    }
  ): Promise<Task> => {
    const response = await api.put<StandardApiResponse<Task>>(`/tasks/${taskId}`, data);
    return extractData(response);
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  updateTaskStatus: async (
    taskId: string,
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  ): Promise<Task> => {
    const response = await api.put<StandardApiResponse<Task>>(`/tasks/${taskId}/status`, {
      status,
    });
    return extractData(response);
  },

  assignTask: async (taskId: string, assigneeId: string): Promise<Task> => {
    const response = await api.put<StandardApiResponse<Task>>(`/tasks/${taskId}`, { assigneeId });
    return extractData(response);
  },

  getAllTasksByProjectAndStatus: async (
    projectId: string,
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Task[]; meta: any }> => {
    const response = await api.get<StandardApiResponse<{ data: Task[]; meta: any }>>(
      `/tasks/project/${projectId}/status/${status}/all`,
      {
        params: { page, limit },
      }
    );
    return extractData(response);
  },
};

// Comments API
export const commentsApi = {
  getTaskComments: async (taskId: string): Promise<Comment[]> => {
    const response = await api.get<StandardApiResponse<Comment[]>>(`/comments/task/${taskId}`);
    return extractData(response);
  },

  createComment: async (data: {
    taskId: string;
    content: string;
    parentId?: string;
  }): Promise<Comment> => {
    const response = await api.post<StandardApiResponse<Comment>>('/comments', data);
    return extractData(response);
  },

  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    const response = await api.put<StandardApiResponse<Comment>>(`/comments/${commentId}`, {
      content,
    });
    return extractData(response);
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await api.get<StandardApiResponse<Notification[]>>('/notifications');
      return extractData(response);
    } catch (error) {
      console.warn('Notifications API not available:', error);
      return [];
    }
  },

  getUnreadCount: async (): Promise<{
    unreadCount: number;
    totalCount: number;
    lastNotificationAt?: string;
  }> => {
    try {
      const response = await api.get<
        StandardApiResponse<{
          unreadCount: number;
          totalCount: number;
          lastNotificationAt?: string;
        }>
      >('/notifications/unread-count');
      return extractData(response);
    } catch (error) {
      console.warn('Unread count API not available:', error);
      return { unreadCount: 0, totalCount: 0 };
    }
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.warn('Mark as read API not available:', error);
    }
  },

  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    try {
      const response = await api.put<StandardApiResponse<{ message: string; count: number }>>(
        '/notifications/mark-all-read'
      );
      return extractData(response);
    } catch (error) {
      console.warn('Mark all as read API not available:', error);
      return { message: 'Failed to mark as read', count: 0 };
    }
  },
};

// Activity Logs API
export const activityLogsApi = {
  getActivityLogs: async (projectId?: string): Promise<ActivityLog[]> => {
    try {
      const params = projectId ? { projectId } : undefined;
      const response = await api.get<StandardApiResponse<ActivityLog[]>>('/activity-logs', {
        params,
      });
      return extractData(response);
    } catch (error) {
      console.warn('Activity logs API not available:', error);
      return [];
    }
  },
};

// User Logs API
export const userLogsApi = {
  getUserLogs: async (params?: {
    page?: number;
    limit?: number;
    actionType?: string;
    level?: string;
  }): Promise<{ data: any[]; meta: any }> => {
    try {
      const response = await api.get<StandardApiResponse<{ data: any[]; meta: any }>>(
        '/user-logs',
        { params }
      );
      return extractData(response);
    } catch (error) {
      console.warn('User logs API not available:', error);
      return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }
  },

  getUserLogsSummary: async (): Promise<any> => {
    try {
      const response = await api.get<StandardApiResponse<any>>('/user-logs/summary');
      return extractData(response);
    } catch (error) {
      console.warn('User logs summary API not available:', error);
      return {};
    }
  },
};

// Users API
export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<StandardApiResponse<User[]>>('/users/active');
    return extractData(response);
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get<StandardApiResponse<User>>(`/users/${id}`);
    return extractData(response);
  },

  searchUsers: async (query: string, limit?: number): Promise<User[]> => {
    const response = await api.get<StandardApiResponse<User[]>>('/users/search', {
      params: { q: query, limit: limit || 10 },
    });
    return extractData(response);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch<StandardApiResponse<User>>(`/users/${id}`, data);
    return extractData(response);
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Issues API
export const issuesApi = {
  getIssues: async (params?: {
    projectId?: string;
    type?: 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'QUESTION' | 'DISCUSSION';
    authorId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: Issue[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response = await api.get<
      StandardApiResponse<{
        data: Issue[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >('/issues', { params });
    return extractData(response);
  },

  getIssue: async (issueId: string): Promise<Issue> => {
    const response = await api.get<StandardApiResponse<Issue>>(`/issues/${issueId}`);
    return extractData(response);
  },

  createIssue: async (data: {
    title: string;
    description?: string;
    type?: 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'QUESTION' | 'DISCUSSION';
    projectId: string;
  }): Promise<Issue> => {
    const response = await api.post<StandardApiResponse<Issue>>('/issues', data);
    return extractData(response);
  },

  createIssueWithMentions: async (data: {
    title: string;
    description?: string;
    type?: 'BUG' | 'FEATURE' | 'IMPROVEMENT' | 'QUESTION' | 'DISCUSSION';
    projectId: string;
    mentionedUserIds?: string[];
  }): Promise<Issue> => {
    const { mentionedUserIds, ...issueData } = data;
    console.log('Creating issue with mentions:', { issueData, mentionedUserIds });
    const response = await api.post<StandardApiResponse<Issue>>('/issues/with-mentions', {
      issue: issueData,
      mentionedUserIds: mentionedUserIds || [],
    });
    return extractData(response);
  },

  updateIssue: async (issueId: string, data: Partial<Issue>): Promise<Issue> => {
    const response = await api.put<StandardApiResponse<Issue>>(`/issues/${issueId}`, data);
    return extractData(response);
  },

  deleteIssue: async (issueId: string): Promise<void> => {
    await api.delete(`/issues/${issueId}`);
  },
};

// Invitations API
export const invitationsApi = {
  createInvitation: async (data: {
    projectId: string;
    inviteeId: string;
    message?: string;
  }): Promise<ProjectInvitation> => {
    const response = await api.post<StandardApiResponse<ProjectInvitation>>('/invitations', data);
    return extractData(response);
  },

  acceptInvitation: async (token: string): Promise<void> => {
    await api.post(`/invitations/${token}/accept`);
  },

  declineInvitation: async (token: string): Promise<void> => {
    await api.post(`/invitations/${token}/decline`);
  },

  getInvitation: async (token: string): Promise<ProjectInvitation> => {
    const response = await api.get<StandardApiResponse<ProjectInvitation>>(`/invitations/${token}`);
    return extractData(response);
  },

  getProjectInvitations: async (projectId: string): Promise<ProjectInvitation[]> => {
    const response = await api.get<StandardApiResponse<ProjectInvitation[]>>(
      `/invitations/project/${projectId}`
    );
    return extractData(response);
  },

  getReceivedInvitations: async (
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  ): Promise<ProjectInvitation[]> => {
    const response = await api.get<StandardApiResponse<ProjectInvitation[]>>(
      '/invitations/user/received',
      {
        params: status ? { status } : {},
      }
    );
    return extractData(response);
  },

  getPendingInvitations: async (): Promise<ProjectInvitation[]> => {
    const response = await api.get<StandardApiResponse<ProjectInvitation[]>>(
      '/invitations/user/pending'
    );
    return extractData(response);
  },

  deleteInvitation: async (id: string): Promise<void> => {
    await api.delete(`/invitations/${id}`);
  },
};

export default api;

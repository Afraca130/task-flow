import axios from 'axios';

// API 기본 설정
const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  isPublic: boolean;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  inviteCode?: string;
  approvalType: 'AUTO' | 'MANUAL';
  createdAt: string;
  updatedAt: string;
  owner?: User;
  creator?: User;
  members?: ProjectMember[];
  tasks?: Task[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'OWNER' | 'MANAGER' | 'MEMBER';
  joinedAt?: string;
  invitedBy?: string;
  isActive: boolean;
  createdAt: string;
  user?: User;
  inviter?: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  assignerId: string;
  projectId: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
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
  parentId?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  parent?: Comment;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  userId: string;
  taskId?: string;
  projectId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  task?: Task;
  project?: Project;
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
  timestamp: string;
  user?: User;
  project?: Project;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  inviterId: string;
  inviteeEmail: string;
  inviteeId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  inviteToken: string;
  expiresAt: string;
  respondedAt?: string;
  createdAt: string;
  project?: Project;
  inviter?: User;
  invitee?: User;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // Backend returns { success, message, data, timestamp }
  },

  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data; // Backend returns { success, message, data, timestamp }
  },

  getProfile: async (): Promise<any> => {
    const response = await api.get('/auth/profile');
    return response.data; // Backend returns { success, message, data, timestamp }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.patch('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  updateProfile: async (name: string, profileImage?: string) => {
    const response = await api.patch('/auth/profile', { name, profileImage });
    return response.data;
  },
};

// Projects API
export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    startDate?: string;
    endDate?: string;
    approvalType?: 'AUTO' | 'MANUAL';
  }): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data;
  },

  addProjectMember: async (projectId: string, email: string): Promise<ProjectMember> => {
    const response = await api.post(`/projects/${projectId}/members`, { email });
    return response.data;
  },

  removeProjectMember: async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },

  updateMemberRole: async (
    projectId: string,
    userId: string,
    role: 'OWNER' | 'MANAGER' | 'MEMBER'
  ): Promise<ProjectMember> => {
    const response = await api.put(`/projects/${projectId}/members/${userId}/role`, { role });
    return response.data;
  },

  inviteToProject: async (projectId: string, email: string): Promise<ProjectInvitation> => {
    const response = await api.post(`/projects/${projectId}/invitations`, { email });
    return response.data;
  },

  getProjectInvitations: async (projectId: string): Promise<ProjectInvitation[]> => {
    const response = await api.get(`/projects/${projectId}/invitations`);
    return response.data;
  },
};

// Tasks API
export const tasksApi = {
  getTasks: async (projectId: string): Promise<Task[]> => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  getTask: async (taskId: string): Promise<Task> => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  createTask: async (data: {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assigneeId?: string;
    projectId: string;
    dueDate?: string;
    estimatedHours?: number;
  }): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  updateTask: async (taskId: string, data: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/${taskId}`, data);
    return response.data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  updateTaskStatus: async (
    taskId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
  ): Promise<Task> => {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  assignTask: async (taskId: string, assigneeId: string): Promise<Task> => {
    const response = await api.patch(`/tasks/${taskId}/assign`, { assigneeId });
    return response.data;
  },

  unassignTask: async (taskId: string): Promise<Task> => {
    const response = await api.patch(`/tasks/${taskId}/unassign`);
    return response.data;
  },
};

// Comments API
export const commentsApi = {
  getTaskComments: async (taskId: string): Promise<Comment[]> => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  createComment: async (data: {
    taskId: string;
    content: string;
    parentId?: string;
  }): Promise<Comment> => {
    const response = await api.post('/comments', data);
    return response.data;
  },

  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },
};

// Activity Logs API
export const activityLogsApi = {
  getProjectActivityLogs: async (projectId: string): Promise<ActivityLog[]> => {
    const response = await api.get(`/projects/${projectId}/activity-logs`);
    return response.data;
  },

  getUserActivityLogs: async (): Promise<ActivityLog[]> => {
    const response = await api.get('/activity-logs');
    return response.data;
  },
};

// Invitations API
export const invitationsApi = {
  getInvitationByToken: async (token: string): Promise<ProjectInvitation> => {
    const response = await api.get(`/invitations/${token}`);
    return response.data;
  },

  acceptInvitation: async (token: string): Promise<void> => {
    await api.post(`/invitations/${token}/accept`);
  },

  rejectInvitation: async (token: string): Promise<void> => {
    await api.post(`/invitations/${token}/reject`);
  },

  getMyInvitations: async (): Promise<ProjectInvitation[]> => {
    const response = await api.get('/invitations/my');
    return response.data;
  },
};

export default api; 
import { Project, ProjectMember, Task } from '@/lib/api';
import { useEffect, useState } from 'react';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  members: ProjectMember[];
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

class ProjectsStore {
  private state: ProjectsState = {
    projects: [],
    currentProject: null,
    members: [],
    tasks: [],
    isLoading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState = (): ProjectsState => {
    return this.state;
  };

  setState = (newState: Partial<ProjectsState>) => {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  };

  subscribe = (listener: () => void) => {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  };

  private notifyListeners = () => {
    this.listeners.forEach(listener => listener());
  };

  // Project actions
  setProjects = (projects: Project[]) => {
    this.setState({ projects });
  };

  addProject = (project: Project) => {
    this.setState({
      projects: [...this.state.projects, project],
    });
  };

  updateProject = (projectId: string, updates: Partial<Project>) => {
    this.setState({
      projects: this.state.projects.map(p =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
      currentProject: this.state.currentProject?.id === projectId
        ? { ...this.state.currentProject, ...updates }
        : this.state.currentProject,
    });
  };

  deleteProject = (projectId: string) => {
    this.setState({
      projects: this.state.projects.filter(p => p.id !== projectId),
      currentProject: this.state.currentProject?.id === projectId
        ? null
        : this.state.currentProject,
    });
  };

  setCurrentProject = (project: Project | null) => {
    this.setState({ currentProject: project });
  };

  // Member actions
  setMembers = (members: ProjectMember[]) => {
    this.setState({ members });
  };

  addMember = (member: ProjectMember) => {
    this.setState({
      members: [...this.state.members, member],
    });
  };

  updateMember = (memberId: string, updates: Partial<ProjectMember>) => {
    this.setState({
      members: this.state.members.map(m =>
        m.id === memberId ? { ...m, ...updates } : m
      ),
    });
  };

  removeMember = (memberId: string) => {
    this.setState({
      members: this.state.members.filter(m => m.id !== memberId),
    });
  };

  // Task actions
  setTasks = (tasks: Task[]) => {
    this.setState({ tasks });
  };

  addTask = (task: Task) => {
    this.setState({
      tasks: [...this.state.tasks, task],
    });
  };

  updateTask = (taskId: string, updates: Partial<Task>) => {
    this.setState({
      tasks: this.state.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    });
  };

  deleteTask = (taskId: string) => {
    this.setState({
      tasks: this.state.tasks.filter(t => t.id !== taskId),
    });
  };

  // UI state actions
  setLoading = (isLoading: boolean) => {
    this.setState({ isLoading });
  };

  setError = (error: string | null) => {
    this.setState({ error });
  };

  // Utility methods
  getProjectById = (projectId: string): Project | undefined => {
    return this.state.projects.find(p => p.id === projectId);
  };

  getMembersByProject = (projectId: string): ProjectMember[] => {
    return this.state.members.filter(m => m.projectId === projectId);
  };

  getTasksByProject = (projectId: string): Task[] => {
    return this.state.tasks.filter(t => t.projectId === projectId);
  };

  getTasksByStatus = (status: string): Task[] => {
    return this.state.tasks.filter(t => t.status === status);
  };

  getUserProjects = (userId: string): Project[] => {
    const userProjectIds = this.state.members
      .filter(m => m.userId === userId)
      .map(m => m.projectId);

    return this.state.projects.filter(p => userProjectIds.includes(p.id));
  };

  // Reset store
  reset = () => {
    this.setState({
      projects: [],
      currentProject: null,
      members: [],
      tasks: [],
      isLoading: false,
      error: null,
    });
  };
}

// Create singleton instance
const projectsStore = new ProjectsStore();

// React hook to use projects store
export const useProjectsStore = () => {
  const [state, setState] = useState(projectsStore.getState());

  useEffect(() => {
    const unsubscribe = projectsStore.subscribe(() => {
      setState(projectsStore.getState());
    });

    return unsubscribe;
  }, []);

  return {
    ...state,
    setProjects: projectsStore.setProjects,
    addProject: projectsStore.addProject,
    updateProject: projectsStore.updateProject,
    deleteProject: projectsStore.deleteProject,
    setCurrentProject: projectsStore.setCurrentProject,
    setMembers: projectsStore.setMembers,
    addMember: projectsStore.addMember,
    updateMember: projectsStore.updateMember,
    removeMember: projectsStore.removeMember,
    setTasks: projectsStore.setTasks,
    addTask: projectsStore.addTask,
    updateTask: projectsStore.updateTask,
    deleteTask: projectsStore.deleteTask,
    setLoading: projectsStore.setLoading,
    setError: projectsStore.setError,
    getProjectById: projectsStore.getProjectById,
    getMembersByProject: projectsStore.getMembersByProject,
    getTasksByProject: projectsStore.getTasksByProject,
    getTasksByStatus: projectsStore.getTasksByStatus,
    getUserProjects: projectsStore.getUserProjects,
    reset: projectsStore.reset,
  };
};

export default projectsStore;

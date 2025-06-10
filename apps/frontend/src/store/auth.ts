import { User, authApi } from '@/lib/api';

// Simple auth state management without external dependencies
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthStore {
  private state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  };

  private listeners: Array<() => void> = [];

  getState = (): AuthState => {
    return this.state;
  };

  setState = (newState: Partial<AuthState>) => {
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

  // Auth actions
  login = async (email: string, password: string) => {
    this.setState({ isLoading: true });
    
    try {
      const response = await authApi.login(email, password);
      
      if (response.success) {
        const { user, token } = response.data;
        
        this.setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', token);
          localStorage.setItem('auth-user', JSON.stringify(user));
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
      
    } catch (error: any) {
      this.setState({ isLoading: false });
      
      // Handle different error types
      if (error.response?.data?.error?.details) {
        // If backend returns validation details, join them
        const details = error.response.data.error.details;
        if (Array.isArray(details)) {
          throw new Error(details.join('\n'));
        }
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('로그인 중 오류가 발생했습니다.');
      }
    }
  };

  register = async (email: string, password: string, name: string) => {
    this.setState({ isLoading: true });
    
    try {
      const response = await authApi.register(email, password, name);
      
      if (response.success) {
        // Registration successful, but don't auto-login
        this.setState({ isLoading: false });
        return response.data;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
      
    } catch (error: any) {
      this.setState({ isLoading: false });
      
      // Handle different error types
      if (error.response?.data?.error?.details) {
        // If backend returns validation details, join them
        const details = error.response.data.error.details;
        if (Array.isArray(details)) {
          throw new Error(details.join('\n'));
        }
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error('회원가입 중 오류가 발생했습니다.');
      }
    }
  };

  setUserAndToken = (user: User, token: string) => {
    this.setState({
      user,
      token,
      isAuthenticated: true,
    });
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
      localStorage.setItem('auth-user', JSON.stringify(user));
    }
  };

  logout = () => {
    this.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
    }
  };

  // Initialize from localStorage
  initialize = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token');
      const userStr = localStorage.getItem('auth-user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.setState({
            user,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Failed to parse user from localStorage:', error);
          this.logout();
        }
      }
    }
  };
}

// Create singleton instance
const authStore = new AuthStore();

// React hook to use auth store
import { useState, useEffect } from 'react';

export const useAuthStore = () => {
  const [state, setState] = useState(authStore.getState());

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setState(authStore.getState());
    });

    // Initialize on mount
    authStore.initialize();

    return unsubscribe;
  }, []);

  return {
    ...state,
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    setUserAndToken: authStore.setUserAndToken,
  };
};

export default authStore; 
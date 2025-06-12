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
      // authApi.login now returns { accessToken: string; user: User } directly
      const { accessToken, user } = await authApi.login(email, password);

      this.setState({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', accessToken);
        localStorage.setItem('auth-user', JSON.stringify(user));
      }

      return { user, token: accessToken };

    } catch (error: any) {
      this.setState({ isLoading: false });

      // Handle different error types
      if (error.response?.data?.details) {
        // Backend standard error response with details
        const details = error.response.data.details;
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
      // authApi.register now returns { user: User; message: string } directly
      const result = await authApi.register(email, password, name);

      // Registration successful, but don't auto-login
      this.setState({ isLoading: false });
      return result;

    } catch (error: any) {
      this.setState({ isLoading: false });

      // Handle different error types
      if (error.response?.data?.details) {
        // Backend standard error response with details
        const details = error.response.data.details;
        if (Array.isArray(details)) {
          throw new Error(details.join('\n'));
        }
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
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

  setUser = (user: User) => {
    this.setState({ user });

    // Update localStorage
    if (typeof window !== 'undefined') {
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

          // 토큰이 있지만 만료되었는지 간단히 확인
          const tokenPayload = this.parseJwtPayload(token);
          const isExpired = tokenPayload && tokenPayload.exp && Date.now() >= tokenPayload.exp * 1000;

          if (isExpired) {
            console.warn('Token expired, clearing auth state');
            this.logout();
            return;
          }

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

  // JWT 페이로드 파싱 헬퍼 메서드
  private parseJwtPayload = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT payload:', error);
      return null;
    }
  };

  // 토큰 유효성 검증 메서드
  isTokenValid = (): boolean => {
    const token = this.state.token;
    if (!token) return false;

    const payload = this.parseJwtPayload(token);
    return payload && payload.exp && Date.now() < payload.exp * 1000;
  };
}

// Create singleton instance
const authStore = new AuthStore();

// React hook to use auth store
import { useEffect, useState } from 'react';

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
    setUser: authStore.setUser,
  };
};

export default authStore;

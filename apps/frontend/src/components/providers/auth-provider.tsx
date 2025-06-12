'use client';

import { useEffect } from 'react';
import authStore from '../../store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize auth store on app startup
  useEffect(() => {
    authStore.initialize();
  }, []);

  return <>{children}</>;
}

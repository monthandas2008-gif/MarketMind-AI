'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UserSession {
  name: string;
  email: string;
  role: string;
  sessionActive: boolean;
  authenticatedAt: string;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

const PUBLIC_ROUTES = ['/', '/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Read cached session on client mount
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('marketmind_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.sessionActive) {
            // Queue state update asynchronously
            queueMicrotask(() => {
              setUser(parsed);
              setIsLoading(false);
            });
            return;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse stored user session:', e);
    }
    queueMicrotask(() => {
      setIsLoading(false);
    });
  }, []);

  // Route protection gatekeeper
  useEffect(() => {
    if (!isLoading) {
      const isPublic = PUBLIC_ROUTES.includes(pathname);
      if (!user && !isPublic) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (email: string, name?: string) => {
    const session: UserSession = {
      name: name || email.split('@')[0],
      email: email,
      role: 'Institutional Research Analyst',
      sessionActive: true,
      authenticatedAt: new Date().toISOString()
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketmind_user', JSON.stringify(session));
    }
    setUser(session);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marketmind_user');
    }
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
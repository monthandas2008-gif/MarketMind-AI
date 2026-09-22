'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from './api';

export interface UserSession {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  token?: string;
  sessionActive: boolean;
  authenticatedAt: string;
}

export interface AuthResult {
  success: boolean;
  status?: 'approved' | 'pending' | 'rejected' | 'error';
  message?: string;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name: string) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false, message: 'Not initialized' }),
  register: async () => ({ success: false, message: 'Not initialized' }),
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
        const token = localStorage.getItem('marketmind_token');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.sessionActive && parsed.status === 'approved') {
            queueMicrotask(() => {
              setUser({ ...parsed, token: token || parsed.token });
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

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.login(cleanEmail, password);

      if (res && res.token && res.user) {
        const session: UserSession = {
          id: res.user.id,
          name: res.user.name || cleanEmail.split('@')[0],
          email: res.user.email,
          role: res.user.role || 'analyst',
          status: res.user.status || 'approved',
          token: res.token,
          sessionActive: true,
          authenticatedAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('marketmind_user', JSON.stringify(session));
          localStorage.setItem('marketmind_token', res.token);
        }
        setUser(session);
        return { success: true, status: 'approved' };
      }

      return { success: false, status: 'error', message: 'Invalid response from authentication server.' };
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify credentials.';
      const isPending = msg.toLowerCase().includes('pending administrator approval');
      const isRejected = msg.toLowerCase().includes('declined') || msg.toLowerCase().includes('rejected');
      
      return {
        success: false,
        status: isPending ? 'pending' : isRejected ? 'rejected' : 'error',
        message: msg,
      };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<AuthResult> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.register(cleanEmail, password, name.trim());

      if (res.status === 'success' && res.token && res.user) {
        // Master admin registered and auto-approved
        const session: UserSession = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role || 'admin',
          status: 'approved',
          token: res.token,
          sessionActive: true,
          authenticatedAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('marketmind_user', JSON.stringify(session));
          localStorage.setItem('marketmind_token', res.token);
        }
        setUser(session);
        return { success: true, status: 'approved', message: res.message };
      }

      // Standard user registered, status pending approval
      return {
        success: false,
        status: 'pending',
        message: res.message || 'Registration submitted. Awaiting administrator approval.',
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'error',
        message: err?.message || 'Registration failed. Please try again.',
      };
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marketmind_user');
      localStorage.removeItem('marketmind_token');
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
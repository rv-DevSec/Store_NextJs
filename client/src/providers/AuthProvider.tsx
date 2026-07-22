'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { IUser } from '@/types';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  login: (credential: string, password: string) => Promise<{ user: IUser; token: string; refreshToken: string }>;
  register: (userData: Record<string, unknown>) => Promise<{ user: IUser; token: string; refreshToken: string }>;
  registerSeller: (userData: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  setUser: (user: IUser | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const getInitialUser = (): IUser | null => {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { return JSON.parse(storedUser); } catch {
        console.error('[AuthProvider] Failed to parse stored user');
        localStorage.removeItem('user');
      }
    }
  }
  return null;
};

const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      const storedUser = getInitialUser();

      if (!token || !storedUser) {
        setReady(true);
        return;
      }

      if (!isTokenExpired(token)) {
        setUser(storedUser);
        setReady(true);
        return;
      }

      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) throw new Error('no refresh token');

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (!res.ok) throw new Error('refresh failed');

        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(storedUser);
      } catch (err) {
        console.error('[AuthProvider] Token refresh failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setReady(true);
      }
    };

    init();
  }, []);

  const loading = !ready;

  const handleAuthResponse = (data: { user: IUser; token: string; refreshToken?: string }) => {
    queryClient.clear();
    localStorage.setItem('token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (credential: string, password: string) => {
    const payload = credential.includes('@') ? { email: credential } : { username: credential };
    const { data } = await api.post('/auth/login', { ...payload, password });
    handleAuthResponse(data);
    return data;
  };

  const register = async (userData: Record<string, unknown>) => {
    const { data } = await api.post('/auth/register', userData);
    handleAuthResponse(data);
    return data;
  };

  const registerSeller = async (userData: Record<string, unknown>) => {
    const { data } = await api.post('/auth/register/seller', userData);
    return data;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.error('[AuthProvider] Logout error:', err);
    }
    queryClient.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerSeller, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

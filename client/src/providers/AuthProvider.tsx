'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
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
      try { return JSON.parse(storedUser); } catch { /* ignore */ }
    }
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(getInitialUser);
  const queryClient = useQueryClient();

  const loading = typeof window !== 'undefined' && !localStorage.getItem('token') ? false : !user;

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
    } catch {
      // ignore
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

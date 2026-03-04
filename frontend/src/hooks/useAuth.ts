'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import axiosInstance from '@/lib/axios';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, login, logout: storeLogout } = useAuthStore();

  const loginFn = useCallback(
    async (payload: LoginPayload) => {
      const { data } = await axiosInstance.post('/auth/login', payload);
      login(data.user, data.accessToken, data.refreshToken);
      router.push('/dashboard');
      return data;
    },
    [login, router],
  );

  const registerFn = useCallback(
    async (payload: RegisterPayload) => {
      const { data } = await axiosInstance.post('/auth/register', payload);
      login(data.user, data.accessToken, data.refreshToken);
      router.push('/dashboard');
      return data;
    },
    [login, router],
  );

  const logoutFn = useCallback(() => {
    storeLogout();
    router.push('/auth/login');
  }, [storeLogout, router]);

  return {
    user,
    accessToken,
    isAuthenticated,
    login: loginFn,
    register: registerFn,
    logout: logoutFn,
  };
}

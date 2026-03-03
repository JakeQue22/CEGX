'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { useSettingsStore } from '@/store/settingsStore';
import { CompanySettings } from '@/types';

export function useSettings() {
  const queryClient = useQueryClient();
  const { setSettings, settings } = useSettingsStore();

  const { isLoading } = useQuery<CompanySettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/settings');
      setSettings(data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateSettings = useMutation({
    mutationFn: (payload: Partial<CompanySettings>) =>
      axiosInstance.patch('/settings', payload).then((r) => r.data),
    onSuccess: (data) => {
      setSettings(data);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return { settings, isLoading, updateSettings };
}

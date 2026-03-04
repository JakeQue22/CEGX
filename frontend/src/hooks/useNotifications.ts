'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Notification } from '@/types';

interface PaginatedNotifications {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedNotifications>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/notifications');
      return data;
    },
    refetchInterval: 30_000, // poll every 30s
  });

  const notifications: Notification[] = Array.isArray(data) ? data : (data?.items ?? []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useMutation({
    mutationFn: (id: string) => axiosInstance.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => axiosInstance.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
}

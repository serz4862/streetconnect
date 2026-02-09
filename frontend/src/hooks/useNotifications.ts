import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Notification } from '@/types';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const useNotificationsList = (params?: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
  }) => {
    return useQuery({
      queryKey: ['notifications', params],
      queryFn: async () => {
        const response: any = await apiService.getNotifications(params);
        return {
          notifications: response.notifications as Notification[],
          total: response.total,
          unread_count: response.unread_count,
        };
      },
      refetchInterval: 30000, // Refetch every 30 seconds
    });
  };

  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: (id: string) => apiService.markNotificationAsRead(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });
  };

  const useMarkAllAsRead = () => {
    return useMutation({
      mutationFn: () => apiService.markAllNotificationsAsRead(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });
  };

  const useDeleteNotification = () => {
    return useMutation({
      mutationFn: (id: string) => apiService.deleteNotification(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });
  };

  const useUnreadCount = () => {
    return useQuery({
      queryKey: ['notifications', 'unread-count'],
      queryFn: async () => {
        const response: any = await apiService.getUnreadNotificationCount();
        return response.unread_count as number;
      },
      refetchInterval: 30000,
    });
  };

  return {
    useNotificationsList,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
    useUnreadCount,
  };
};
